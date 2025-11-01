'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './providers';
import Header from '@/components/Header';

import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchPrayerTimesByCity, 
  fetchPrayerTimesByCoordinates, 
  getCurrentPrayer, 
  getNextPrayer, 
  PrayerTimesData 
} from '@/lib/aladhan-api';
import { logger } from '@/lib/logger';

interface PrayerTime {
  name: string;
  time: string;
  isNext: boolean;
  isCurrent: boolean;
}

export default function Home() {
  const { language, theme, location } = useApp();
  const { user, userProfile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [showDonatePopup, setShowDonatePopup] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Show donate popup once per user after login/signup
  useEffect(() => {
    try {
      const uid = user?.uid || 'anon';
      const key = `donate_popup_shown:${uid}`;
      const alreadyShown = typeof window !== 'undefined' ? localStorage.getItem(key) : 'true';
      if (!alreadyShown && user) {
        setShowDonatePopup(true);
      }
    } catch {}
  }, [user]);

  const dismissDonatePopup = (markShown: boolean = true) => {
    try {
      const uid = user?.uid || 'anon';
      const key = `donate_popup_shown:${uid}`;
      if (markShown && typeof window !== 'undefined') localStorage.setItem(key, 'true');
    } catch {}
    setShowDonatePopup(false);
  };

  // Calculate prayer times when location changes
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      if (userProfile?.city && userProfile?.country) {
        try {
          const method = getMethodFromCountry(userProfile.country);
          const data = await fetchPrayerTimesByCity(userProfile.city, userProfile.country, method);
          setPrayerData(data);
          
          const currentPrayer = getCurrentPrayer(data);
          const nextPrayer = getNextPrayer(data);
          
          setPrayerTimes([
            { 
              name: language === 'ar' ? 'الفجر' : 'Fajr', 
              time: data.fajr,
              isNext: nextPrayer === 'fajr',
              isCurrent: currentPrayer === 'fajr'
            },
            { 
              name: language === 'ar' ? 'الشروق' : 'Sunrise', 
              time: data.sunrise,
              isNext: false,
              isCurrent: false
            },
            { 
              name: language === 'ar' ? 'الظهر' : 'Dhuhr', 
              time: data.dhuhr,
              isNext: nextPrayer === 'dhuhr',
              isCurrent: currentPrayer === 'dhuhr'
            },
            { 
              name: language === 'ar' ? 'العصر' : 'Asr', 
              time: data.asr,
              isNext: nextPrayer === 'asr',
              isCurrent: currentPrayer === 'asr'
            },
            { 
              name: language === 'ar' ? 'المغرب' : 'Maghrib', 
              time: data.maghrib,
              isNext: nextPrayer === 'maghrib',
              isCurrent: currentPrayer === 'maghrib'
            },
            { 
              name: language === 'ar' ? 'العشاء' : 'Isha', 
              time: data.isha,
              isNext: nextPrayer === 'isha',
              isCurrent: currentPrayer === 'isha'
            },
          ]);
        } catch (error) {
          logger.warn('Error fetching prayer times:', error as Error);
          // Fallback to mock data
          setPrayerTimes([
            { name: language === 'ar' ? 'الفجر' : 'Fajr', time: '5:30 AM', isNext: false, isCurrent: false },
            { name: language === 'ar' ? 'الشروق' : 'Sunrise', time: '6:45 AM', isNext: false, isCurrent: false },
            { name: language === 'ar' ? 'الظهر' : 'Dhuhr', time: '12:15 PM', isNext: true, isCurrent: false },
            { name: language === 'ar' ? 'العصر' : 'Asr', time: '3:30 PM', isNext: false, isCurrent: false },
            { name: language === 'ar' ? 'المغرب' : 'Maghrib', time: '6:20 PM', isNext: false, isCurrent: false },
            { name: language === 'ar' ? 'العشاء' : 'Isha', time: '7:45 PM', isNext: false, isCurrent: false },
          ]);
        }
      } else if (userProfile?.latitude && userProfile?.longitude) {
        try {
          const data = await fetchPrayerTimesByCoordinates(userProfile.latitude, userProfile.longitude, 8);
          setPrayerData(data);
          
          const currentPrayer = getCurrentPrayer(data);
          const nextPrayer = getNextPrayer(data);
          
          setPrayerTimes([
            { 
              name: language === 'ar' ? 'الفجر' : 'Fajr', 
              time: data.fajr,
              isNext: nextPrayer === 'fajr',
              isCurrent: currentPrayer === 'fajr'
            },
            { 
              name: language === 'ar' ? 'الشروق' : 'Sunrise', 
              time: data.sunrise,
              isNext: false,
              isCurrent: false
            },
            { 
              name: language === 'ar' ? 'الظهر' : 'Dhuhr', 
              time: data.dhuhr,
              isNext: nextPrayer === 'dhuhr',
              isCurrent: currentPrayer === 'dhuhr'
            },
            { 
              name: language === 'ar' ? 'العصر' : 'Asr', 
              time: data.asr,
              isNext: nextPrayer === 'asr',
              isCurrent: currentPrayer === 'asr'
            },
            { 
              name: language === 'ar' ? 'المغرب' : 'Maghrib', 
              time: data.maghrib,
              isNext: nextPrayer === 'maghrib',
              isCurrent: currentPrayer === 'maghrib'
            },
            { 
              name: language === 'ar' ? 'العشاء' : 'Isha', 
              time: data.isha,
              isNext: nextPrayer === 'isha',
              isCurrent: currentPrayer === 'isha'
            },
          ]);
        } catch (error) {
          logger.warn('Error fetching prayer times:', error as Error);
          // Fallback to mock data
          setPrayerTimes([
            { name: language === 'ar' ? 'الفجر' : 'Fajr', time: '5:30 AM', isNext: false, isCurrent: false },
            { name: language === 'ar' ? 'الشروق' : 'Sunrise', time: '6:45 AM', isNext: false, isCurrent: false },
            { name: language === 'ar' ? 'الظهر' : 'Dhuhr', time: '12:15 PM', isNext: true, isCurrent: false },
            { name: language === 'ar' ? 'العصر' : 'Asr', time: '3:30 PM', isNext: false, isCurrent: false },
            { name: language === 'ar' ? 'المغرب' : 'Maghrib', time: '6:20 PM', isNext: false, isCurrent: false },
            { name: language === 'ar' ? 'العشاء' : 'Isha', time: '7:45 PM', isNext: false, isCurrent: false },
          ]);
        }
      } else {
        // Default fallback data
        setPrayerTimes([
          { name: language === 'ar' ? 'الفجر' : 'Fajr', time: '5:30 AM', isNext: false, isCurrent: false },
          { name: language === 'ar' ? 'الشروق' : 'Sunrise', time: '6:45 AM', isNext: false, isCurrent: false },
          { name: language === 'ar' ? 'الظهر' : 'Dhuhr', time: '12:15 PM', isNext: true, isCurrent: false },
          { name: language === 'ar' ? 'العصر' : 'Asr', time: '3:30 PM', isNext: false, isCurrent: false },
          { name: language === 'ar' ? 'المغرب' : 'Maghrib', time: '6:20 PM', isNext: false, isCurrent: false },
          { name: language === 'ar' ? 'العشاء' : 'Isha', time: '7:45 PM', isNext: false, isCurrent: false },
        ]);
      }
    };

    fetchPrayerTimes();
  }, [userProfile, language]);

  const getMethodFromCountry = (country: string): number => {
    const countryMethods: { [key: string]: number } = {
      'Saudi Arabia': 4, // Umm Al-Qura
      'UAE': 8, // Gulf Region
      'Kuwait': 9,
      'Qatar': 10,
      'Egypt': 5,
      'Pakistan': 1,
      'India': 1,
      'Turkey': 13,
      'Singapore': 11,
      'Malaysia': 11,
      'Indonesia': 11,
      'United States': 2,
      'Canada': 2,
    };
    return countryMethods[country] || 3; // Default to Muslim World League
  };

  const features = [
    {
      icon: () => <span className="text-2xl text-white">⏰</span>,
      title: language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times',
      description: language === 'ar' ? 'مواقيت دقيقة للصلوات الخمس' : 'Accurate prayer times for all five prayers',
      href: '/prayer-times'
    },
    {
      icon: () => <span className="text-2xl text-white">📅</span>,
      title: language === 'ar' ? 'التقويم الإسلامي' : 'Islamic Calendar',
      description: language === 'ar' ? 'التقويم الهجري وتقويم رمضان' : 'Hijri calendar and Ramadan calendar',
      href: '/islamic-calendar'
    },
    {
      icon: () => <span className="text-2xl text-white">🧭</span>,
      title: language === 'ar' ? 'اتجاه القبلة' : 'Qibla Direction',
      description: language === 'ar' ? 'البوصلة واتجاه القبلة' : 'Compass and Qibla direction',
      href: '/qibla'
    },
    {
      icon: () => <span className="text-2xl text-white">📚</span>,
      title: language === 'ar' ? 'القرآن والموارد' : 'Quran & Resources',
      description: language === 'ar' ? 'القرآن والتفسير والأحاديث والأذكار' : 'Quran, Tafsir, Hadith, and Adhkar',
      href: '/quran'
    },
    {
      icon: () => <span className="text-2xl text-white">🔊</span>,
      title: language === 'ar' ? 'الصوتيات' : 'Audio',
      description: language === 'ar' ? '18 قارئ وإذاعات القرآن' : '18 reciters and Quran radio',
      href: '/audio'
    },
    {
      icon: () => <span className="text-2xl text-white">💬</span>,
      title: language === 'ar' ? 'الذكاء الاصطناعي' : 'AI Assistant',
      description: language === 'ar' ? 'مساعد ذكي للأسئلة الإسلامية' : 'AI assistant for Islamic questions',
      href: '/ai-chat'
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-24">
        {showDonatePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => dismissDonatePopup(true)} />
            <div className={`relative z-10 w-full max-w-md rounded-2xl p-6 border ${
              theme === 'dark' ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-emerald-200'
            } backdrop-blur-sm`}
            >
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white font-amiri">
                {language === 'ar' ? 'كن شريكاً في العلم والأجر 💡' : 'Partner in Knowledge and Reward 💡'}
              </h3>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                {language === 'ar'
                  ? 'لا تجعل العلم يقف عند حدود البشر! ساهم معنا في بناء أول منصة ذكاء اصطناعي إسلامي، لتكون مرجعاً شاملاً ودقيقاً يخدم ملايين المسلمين. تبرعك صدقة جارية في نشر العلم بإذن الله.'
                  : "Don't Let Knowledge Stop at Human Limits! Contribute with us to build the first Islamic AI platform, a comprehensive and accurate reference serving millions of Muslims. Your donation is an ongoing charity (Sadaqah Jāriyah) in spreading knowledge, God willing."
                }
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="/donate"
                  onClick={() => dismissDonatePopup(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-colors"
                >
                  {language === 'ar' ? 'اذهب لصفحة التبرع' : 'Go to Donate Page'}
                </a>
                <button
                  onClick={() => dismissDonatePopup(true)}
                  className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} hover:opacity-80 transition-opacity`}
                >
                  {language === 'ar' ? 'لاحقًا' : 'Later'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 font-amiri">
            {language === 'ar' ? 'بسم الله الرحمن الرحيم' : 'In the Name of Allah'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            {language === 'ar' 
              ? 'تطبيق شامل لمواقيت الصلاة والموارد الإسلامية في مكان واحد'
              : 'Complete Islamic prayer times and spiritual resources in one place'
            }
          </p>
          
          {/* Current Time */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto border border-emerald-200 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mb-2">
              <span className="text-xl">📍</span>
              <span className="text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'الوقت الحالي' : 'Current Time'}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
              {currentTime.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {currentTime.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Prayer Times Quick View */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center font-amiri">
            {language === 'ar' ? 'مواقيت الصلاة اليوم' : 'Today\'s Prayer Times'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {prayerTimes.map((prayer, index) => {
              const getPrayerIcon = (name: string) => {
                if (name.includes('Fajr') || name.includes('الفجر')) return () => <span className="text-xl">🌅</span>;
                if (name.includes('Sunrise') || name.includes('الشروق')) return () => <span className="text-xl">☀️</span>;
                if (name.includes('Dhuhr') || name.includes('الظهر')) return () => <span className="text-xl">☀️</span>;
                if (name.includes('Asr') || name.includes('العصر')) return () => <span className="text-xl">🌇</span>;
                if (name.includes('Maghrib') || name.includes('المغرب')) return () => <span className="text-xl">🌇</span>;
                if (name.includes('Isha') || name.includes('العشاء')) return () => <span className="text-xl">🌙</span>;
                return () => <span className="text-xl">⏰</span>;
              };
              const Icon = getPrayerIcon(prayer.name);
              return (
                <div
                  key={prayer.name}
                  className={`backdrop-blur-sm rounded-xl p-4 text-center border hover:shadow-lg transition-all duration-300 ${
                    prayer.isCurrent
                      ? 'bg-green-100/80 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                      : prayer.isNext
                        ? 'bg-blue-100/80 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                        : 'bg-white/80 dark:bg-gray-800/80 border-emerald-200 dark:border-gray-700'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    prayer.isCurrent
                      ? 'text-green-600 dark:text-green-400'
                      : prayer.isNext
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-emerald-600'
                  }`} />
                  <div className={`text-sm font-medium mb-1 ${
                    prayer.isCurrent
                      ? 'text-green-900 dark:text-green-100'
                      : prayer.isNext
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-gray-900 dark:text-white'
                  }`}>
                    {prayer.name}
                  </div>
                  <div className={`text-lg font-bold font-mono ${
                    prayer.isCurrent
                      ? 'text-green-700 dark:text-green-300'
                      : prayer.isNext
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-emerald-600'
                  }`}>
                    {prayer.time}
                  </div>
                  {prayer.isCurrent && (
                    <div className="text-xs mt-2 px-2 py-1 rounded-full bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">
                      {language === 'ar' ? 'الآن' : 'Now'}
                    </div>
                  )}
                  {prayer.isNext && !prayer.isCurrent && (
                    <div className="text-xs mt-2 px-2 py-1 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                      {language === 'ar' ? 'التالي' : 'Next'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Location Info */}
          {(location || userProfile?.city) && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700">
                <span className="text-base">📍</span>
                <span>
                  {userProfile?.city && userProfile?.country 
                    ? `${userProfile.city}, ${userProfile.country}`
                    : (language === 'ar' ? 'الموقع الحالي' : 'Current Location')
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center font-amiri">
            {language === 'ar' ? 'الميزات' : 'Features'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <a
                  key={feature.href}
                  href={feature.href}
                  className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-emerald-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-amiri">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </a>
              );
            })}
          </div>
        </div>

        {/* Islamic Quote */}
        <div className="text-center bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <span className="w-6 h-6 mx-2">❤️</span>
            <span className="text-4xl">⭐</span>
                            <span className="w-6 h-6">❤️</span>
          </div>
          <blockquote className="text-xl md:text-2xl font-amiri mb-4">
            {language === 'ar' 
              ? '"وَأَقِمِ الصَّلَاةَ إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ"'
              : '"And establish prayer. Indeed, prayer prohibits immorality and wrongdoing"'
            }
          </blockquote>
          <cite className="text-white/80">
            {language === 'ar' ? 'سورة العنكبوت - آية 45' : 'Quran 29:45'}
          </cite>
        </div>

        {/* Bottom Donate Button */}
        <div className="mt-8 text-center">
          <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {language === 'ar' 
              ? 'ساعدنا في تطوير التطبيق عبر التبرع'
              : 'Help us improve the app by donating'}
          </p>
          <a
            href="/donate"
            className="inline-block px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            {language === 'ar' ? 'صفحة التبرع' : 'Donate Page'}
          </a>
        </div>
      </main>
    </div>
  );
}
