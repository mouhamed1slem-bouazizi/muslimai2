'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

// Types and Interfaces
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: {
    processingTime?: number;
    messageType?: 'islamic' | 'rejected' | 'error';
    language?: 'en' | 'ar';
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  startTime: Date;
  endTime?: Date;
  lastActivity: Date;
  messageCount: number;
  isActive: boolean;
  language: 'en' | 'ar';
  tags?: string[];
  metadata?: {
    totalProcessingTime?: number;
    averageResponseTime?: number;
    topicCategories?: string[];
  };
}

export interface ChatHistoryFilter {
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
  language?: 'en' | 'ar';
  messageType?: 'islamic' | 'rejected' | 'error';
  tags?: string[];
}

export interface PaginationOptions {
  pageSize: number;
  lastDoc?: QueryDocumentSnapshot;
}

export interface ChatHistoryResult {
  sessions: ChatSession[];
  hasMore: boolean;
  lastDoc?: QueryDocumentSnapshot;
  totalCount?: number;
}

class ChatHistoryService {
  private readonly COLLECTION_NAME = 'chat_sessions';
  private activeListeners: Map<string, Unsubscribe> = new Map();
  private cache: Map<string, ChatSession[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Create a new chat session
   */
  async createSession(
    user: User,
    language: 'en' | 'ar',
    initialMessage?: ChatMessage
  ): Promise<string> {
    try {
      const sessionData = {
        userId: user.uid,
        title: this.generateSessionTitle(initialMessage?.content, language),
        messages: initialMessage ? [this.serializeMessage(initialMessage)] : [],
        startTime: serverTimestamp(),
        lastActivity: serverTimestamp(),
        messageCount: initialMessage ? 1 : 0,
        isActive: true,
        language,
        tags: initialMessage ? this.extractTags(initialMessage.content) : [],
        metadata: {
          totalProcessingTime: 0,
          averageResponseTime: 0,
          topicCategories: []
        }
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), sessionData);
      this.invalidateCache(user.uid);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw new Error('Failed to create chat session');
    }
  }

  /**
   * Add a message to an existing session
   */
  async addMessageToSession(
    sessionId: string,
    message: ChatMessage,
    userId: string
  ): Promise<void> {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data();
      if (sessionData.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      const serializedMessage = this.serializeMessage(message);
      const updatedMessages = [...(sessionData.messages || []), serializedMessage];
      
      // Update metadata
      const processingTime = message.metadata?.processingTime || 0;
      const currentTotal = sessionData.metadata?.totalProcessingTime || 0;
      const currentCount = sessionData.messageCount || 0;
      const newTotal = currentTotal + processingTime;
      const newAverage = currentCount > 0 ? newTotal / (currentCount + 1) : processingTime;

      await updateDoc(sessionRef, {
        messages: updatedMessages,
        lastActivity: serverTimestamp(),
        messageCount: updatedMessages.length,
        'metadata.totalProcessingTime': newTotal,
        'metadata.averageResponseTime': newAverage,
        tags: this.extractTags(message.content, sessionData.tags || [])
      });

      this.invalidateCache(userId);
    } catch (error) {
      console.error('Error adding message to session:', error);
      throw new Error('Failed to add message to session');
    }
  }

  /**
   * Get chat sessions with pagination and filtering
   */
  async getChatSessions(
    userId: string,
    options: PaginationOptions = { pageSize: 10 },
    filter?: ChatHistoryFilter
  ): Promise<ChatHistoryResult> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(userId, options, filter);
      if (this.isCacheValid(cacheKey)) {
        const cachedSessions = this.cache.get(cacheKey) || [];
        return {
          sessions: cachedSessions,
          hasMore: cachedSessions.length === options.pageSize,
          totalCount: cachedSessions.length
        };
      }

      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('lastActivity', 'desc')
      );

      // Apply filters
      if (filter) {
        if (filter.language) {
          q = query(q, where('language', '==', filter.language));
        }
        if (filter.dateFrom) {
          q = query(q, where('lastActivity', '>=', Timestamp.fromDate(filter.dateFrom)));
        }
        if (filter.dateTo) {
          q = query(q, where('lastActivity', '<=', Timestamp.fromDate(filter.dateTo)));
        }
      }

      // Apply pagination
      q = query(q, limit(options.pageSize + 1));
      if (options.lastDoc) {
        q = query(q, startAfter(options.lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const sessions: ChatSession[] = [];
      let hasMore = false;
      let lastDoc: QueryDocumentSnapshot | undefined;

      querySnapshot.docs.forEach((doc, index) => {
        if (index < options.pageSize) {
          const session = this.deserializeSession(doc);
          
          // Apply client-side filters that can't be done in Firestore
          if (this.matchesFilter(session, filter)) {
            sessions.push(session);
          }
          lastDoc = doc;
        } else {
          hasMore = true;
        }
      });

      // Cache the results
      this.cache.set(cacheKey, sessions);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return {
        sessions,
        hasMore,
        lastDoc,
        totalCount: sessions.length
      };
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      throw new Error('Failed to load chat history');
    }
  }

  /**
   * Get a specific chat session by ID
   */
  async getSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        return null;
      }

      const sessionData = sessionDoc.data();
      if (sessionData.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      return this.deserializeSession(sessionDoc);
    } catch (error) {
      console.error('Error getting session:', error);
      throw new Error('Failed to load session');
    }
  }

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data();
      if (sessionData.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      await deleteDoc(sessionRef);
      this.invalidateCache(userId);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    }
  }

  /**
   * Delete multiple sessions
   */
  async deleteSessions(sessionIds: string[], userId: string): Promise<void> {
    try {
      const deletePromises = sessionIds.map(id => this.deleteSession(id, userId));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting sessions:', error);
      throw new Error('Failed to delete sessions');
    }
  }

  /**
   * Update session title
   */
  async updateSessionTitle(sessionId: string, title: string, userId: string): Promise<void> {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data();
      if (sessionData.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      await updateDoc(sessionRef, { title });
      this.invalidateCache(userId);
    } catch (error) {
      console.error('Error updating session title:', error);
      throw new Error('Failed to update session title');
    }
  }

  /**
   * End a chat session
   */
  async endSession(sessionId: string, userId: string): Promise<void> {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      await updateDoc(sessionRef, {
        isActive: false,
        endTime: serverTimestamp()
      });
      this.invalidateCache(userId);
    } catch (error) {
      console.error('Error ending session:', error);
      throw new Error('Failed to end session');
    }
  }

  /**
   * Search sessions by content
   */
  async searchSessions(
    userId: string,
    searchQuery: string,
    options: PaginationOptions = { pageSize: 10 }
  ): Promise<ChatHistoryResult> {
    try {
      // Get all sessions first (we'll need to search message content client-side)
      const allSessions = await this.getChatSessions(userId, { pageSize: 100 });
      
      const filteredSessions = allSessions.sessions.filter(session => {
        const titleMatch = session.title.toLowerCase().includes(searchQuery.toLowerCase());
        const messageMatch = session.messages.some(message => 
          message.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return titleMatch || messageMatch;
      });

      // Apply pagination to filtered results
      const startIndex = 0; // For simplicity, starting from beginning
      const endIndex = Math.min(startIndex + options.pageSize, filteredSessions.length);
      const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

      return {
        sessions: paginatedSessions,
        hasMore: endIndex < filteredSessions.length,
        totalCount: filteredSessions.length
      };
    } catch (error) {
      console.error('Error searching sessions:', error);
      throw new Error('Failed to search sessions');
    }
  }

  /**
   * Listen to real-time updates for user's sessions
   */
  subscribeToSessions(
    userId: string,
    callback: (sessions: ChatSession[]) => void,
    filter?: ChatHistoryFilter
  ): Unsubscribe {
    let q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('lastActivity', 'desc'),
      limit(20)
    );

    if (filter?.language) {
      q = query(q, where('language', '==', filter.language));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => this.deserializeSession(doc));
      callback(sessions);
    });

    this.activeListeners.set(userId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Clean up listeners and cache
   */
  cleanup(userId?: string): void {
    if (userId) {
      const listener = this.activeListeners.get(userId);
      if (listener) {
        listener();
        this.activeListeners.delete(userId);
      }
      this.invalidateCache(userId);
    } else {
      // Clean up all listeners
      this.activeListeners.forEach(unsubscribe => unsubscribe());
      this.activeListeners.clear();
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  // Private helper methods
  private serializeMessage(message: ChatMessage): any {
    return {
      id: message.id,
      content: message.content,
      isUser: message.isUser,
      timestamp: Timestamp.fromDate(message.timestamp),
      metadata: message.metadata || {}
    };
  }

  private deserializeMessage(data: any): ChatMessage {
    return {
      id: data.id,
      content: data.content,
      isUser: data.isUser,
      timestamp: data.timestamp?.toDate() || new Date(),
      metadata: data.metadata
    };
  }

  private deserializeSession(doc: DocumentSnapshot): ChatSession {
    const data = doc.data()!;
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      messages: (data.messages || []).map((msg: any) => this.deserializeMessage(msg)),
      startTime: data.startTime?.toDate() || new Date(),
      endTime: data.endTime?.toDate(),
      lastActivity: data.lastActivity?.toDate() || new Date(),
      messageCount: data.messageCount || 0,
      isActive: data.isActive ?? true,
      language: data.language || 'en',
      tags: data.tags || [],
      metadata: data.metadata || {}
    };
  }

  private generateSessionTitle(content?: string, language: 'en' | 'ar' = 'en'): string {
    if (!content) {
      return language === 'ar' ? 'محادثة جديدة' : 'New Conversation';
    }

    const words = content.split(' ').slice(0, 6);
    const title = words.join(' ');
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  }

  private extractTags(content: string, existingTags: string[] = []): string[] {
    const islamicKeywords = [
      'prayer', 'salah', 'quran', 'hadith', 'prophet', 'muhammad', 'allah',
      'islam', 'muslim', 'ramadan', 'hajj', 'zakat', 'fasting', 'mosque',
      'صلاة', 'قرآن', 'حديث', 'نبي', 'محمد', 'الله', 'إسلام', 'مسلم',
      'رمضان', 'حج', 'زكاة', 'صيام', 'مسجد'
    ];

    const contentLower = content.toLowerCase();
    const newTags = islamicKeywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase()) && 
      !existingTags.includes(keyword)
    );

    return [...existingTags, ...newTags].slice(0, 10); // Limit to 10 tags
  }

  private matchesFilter(session: ChatSession, filter?: ChatHistoryFilter): boolean {
    if (!filter) return true;

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const titleMatch = session.title.toLowerCase().includes(query);
      const messageMatch = session.messages.some(msg => 
        msg.content.toLowerCase().includes(query)
      );
      if (!titleMatch && !messageMatch) return false;
    }

    if (filter.language && session.language !== filter.language) {
      return false;
    }

    if (filter.messageType) {
      const hasMessageType = session.messages.some(msg => 
        msg.metadata?.messageType === filter.messageType
      );
      if (!hasMessageType) return false;
    }

    if (filter.tags && filter.tags.length > 0) {
      const hasTag = filter.tags.some(tag => session.tags?.includes(tag));
      if (!hasTag) return false;
    }

    return true;
  }

  private getCacheKey(
    userId: string, 
    options: PaginationOptions, 
    filter?: ChatHistoryFilter
  ): string {
    return `${userId}_${options.pageSize}_${JSON.stringify(filter || {})}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  private invalidateCache(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(userId));
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    });
  }
}

// Export singleton instance
export const chatHistoryService = new ChatHistoryService();
export default chatHistoryService;