'use client';

import { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Clock, Calculator, Save, Loader2 } from 'lucide-react';
import { useApp } from '@/app/providers';
import { useAuth } from '@/contexts/AuthContext';
import { getCalculationMethodName } from '@/lib/prayer-times';
import toast from 'react-hot-toast';

interface UserPreferencesProps {
  onPreferencesUpdate?: (preferences: any) => void;
}

export default function UserPreferences({ onPreferencesUpdate }: UserPreferencesProps) {
  const { language, theme } = useApp();
  const { user, userProfile, updateUserProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Notification preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationTiming, setNotificationTiming] = useState(5); // minutes before prayer
  
  // Prayer calculation preferences
  const [calculationMethod, setCalculationMethod] = useState('MWL'); // Muslim World League
  const [madhab, setMadhab] = useState('Shafi'); // Shafi or Hanafi for Asr calculation
  
  // Display preferences
  const [timeFormat, setTimeFormat] = useState('12'); // 12 or 24 hour format
  const [showSeconds, setShowSeconds] = useState(false);

  useEffect(() => {
    if (userProfile?.preferences) {
      const prefs = userProfile.preferences;
      setNotificationsEnabled(prefs.notificationsEnabled ?? true);
      setSoundEnabled(prefs.soundEnabled ?? true);
      setNotificationTiming(prefs.notificationTiming ?? 5);
      setCalculationMethod(prefs.calculationMethod ?? 'MWL');
      setMadhab(prefs.madhab ?? 'Shafi');
      setTimeFormat(prefs.timeFormat ?? '12');
      setShowSeconds(prefs.showSeconds ?? false);
    }
  }, [userProfile]);

  const handleSavePreferences = async () => {
    setIsUpdating(true);
    try {
      const preferences = {
        notificationsEnabled,
        soundEnabled,
        notificationTiming,
        calculationMethod,
        madhab,
        timeFormat,
        showSeconds
      };

      await updateUserProfile({ preferences });
      
      if (onPreferencesUpdate) {
        onPreferencesUpdate(preferences);
      }

      toast.success(
        language === 'ar' 
          ? 'تم حفظ التفضيلات بنجاح' 
          : 'Preferences saved successfully'
      );
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error(
        language === 'ar' 
          ? 'فشل في حفظ التفضيلات' 
          : 'Failed to save preferences'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const calculationMethods = [
    { value: 'MWL', nameEn: 'Muslim World League', nameAr: 'رابطة العالم الإسلامي' },
    { value: 'ISNA', nameEn: 'Islamic Society of North America', nameAr: 'الجمعية الإسلامية لأمريكا الشمالية' },
    { value: 'Egypt', nameEn: 'Egyptian General Authority', nameAr: 'الهيئة المصرية العامة للمساحة' },
    { value: 'Makkah', nameEn: 'Umm Al-Qura University, Makkah', nameAr: 'جامعة أم القرى، مكة' },
    { value: 'Karachi', nameEn: 'University of Islamic Sciences, Karachi', nameAr: 'جامعة العلوم الإسلامية، كراتشي' },
    { value: 'Tehran', nameEn: 'Institute of Geophysics, Tehran', nameAr: 'معهد الجيوفيزياء، طهران' }
  ];

  return (
    <div className={`${
      theme === 'dark' 
        ? 'bg-gray-800/80 backdrop-blur-lg border border-gray-700' 
        : 'bg-white/80 backdrop-blur-lg border border-white/20'
    } rounded-2xl shadow-2xl p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <Bell className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
        <h2 className={`text-xl font-semibold ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          {language === 'ar' ? 'تفضيلات المستخدم' : 'User Preferences'}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Notification Settings */}
        <div>
          <h3 className={`text-lg font-medium mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
          </h3>
          
          <div className="space-y-4">
            {/* Enable Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                  {language === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}
                </span>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Sound Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                ) : (
                  <VolumeX className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                )}
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                  {language === 'ar' ? 'الصوت' : 'Sound'}
                </span>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                disabled={!notificationsEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  soundEnabled && notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                } ${!notificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled && notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notification Timing */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {language === 'ar' ? 'التنبيه قبل الصلاة (بالدقائق)' : 'Notify Before Prayer (minutes)'}
              </label>
              <select
                value={notificationTiming}
                onChange={(e) => setNotificationTiming(Number(e.target.value))}
                disabled={!notificationsEnabled}
                className={`w-full px-4 py-3 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  !notificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value={0}>{language === 'ar' ? 'عند الوقت' : 'At prayer time'}</option>
                <option value={5}>{language === 'ar' ? '5 دقائق' : '5 minutes'}</option>
                <option value={10}>{language === 'ar' ? '10 دقائق' : '10 minutes'}</option>
                <option value={15}>{language === 'ar' ? '15 دقيقة' : '15 minutes'}</option>
                <option value={30}>{language === 'ar' ? '30 دقيقة' : '30 minutes'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prayer Calculation Settings */}
        <div>
          <h3 className={`text-lg font-medium mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            {language === 'ar' ? 'إعدادات حساب الصلاة' : 'Prayer Calculation Settings'}
          </h3>
          
          <div className="space-y-4">
            {/* Calculation Method */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {language === 'ar' ? 'طريقة الحساب' : 'Calculation Method'}
              </label>
              <select
                value={calculationMethod}
                onChange={(e) => setCalculationMethod(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                {calculationMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {language === 'ar' ? method.nameAr : method.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Madhab */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {language === 'ar' ? 'المذهب (لحساب العصر)' : 'Madhab (for Asr calculation)'}
              </label>
              <select
                value={madhab}
                onChange={(e) => setMadhab(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="Shafi">{language === 'ar' ? 'الشافعي' : 'Shafi'}</option>
                <option value="Hanafi">{language === 'ar' ? 'الحنفي' : 'Hanafi'}</option>
                <option value="Maliki">{language === 'ar' ? 'المالكي' : 'Maliki'}</option>
                <option value="Hanbali">{language === 'ar' ? 'الحنبلي' : 'Hanbali'}</option>
                <option value="Jafari">{language === 'ar' ? 'الجعفري' : 'Jafari (Shia)'}</option>
                <option value="Ahle Hadith">{language === 'ar' ? 'أهل الحديث' : 'Ahle Hadith'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div>
          <h3 className={`text-lg font-medium mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            {language === 'ar' ? 'إعدادات العرض' : 'Display Settings'}
          </h3>
          
          <div className="space-y-4">
            {/* Time Format */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {language === 'ar' ? 'تنسيق الوقت' : 'Time Format'}
              </label>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="12">{language === 'ar' ? '12 ساعة (AM/PM)' : '12 Hour (AM/PM)'}</option>
                <option value="24">{language === 'ar' ? '24 ساعة' : '24 Hour'}</option>
              </select>
            </div>

            {/* Show Seconds */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                  {language === 'ar' ? 'إظهار الثواني' : 'Show Seconds'}
                </span>
              </div>
              <button
                onClick={() => setShowSeconds(!showSeconds)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showSeconds ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showSeconds ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSavePreferences}
          disabled={isUpdating}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
          } disabled:cursor-not-allowed`}
        >
          {isUpdating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isUpdating 
            ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
            : (language === 'ar' ? 'حفظ التفضيلات' : 'Save Preferences')
          }
        </button>
      </div>
    </div>
  );
}