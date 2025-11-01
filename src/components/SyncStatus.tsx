'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/app/providers';

export default function SyncStatus() {
  const { isOnline, pendingUpdates, forceSyncPendingUpdates } = useAuth();
  const { language, theme } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleForceSync = async () => {
    if (pendingUpdates === 0 || !isOnline) return;
    
    setIsSyncing(true);
    try {
      await forceSyncPendingUpdates();
    } catch (error) {
      // Replace noisy console error with centralized logger
      // Using warn since this is a recoverable UI action
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      import('@/lib/logger').then(({ logger }) => logger.warn('Force sync failed:', err));
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (pendingUpdates > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) {
      return language === 'ar' ? 'غير متصل' : 'Offline';
    }
    if (pendingUpdates > 0) {
      return language === 'ar' 
        ? `${pendingUpdates} تحديث في الانتظار` 
        : `${pendingUpdates} pending updates`;
    }
    return language === 'ar' ? 'متزامن' : 'Synced';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <span className="w-4 h-4">🚫</span>;
    if (pendingUpdates > 0) return <span className="w-4 h-4">⚠️</span>;
    return <span className="w-4 h-4">✓</span>;
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
      theme === 'dark' 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-gray-100 border border-gray-200'
    }`}>
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <span className="w-4 h-4 text-green-500">📶</span>
        ) : (
          <span className="w-4 h-4 text-red-500">🚫</span>
        )}
        
        <div className={`flex items-center gap-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* Sync Button */}
      {isOnline && pendingUpdates > 0 && (
        <button
          onClick={handleForceSync}
          disabled={isSyncing}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
          } disabled:cursor-not-allowed`}
          title={language === 'ar' ? 'مزامنة التحديثات المعلقة' : 'Sync pending updates'}
        >
          {isSyncing ? (
            <span className="w-3 h-3 animate-spin">⏳</span>
          ) : (
            <span className="w-3 h-3">🔄</span>
          )}
          {language === 'ar' ? 'مزامنة' : 'Sync'}
        </button>
      )}
    </div>
  );
}