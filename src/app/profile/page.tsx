'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Navigation, 
  Save, 
  LogOut, 
  Loader2 
} from 'lucide-react';
import Header from '@/components/Header';
import UserPreferences from '@/components/UserPreferences';
import { logger } from '@/lib/logger';
import { EDITION_OPTIONS, downloadHadithEditionOffline, type HadithEdition, type HadithLang } from '@/lib/hadith-api';
import { idbListBooks, idbDeleteBook } from '@/lib/idb';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, logout } = useAuth();
  const { language, theme } = useApp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Offline hadith manager state
  const initialLang: HadithLang = language === 'ar' ? 'ar' : 'en';
  const [batchLang, setBatchLang] = useState<HadithLang>(initialLang);
  const [selectedBatch, setSelectedBatch] = useState<HadithEdition[]>([]);
  const [batchRunning, setBatchRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<Record<string, number>>({});
  const [batchStatus, setBatchStatus] = useState<Record<string, 'idle' | 'downloading' | 'done' | 'error'>>({});
  const [batchErrors, setBatchErrors] = useState<Record<string, string>>({});
  const [offlineBooks, setOfflineBooks] = useState<Array<{ id: string; lang: string; edition: string; savedAt: number }>>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Pre-fill form with existing data
    if (userProfile) {
      setValue('name', userProfile.displayName || user.displayName || '');
      setValue('email', user.email || '');
      setValue('city', userProfile.city || '');
      setValue('country', userProfile.country || '');
    }
  }, [user, userProfile, setValue, router]);

  useEffect(() => {
    // load offline hadith list
    idbListBooks().then(setOfflineBooks).catch(() => {});
  }, []);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await updateUserProfile({
        displayName: data.name,
        city: data.city,
        country: data.country,
      });
      
      // Show success message or redirect
      logger.info('Profile updated successfully');
    } catch (error) {
      logger.warn('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              // Use reverse geocoding to get city and country
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              const data = await response.json();
              
              setValue('city', data.city || data.locality || '');
              setValue('country', data.countryName || '');
            } catch (error) {
              logger.warn('Error getting location details:', error);
            }
            
            setIsGettingLocation(false);
          },
          (error) => {
            logger.warn('Error getting location:', error);
            setIsGettingLocation(false);
          }
        );
      }
    } catch (error) {
      logger.warn('Geolocation error:', error);
      setIsGettingLocation(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      // Centralized logger to avoid noisy console errors
      import('@/lib/logger').then(({ logger }) => logger.warn('Error logging out:', error));
    }
  };

  function toggleBatchEdition(eid: HadithEdition) {
    setSelectedBatch((prev) => (prev.includes(eid) ? prev.filter((x) => x !== eid) : [...prev, eid]));
  }

  function selectAllBatch() {
    setSelectedBatch(EDITION_OPTIONS.map((o) => o.id));
  }

  function clearBatchSelection() {
    setSelectedBatch([]);
  }

  async function startBatchDownloads() {
    if (batchRunning || selectedBatch.length === 0) return;
    setBatchErrors({});
    setBatchRunning(true);
    const statusInit: Record<string, 'idle' | 'downloading' | 'done' | 'error'> = {};
    const progressInit: Record<string, number> = {};
    selectedBatch.forEach((ed) => {
      statusInit[ed] = 'downloading';
      progressInit[ed] = 0;
    });
    setBatchStatus(statusInit);
    setBatchProgress(progressInit);
    const tasks = selectedBatch.map((ed) =>
      downloadHadithEditionOffline(batchLang, ed, (received, total) => {
        const pct = total > 0 ? received / total : (received ? 0.5 : 0);
        setBatchProgress((p) => ({ ...p, [ed]: Math.min(1, pct) }));
      })
        .then(() => {
          setBatchStatus((s) => ({ ...s, [ed]: 'done' }));
        })
        .catch((err) => {
          setBatchStatus((s) => ({ ...s, [ed]: 'error' }));
          setBatchErrors((e) => ({ ...e, [ed]: err?.message || String(err) }));
        })
    );
    await Promise.allSettled(tasks);
    setBatchRunning(false);
    idbListBooks().then(setOfflineBooks).catch(() => {});
  }

  async function deleteOffline(id: string) {
    const [langCode, edition] = id.split(':');
    try {
      await idbDeleteBook(langCode, edition);
      idbListBooks().then(setOfflineBooks).catch(() => {});
    } catch {}
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 font-amiri">
            {language === 'ar' ? 'الملف الشخصي' : 'Profile Settings'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            {language === 'ar' 
              ? 'إدارة معلوماتك الشخصية وتفضيلاتك الإسلامية'
              : 'Manage your personal information and Islamic preferences'
            }
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-emerald-200 dark:border-gray-700 shadow-xl">
          
          {/* User Avatar */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className={`w-10 h-10 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
              )}
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                {userProfile?.displayName || user.displayName || 'User'}
              </h2>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {user.email}
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <div className="relative">
                <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  {...register('name')}
                  type="text"
                  className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${
                    errors.name 
                      ? 'border-red-500' 
                      : theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <div className="relative">
                <Mail className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  {...register('email')}
                  type="email"
                  readOnly
                  className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700/50 text-gray-300' 
                      : 'border-gray-300 bg-gray-100 text-gray-600'
                  } cursor-not-allowed`}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  {language === 'ar' ? 'الموقع' : 'Location'}
                </h3>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  {language === 'ar' ? 'تحديد الموقع' : 'Get Location'}
                </button>
              </div>

              {/* City Field */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {language === 'ar' ? 'المدينة' : 'City'}
                </label>
                <div className="relative">
                  <MapPin className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    {...register('city')}
                    type="text"
                    className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${
                      errors.city 
                        ? 'border-red-500' 
                        : theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder={language === 'ar' ? 'أدخل مدينتك' : 'Enter your city'}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              {/* Country Field */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {language === 'ar' ? 'البلد' : 'Country'}
                </label>
                <div className="relative">
                  <Globe className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    {...register('country')}
                    type="text"
                    className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${
                      errors.country 
                        ? 'border-red-500' 
                        : theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder={language === 'ar' ? 'أدخل بلدك' : 'Enter your country'}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
                {errors.country && (
                  <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isLoading 
                ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
              }
            </button>
          </form>
        </div>

        {/* User Preferences */}
        <UserPreferences 
          onPreferencesUpdate={(preferences) => {
            // Preferences will be automatically updated through the AuthContext
            logger.info('Preferences updated:', preferences);
          }}
        />

        {/* Offline Hadith Manager */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-emerald-200 dark:border-gray-700 shadow-xl">
          <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'} font-amiri`}>
            {language === 'ar' ? 'الحديث دون اتصال' : 'Offline Hadith'}
          </h2>
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {language === 'ar'
              ? 'قم بتنزيل كتب الحديث للاستخدام السريع دون اتصال بالإنترنت. يمكنك اختيار وتنزيل عدة كتب في آن واحد.'
              : 'Download hadith books for fast offline use. You can select and download multiple books at once.'}
          </p>
          <div className="flex items-center gap-2 mb-3">
            <select
              aria-label={language === 'ar' ? 'اللغة' : 'Language'}
              value={batchLang}
              onChange={(e) => setBatchLang(e.target.value as HadithLang)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
            <button onClick={selectAllBatch} className="px-2 py-1 border rounded text-sm">
              {language === 'ar' ? 'تحديد الكل' : 'Select all'}
            </button>
            <button onClick={clearBatchSelection} className="px-2 py-1 border rounded text-sm">
              {language === 'ar' ? 'إلغاء التحديد' : 'Clear'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {EDITION_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedBatch.includes(opt.id)}
                  onChange={() => toggleBatchEdition(opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {selectedBatch.length > 0 && (
            <div className="space-y-2 mb-3">
              {selectedBatch.map((ed) => (
                <div key={ed} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span>{ed}</span>
                    <span>
                      {batchStatus[ed] === 'done'
                        ? (language === 'ar' ? 'اكتمل' : 'Done')
                        : batchStatus[ed] === 'error'
                        ? (language === 'ar' ? 'فشل' : 'Error')
                        : batchStatus[ed] === 'downloading'
                        ? (language === 'ar' ? 'جاري التنزيل' : 'Downloading')
                        : ''}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-2 rounded bg-emerald-500"
                      style={{ width: `${Math.round((batchProgress[ed] || 0) * 100)}%` }}
                    />
                  </div>
                  {batchErrors[ed] && (
                    <div className="text-red-600">{batchErrors[ed]}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end mb-6">
            <button
              onClick={startBatchDownloads}
              disabled={batchRunning || selectedBatch.length === 0}
              className="px-4 py-2 rounded text-sm bg-emerald-600 text-white disabled:opacity-50"
            >
              {language === 'ar' ? 'بدء التنزيل' : 'Start downloads'}
            </button>
          </div>

          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            {language === 'ar' ? 'الكتب المُنزلة' : 'Downloaded books'}
          </h3>
          {offlineBooks.length === 0 ? (
            <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {language === 'ar' ? 'لا توجد كتب مُنزلة بعد.' : 'No downloaded books yet.'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {offlineBooks.map((b) => (
                <li key={b.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'} text-sm`}>{b.id}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(b.savedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteOffline(b.id)}
                    className="px-2 py-1 text-xs border rounded"
                  >
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-600/10 font-semibold transition-all"
        >
          <LogOut className="w-5 h-5" />
          {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </button>
      </main>
    </div>
  );
}