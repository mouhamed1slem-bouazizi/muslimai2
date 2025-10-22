'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './providers';
import Header from '@/components/Header';
import { 
  Clock, 
  Calendar, 
  Compass, 
  BookOpen, 
  Volume2, 
  MessageCircle,
  MapPin,
  Star,
  Heart,
  Sunrise,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import { calculatePrayerTimes, formatPrayerTime, getCurrentPrayer, getNextPrayer, getTimeUntilNextPrayer, getPrayerName } from '@/lib/prayer-times';
import { useAuth } from '@/contexts/AuthContext';

interface PrayerTime {
  name: string;
  time: string;
  isNext: boolean;
  isCurrent: boolean;
}

export default function Home() {
  const { language, theme, location } = useApp();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate prayer times when location changes
  useEffect(() => {
    if (location || (user?.latitude && user?.longitude)) {
      const lat = location?.latitude || user?.latitude || 21.4225; // Default to Mecca
      const lng = location?.longitude || user?.longitude || 39.8262;
      
      try {
        const times = calculatePrayerTimes(lat, lng);
        const currentPrayer = getCurrentPrayer(times);
        const nextPrayer = getNextPrayer(times);
        
        setPrayerTimes([
          { 
            name: language === 'ar' ? 'الفجر' : 'Fajr', 
            time: formatPrayerTime(times.fajr),
            isNext: nextPrayer === 'fajr',
            isCurrent: currentPrayer === 'fajr'
          },
          { 
            name: language === 'ar' ? 'الشروق' : 'Sunrise', 
            time: formatPrayerTime(times.sunrise),
            isNext: false,
            isCurrent: false
          },
          { 
            name: language === 'ar' ? 'الظهر' : 'Dhuhr', 
            time: formatPrayerTime(times.dhuhr),
            isNext: nextPrayer === 'dhuhr',
            isCurrent: currentPrayer === 'dhuhr'
          },
          { 
            name: language === 'ar' ? 'العصر' : 'Asr', 
            time: formatPrayerTime(times.asr),
            isNext: nextPrayer === 'asr',
            isCurrent: currentPrayer === 'asr'
          },
          { 
            name: language === 'ar' ? 'المغرب' : 'Maghrib', 
            time: formatPrayerTime(times.maghrib),
            isNext: nextPrayer === 'maghrib',
            isCurrent: currentPrayer === 'maghrib'
          },
          { 
            name: language === 'ar' ? 'العشاء' : 'Isha', 
            time: formatPrayerTime(times.isha),
            isNext: nextPrayer === 'isha',
            isCurrent: currentPrayer === 'isha'
          },
        ]);
      } catch (error) {
        console.error('Error calculating prayer times:', error);
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
    }
  }, [location, user, language]);

  const features = [
    {
      icon: Clock,
      title: language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times',
      description: language === 'ar' ? 'مواقيت دقيقة للصلوات الخمس' : 'Accurate prayer times for all five prayers',
      href: '/prayer-times'
    },
    {
      icon: Calendar,
      title: language === 'ar' ? 'التقويم الإسلامي' : 'Islamic Calendar',
      description: language === 'ar' ? 'التقويم الهجري وتقويم رمضان' : 'Hijri calendar and Ramadan calendar',
      href: '/calendar'
    },
    {
      icon: Compass,
      title: language === 'ar' ? 'اتجاه القبلة' : 'Qibla Direction',
      description: language === 'ar' ? 'البوصلة واتجاه القبلة' : 'Compass and Qibla direction',
      href: '/qibla'
    },
    {
      icon: BookOpen,
      title: language === 'ar' ? 'القرآن والموارد' : 'Quran & Resources',
      description: language === 'ar' ? 'القرآن والتفسير والأحاديث والأذكار' : 'Quran, Tafsir, Hadith, and Adhkar',
      href: '/resources'
    },
    {
      icon: Volume2,
      title: language === 'ar' ? 'الصوتيات' : 'Audio',
      description: language === 'ar' ? '18 قارئ وإذاعات القرآن' : '18 reciters and Quran radio',
      href: '/audio'
    },
    {
      icon: MessageCircle,
      title: language === 'ar' ? 'الذكاء الاصطناعي' : 'AI Assistant',
      description: language === 'ar' ? 'مساعد ذكي للأسئلة الإسلامية' : 'AI assistant for Islamic questions',
      href: '/ai-chat'
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <MapPin className="w-5 h-5 text-emerald-600" />
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
              const getPrayerIcon = (name) => {
                if (name.includes('Fajr') || name.includes('الفجر')) return Sunrise;
                if (name.includes('Sunrise') || name.includes('الشروق')) return Sun;
                if (name.includes('Dhuhr') || name.includes('الظهر')) return Sun;
                if (name.includes('Asr') || name.includes('العصر')) return Sunset;
                if (name.includes('Maghrib') || name.includes('المغرب')) return Sunset;
                if (name.includes('Isha') || name.includes('العشاء')) return Moon;
                return Clock;
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
          {(location || user?.city) && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700">
                <MapPin className="w-4 h-4" />
                <span>
                  {user?.city && user?.country 
                    ? `${user.city}, ${user.country}`
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
            <Heart className="w-6 h-6 text-white/80 mx-2" />
            <Star className="w-8 h-8 text-white" />
            <Heart className="w-6 h-6 text-white/80 mx-2" />
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
      </main>
    </div>
  );
}
