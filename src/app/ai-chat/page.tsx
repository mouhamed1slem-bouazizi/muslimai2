'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/app/providers';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Send, Bot, User, Loader2, History, Search, Calendar, Trash2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  generateAIResponse, 
  createMessage, 
  getWelcomeMessage, 
  formatMessageTime,
  type ChatMessage 
} from '@/lib/ai-chat-service';
import { 
  chatHistoryService, 
  type ChatSession, 
  type ChatHistoryFilter,
  type PaginationOptions 
} from '@/lib/chat-history-service';
import toast from 'react-hot-toast';

export default function AIChatPage() {
  const { language } = useApp();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<{ from?: Date; to?: Date }>({});
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message when language changes
    const welcomeMessage = getWelcomeMessage(language);
    setMessages([welcomeMessage]);
    
    // Start a new session if user is authenticated
    if (user && !currentSessionId) {
      startNewSession();
    }
  }, [language, user]);

  useEffect(() => {
    // Load chat history when user is authenticated
    if (user && showHistory) {
      loadChatHistory();
    }
  }, [user, showHistory]);

  const startNewSession = async () => {
    if (!user) return;
    
    try {
      const welcomeMessage = getWelcomeMessage(language);
      const sessionId = await chatHistoryService.createSession(user, language, welcomeMessage);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;
    
    setHistoryLoading(true);
    try {
      const filter: ChatHistoryFilter = {
        searchQuery: searchQuery || undefined,
        dateFrom: dateFilter.from,
        dateTo: dateFilter.to,
        language: language
      };
      
      const result = await chatHistoryService.getChatSessions(
        user.uid,
        { pageSize: 20 },
        Object.keys(filter).length > 1 ? filter : undefined
      );
      
      setChatSessions(result.sessions);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error(language === 'ar' ? 'فشل في تحميل السجل' : 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveMessageToHistory = async (message: ChatMessage) => {
    if (!user || !currentSessionId) return;
    
    try {
      await chatHistoryService.addMessageToSession(currentSessionId, message, user.uid);
    } catch (error) {
      console.error('Failed to save message:', error);
      // Don't show error to user for background saves
    }
  };

  const loadSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      const session = await chatHistoryService.getSession(sessionId, user.uid);
      if (session) {
        setMessages(session.messages);
        setCurrentSessionId(sessionId);
        setShowHistory(false);
        toast.success(language === 'ar' ? 'تم تحميل المحادثة' : 'Conversation loaded');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error(language === 'ar' ? 'فشل في تحميل المحادثة' : 'Failed to load conversation');
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      await chatHistoryService.deleteSession(sessionId, user.uid);
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([getWelcomeMessage(language)]);
        startNewSession();
      }
      
      toast.success(language === 'ar' ? 'تم حذف المحادثة' : 'Conversation deleted');
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error(language === 'ar' ? 'فشل في حذف المحادثة' : 'Failed to delete conversation');
    }
  };

  const toggleSessionExpansion = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = createMessage(input, true);
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to history
    await saveMessageToHistory(userMessage);
    
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(input, language);
      const aiMessage = createMessage(aiResponse.message, false);
      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI message to history
      await saveMessageToHistory(aiMessage);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = createMessage(
        language === 'ar' 
          ? 'عذراً، حدث خطأ في الحصول على الرد. يرجى المحاولة مرة أخرى.'
          : 'Sorry, there was an error getting a response. Please try again.',
        false
      );
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message to history
      await saveMessageToHistory(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Title and History Toggle */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white font-amiri">
              {language === 'ar' ? 'المساعد الذكي الإسلامي' : 'Islamic AI Assistant'}
            </h1>
            {user && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <History className="w-4 h-4" />
                {language === 'ar' ? 'السجل' : 'History'}
              </button>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'ar' 
              ? 'اسأل أي سؤال متعلق بالإسلام والدين' 
              : 'Ask any question related to Islam and religion'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Section */}
          <div className={`${showHistory ? 'lg:col-span-2' : 'lg:col-span-3'} transition-all duration-300`}>
            {/* Chat Container */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.isUser 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.isUser
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70 ${
                        language === 'ar' ? 'text-right' : 'text-left'
                      }`}>
                        {formatMessageTime(message.timestamp, language)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-2xl rounded-bl-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-300" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {language === 'ar' ? 'جاري الكتابة...' : 'Typing...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={language === 'ar' 
                      ? 'اكتب سؤالك الإسلامي هنا...' 
                      : 'Type your Islamic question here...'}
                    className={`flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* History Section */}
          {showHistory && user && (
            <div className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                {/* History Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'سجل المحادثات' : 'Chat History'}
                  </h2>
                  
                  {/* Search and Filter */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={language === 'ar' ? 'البحث في المحادثات...' : 'Search conversations...'}
                        className={`w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${
                          language === 'ar' ? 'text-right' : 'text-left'
                        }`}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateFilter.from ? dateFilter.from.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateFilter(prev => ({ 
                          ...prev, 
                          from: e.target.value ? new Date(e.target.value) : undefined 
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <input
                        type="date"
                        value={dateFilter.to ? dateFilter.to.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateFilter(prev => ({ 
                          ...prev, 
                          to: e.target.value ? new Date(e.target.value) : undefined 
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    
                    <button
                      onClick={loadChatHistory}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                    >
                      {language === 'ar' ? 'تطبيق الفلتر' : 'Apply Filter'}
                    </button>
                  </div>
                </div>

                {/* History List */}
                <div className="h-96 overflow-y-auto">
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    </div>
                  ) : chatSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                      <MessageSquare className="w-8 h-8 mb-2" />
                      <p className="text-sm">
                        {language === 'ar' ? 'لا توجد محادثات' : 'No conversations'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {chatSessions.map((session) => (
                        <div
                          key={session.id}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Session Header */}
                          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {session.messages[1]?.content.substring(0, 30) || 
                                 (language === 'ar' ? 'محادثة جديدة' : 'New conversation')}...
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatMessageTime(session.startTime, language)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleSessionExpansion(session.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                {expandedSessions.has(session.id) ? 
                                  <ChevronUp className="w-4 h-4" /> : 
                                  <ChevronDown className="w-4 h-4" />
                                }
                              </button>
                              <button
                                onClick={() => loadSession(session.id)}
                                className="p-1 text-emerald-600 hover:text-emerald-700"
                                title={language === 'ar' ? 'تحميل المحادثة' : 'Load conversation'}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteSession(session.id)}
                                className="p-1 text-red-600 hover:text-red-700"
                                title={language === 'ar' ? 'حذف المحادثة' : 'Delete conversation'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Expanded Session Content */}
                          {expandedSessions.has(session.id) && (
                            <div className="p-3 max-h-40 overflow-y-auto">
                              <div className="space-y-2">
                                {session.messages.slice(0, 4).map((msg, idx) => (
                                  <div key={idx} className={`text-xs p-2 rounded ${
                                    msg.isUser 
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200' 
                                      : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                  }`}>
                                    <p className="truncate">{msg.content}</p>
                                  </div>
                                ))}
                                {session.messages.length > 4 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    +{session.messages.length - 4} {language === 'ar' ? 'رسائل أخرى' : 'more messages'}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {language === 'ar'
              ? 'هذا المساعد الذكي متخصص في الأسئلة الإسلامية فقط. يرجى التحقق من الإجابات مع العلماء المختصين.'
              : 'This AI assistant specializes in Islamic questions only. Please verify answers with qualified scholars.'}
          </p>
        </div>
      </div>
    </div>
  );
}