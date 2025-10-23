'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../providers';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Sunrise, 
  Sun, 
  Sunset, 
  Moon,
  RefreshCw,
  Settings,
  ChevronRight,
  Star
} from 'lucide-react';
import { 
  fetchPrayerTimesByCity, 
  fetchPrayerTimesByCoordinates, 
  getCurrentPrayer, 
  getNextPrayer, 
  getTimeUntilNextPrayer,
  getCalculationMethods,
  PrayerTimesData 
} from '@/lib/aladhan-api';

interface PrayerTime {
  name: string;
  nameAr: string;
  time: string;
  isNext: boolean;
  isCurrent: boolean;
  icon: React.ComponentType<any>;
}

export default function PrayerTimesPage() {
  const { language, theme } = useApp();
  const { user, userProfile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<{
    prayer: string | null;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    prayer: null,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (prayerData) {
        setTimeUntilNext(getTimeUntilNextPrayer(prayerData));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [prayerData]);

  // Fetch prayer times when component mounts or user profile changes
  useEffect(() => {
    fetchPrayerTimes();
  }, [userProfile]);

  const fetchPrayerTimes = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: PrayerTimesData;

      if (userProfile?.city && userProfile?.country) {
        // Use city and country from user profile
        const method = getMethodFromCountry(userProfile.country);
        data = await fetchPrayerTimesByCity(userProfile.city, userProfile.country, method);
      } else if (userProfile?.latitude && userProfile?.longitude) {
        // Use coordinates from user profile
        const method = 8; // Default Gulf Region method
        data = await fetchPrayerTimesByCoordinates(userProfile.latitude, userProfile.longitude, method);
      } else {
        // Default to Mecca
        data = await fetchPrayerTimesByCity('Mecca', 'Saudi Arabia', 4);
      }

      setPrayerData(data);
      updatePrayerTimes(data);
    } catch (err) {
      console.error('Error fetching prayer times:', err);
      setError(language === 'ar' ? 'خطأ في جلب مواقيت الصلاة' : 'Error fetching prayer times');
    } finally {
      setLoading(false);
    }
  };

  const updatePrayerTimes = (data: PrayerTimesData) => {
    const currentPrayer = getCurrentPrayer(data);
    const nextPrayer = getNextPrayer(data);

    const times: PrayerTime[] = [
      {
        name: 'Fajr',
        nameAr: 'الفجر',
        time: data.fajr,
        isNext: nextPrayer === 'fajr',
        isCurrent: currentPrayer === 'fajr',
        icon: Sunrise
      },
      {
        name: 'Sunrise',
        nameAr: 'الشروق',
        time: data.sunrise,
        isNext: false,
        isCurrent: false,
        icon: Sun
      },
      {
        name: 'Dhuhr',
        nameAr: 'الظهر',
        time: data.dhuhr,
        isNext: nextPrayer === 'dhuhr',
        isCurrent: currentPrayer === 'dhuhr',
        icon: Sun
      },
      {
        name: 'Asr',
        nameAr: 'العصر',
        time: data.asr,
        isNext: nextPrayer === 'asr',
        isCurrent: currentPrayer === 'asr',
        icon: Sunset
      },
      {
        name: 'Maghrib',
        nameAr: 'المغرب',
        time: data.maghrib,
        isNext: nextPrayer === 'maghrib',
        isCurrent: currentPrayer === 'maghrib',
        icon: Sunset
      },
      {
        name: 'Isha',
        nameAr: 'العشاء',
        time: data.isha,
        isNext: nextPrayer === 'isha',
        isCurrent: currentPrayer === 'isha',
        icon: Moon
      }
    ];

    setPrayerTimes(times);
    setTimeUntilNext(getTimeUntilNextPrayer(data));
  };

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

  const getPrayerDisplayName = (prayer: PrayerTime) => {
    return language === 'ar' ? prayer.nameAr : prayer.name;
  };

  const getNextPrayerName = () => {
    if (!timeUntilNext.prayer) return '';
    const prayer = prayerTimes.find(p => p.name.toLowerCase() === timeUntilNext.prayer);
    return prayer ? getPrayerDisplayName(prayer) : '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'جاري تحميل مواقيت الصلاة...' : 'Loading prayer times...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchPrayerTimes}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 font-amiri">
            {language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'ar' ? 'مواقيت دقيقة للصلوات الخمس' : 'Accurate prayer times for all five prayers'}
          </p>
        </div>

        {/* Current Time and Date */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
              {currentTime.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </div>
            
            {/* Gregorian Date */}
            <div className="mb-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {language === 'ar' ? 'التاريخ الميلادي' : 'Gregorian Date'}
              </div>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {currentTime.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* Hijri Date */}
            {prayerData && (
              <div className="mb-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'ar' ? 'التاريخ الهجري' : 'Hijri Date'}
                </div>
                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {language === 'ar' 
                    ? `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.ar} ${prayerData.date.hijri.year} هـ`
                    : `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.en} ${prayerData.date.hijri.year} AH`
                  }
                </div>
              </div>
            )}
            
            {/* Location */}
            {prayerData && (
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'ar' ? 'الموقع' : 'Location'}
                </div>
                <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {prayerData.location.city}, {prayerData.location.country}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Prayer Countdown */}
        {timeUntilNext.prayer && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div className="text-center">
              <div className="text-lg mb-2">
                {language === 'ar' ? 'الصلاة القادمة' : 'Next Prayer'}
              </div>
              <div className="text-2xl font-bold mb-2">
                {getNextPrayerName()}
              </div>
              <div className="text-3xl font-mono">
                {String(timeUntilNext.hours).padStart(2, '0')}:
                {String(timeUntilNext.minutes).padStart(2, '0')}:
                {String(timeUntilNext.seconds).padStart(2, '0')}
              </div>
              <div className="text-sm opacity-90 mt-2">
                {language === 'ar' ? 'ساعة : دقيقة : ثانية' : 'Hours : Minutes : Seconds'}
              </div>
            </div>
          </div>
        )}

        {/* Prayer Times Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {prayerTimes.map((prayer, index) => {
            const IconComponent = prayer.icon;
            return (
              <div
                key={index}
                className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border shadow-lg transition-all duration-300 hover:shadow-xl ${
                  prayer.isCurrent
                    ? 'border-green-400 dark:border-green-500 ring-2 ring-green-200 dark:ring-green-800'
                    : prayer.isNext
                      ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${
                    prayer.isCurrent
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : prayer.isNext
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-emerald-100 dark:bg-emerald-900/30'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      prayer.isCurrent
                        ? 'text-green-600 dark:text-green-400'
                        : prayer.isNext
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                    }`} />
                  </div>
                  {(prayer.isCurrent || prayer.isNext) && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      prayer.isCurrent
                        ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                        : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                    }`}>
                      {prayer.isCurrent 
                        ? (language === 'ar' ? 'الآن' : 'Now')
                        : (language === 'ar' ? 'التالي' : 'Next')
                      }
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 font-amiri">
                    {getPrayerDisplayName(prayer)}
                  </h3>
                  <div className={`text-2xl font-bold ${
                    prayer.isCurrent
                      ? 'text-green-600 dark:text-green-400'
                      : prayer.isNext
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {prayer.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Method and Refresh */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {language === 'ar' ? 'طريقة الحساب' : 'Calculation Method'}
              </h3>
              {prayerData && (
                <p className="text-gray-600 dark:text-gray-400">
                  {prayerData.method.name}
                </p>
              )}
            </div>
            <button
              onClick={fetchPrayerTimes}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}