'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { syncService, SyncCallbacks } from '@/lib/sync-service';
import toast from 'react-hot-toast';

interface UserProfile {
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

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isOnline: boolean;
  pendingUpdates: number;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateLocation: (city: string, country: string, latitude?: number, longitude?: number) => Promise<void>;
  forceSyncPendingUpdates: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingUpdates, setPendingUpdates] = useState(0);

  // Sync service callbacks
  const syncCallbacks: SyncCallbacks = {
    onProfileUpdate: (profile: UserProfile) => {
      setUserProfile(profile);
    },
    onLocationUpdate: (location) => {
      if (userProfile) {
        setUserProfile(prev => prev ? {
          ...prev,
          city: location.city || prev.city,
          country: location.country || prev.country,
          latitude: location.latitude || prev.latitude,
          longitude: location.longitude || prev.longitude,
        } : null);
      }
    },
    onPreferencesUpdate: (preferences) => {
      if (userProfile) {
        setUserProfile(prev => prev ? {
          ...prev,
          preferences: preferences || prev.preferences,
        } : null);
      }
    },
    onThemeUpdate: (theme) => {
      if (userProfile) {
        setUserProfile(prev => prev ? {
          ...prev,
          theme,
        } : null);
      }
    },
    onLanguageUpdate: (language) => {
      if (userProfile) {
        setUserProfile(prev => prev ? {
          ...prev,
          language,
        } : null);
      }
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error('Sync error: ' + error.message);
    }
  };

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - syncing data...');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline - changes will sync when online');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    // Update pending updates count
    const updatePendingCount = () => {
      setPendingUpdates(syncService.getPendingUpdatesCount());
    };

    const interval = setInterval(updatePendingCount, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadUserProfile(user.uid);
        // Initialize sync service
        syncService.initialize(user, syncCallbacks);
      } else {
        setUser(null);
        setUserProfile(null);
        // Cleanup sync service
        syncService.cleanup();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const createUserProfile = async (user: User, additionalData: Partial<UserProfile> = {}) => {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        ...(user.photoURL && { photoURL: user.photoURL }),
        language: 'en',
        theme: 'light',
        notifications: {
          prayerReminders: true,
          adhanSound: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        ...additionalData,
      };

      await setDoc(userRef, {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setUserProfile(profile);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      await createUserProfile(user, { displayName });
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in');
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      await createUserProfile(user);
      toast.success('Logged in with Google successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in with Google');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      toast.success('Logged out successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out');
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;

    try {
      // Use sync service for real-time updates
      await syncService.updateProfile(updates);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      // Handle offline scenario
      if (error.message.includes('Offline')) {
        toast.error('Offline - changes will sync when online');
      } else {
        toast.error(error.message || 'Failed to update profile');
        throw error;
      }
    }
  };

  const updateLocation = async (city: string, country: string, latitude?: number, longitude?: number) => {
    try {
      await syncService.updateLocation(city, country, latitude, longitude);
      toast.success('Location updated successfully!');
    } catch (error: any) {
      if (error.message.includes('Offline')) {
        toast.error('Offline - location will sync when online');
      } else {
        toast.error(error.message || 'Failed to update location');
        throw error;
      }
    }
  };

  const forceSyncPendingUpdates = async () => {
    try {
      await syncService.forceSyncPendingUpdates();
      toast.success('All changes synced successfully!');
    } catch (error: any) {
      toast.error('Failed to sync pending changes');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isOnline,
    pendingUpdates,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
    updateLocation,
    forceSyncPendingUpdates,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}