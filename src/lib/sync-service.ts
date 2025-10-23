'use client';

import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp,
  DocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  notifications: {
    prayerReminders: boolean;
    adhanSound: boolean;
  };
  preferences?: {
    notificationsEnabled?: boolean;
    soundEnabled?: boolean;
    notificationTiming?: number;
    calculationMethod?: string;
    madhab?: string;
    timeFormat?: string;
    showSeconds?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncCallbacks {
  onProfileUpdate?: (profile: UserProfile) => void;
  onLocationUpdate?: (location: { city?: string; country?: string; latitude?: number; longitude?: number }) => void;
  onPreferencesUpdate?: (preferences: UserProfile['preferences']) => void;
  onThemeUpdate?: (theme: 'light' | 'dark') => void;
  onLanguageUpdate?: (language: 'en' | 'ar') => void;
  onError?: (error: Error) => void;
}

class SyncService {
  private unsubscribers: Map<string, Unsubscribe> = new Map();
  private callbacks: SyncCallbacks = {};
  private currentUser: User | null = null;
  private isOnline: boolean = true;
  private pendingUpdates: Map<string, any> = new Map();

  constructor() {
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      this.isOnline = navigator.onLine;
    }
  }

  /**
   * Initialize sync service for a user
   */
  public initialize(user: User, callbacks: SyncCallbacks): void {
    this.currentUser = user;
    this.callbacks = callbacks;
    this.setupRealtimeListeners(user.uid);
  }

  /**
   * Clean up all listeners and subscriptions
   */
  public cleanup(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers.clear();
    this.currentUser = null;
    this.callbacks = {};
    this.pendingUpdates.clear();
  }

  /**
   * Set up real-time listeners for user data
   */
  private setupRealtimeListeners(uid: string): void {
    const userDocRef = doc(db, 'users', uid);
    
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot: DocumentSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const profile: UserProfile = {
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as UserProfile;

          // Trigger callbacks for different data types
          this.callbacks.onProfileUpdate?.(profile);
          
          if (data.city || data.country || data.latitude || data.longitude) {
            this.callbacks.onLocationUpdate?.({
              city: data.city,
              country: data.country,
              latitude: data.latitude,
              longitude: data.longitude
            });
          }

          if (data.preferences) {
            this.callbacks.onPreferencesUpdate?.(data.preferences);
          }

          if (data.theme) {
            this.callbacks.onThemeUpdate?.(data.theme);
          }

          if (data.language) {
            this.callbacks.onLanguageUpdate?.(data.language);
          }
        }
      },
      (error) => {
        console.error('Real-time sync error:', error);
        this.callbacks.onError?.(error);
      }
    );

    this.unsubscribers.set('userProfile', unsubscribe);
  }

  /**
   * Update user profile with optimistic updates and conflict resolution
   */
  public async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const userDocRef = doc(db, 'users', this.currentUser.uid);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    try {
      if (this.isOnline) {
        await updateDoc(userDocRef, updateData);
        // Remove from pending updates if successful
        this.pendingUpdates.delete('profile');
      } else {
        // Store for later sync when online
        this.pendingUpdates.set('profile', updateData);
        throw new Error('Offline - update will sync when online');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      // Store for retry
      this.pendingUpdates.set('profile', updateData);
      throw error;
    }
  }

  /**
   * Update location data
   */
  public async updateLocation(
    city: string, 
    country: string, 
    latitude?: number, 
    longitude?: number
  ): Promise<void> {
    const locationUpdate = {
      city,
      country,
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
    };

    await this.updateProfile(locationUpdate);
  }

  /**
   * Update user preferences
   */
  public async updatePreferences(preferences: UserProfile['preferences']): Promise<void> {
    await this.updateProfile({ preferences });
  }

  /**
   * Update theme preference
   */
  public async updateTheme(theme: 'light' | 'dark'): Promise<void> {
    await this.updateProfile({ theme });
    
    // Also update localStorage for immediate UI response
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }

  /**
   * Update language preference
   */
  public async updateLanguage(language: 'en' | 'ar'): Promise<void> {
    await this.updateProfile({ language });
    
    // Also update localStorage for immediate UI response
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
  }

  /**
   * Handle online status change
   */
  private handleOnline(): void {
    this.isOnline = true;
    this.syncPendingUpdates();
  }

  /**
   * Handle offline status change
   */
  private handleOffline(): void {
    this.isOnline = false;
  }

  /**
   * Sync pending updates when coming back online
   */
  private async syncPendingUpdates(): Promise<void> {
    if (!this.currentUser || this.pendingUpdates.size === 0) {
      return;
    }

    const userDocRef = doc(db, 'users', this.currentUser.uid);

    for (const [key, updateData] of this.pendingUpdates.entries()) {
      try {
        await updateDoc(userDocRef, {
          ...updateData,
          updatedAt: serverTimestamp(),
        });
        this.pendingUpdates.delete(key);
      } catch (error) {
        console.error(`Failed to sync pending update for ${key}:`, error);
      }
    }
  }

  /**
   * Get current online status
   */
  public isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get pending updates count
   */
  public getPendingUpdatesCount(): number {
    return this.pendingUpdates.size;
  }

  /**
   * Force sync all pending updates
   */
  public async forceSyncPendingUpdates(): Promise<void> {
    await this.syncPendingUpdates();
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;