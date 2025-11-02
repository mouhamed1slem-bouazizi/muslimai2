'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../providers';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { 
  fetchPrayerTimesByCity, 
  fetchPrayerTimesByCoordinates, 
  getCurrentPrayer, 
  getNextPrayer, 
  getTimeUntilNextPrayer,
  getCalculationMethods,
  PrayerTimesData 
} from '@/lib/aladhan-api';
import { getCurrentDates, GregorianDate, HijriDate, formatDate, formatCountdownNumber, formatCurrentTime } from '@/lib/date-utils';
import { logger } from '@/lib/logger';
import PIC_Fajr from '@/pic/PIC_Fajr.png';
import PIC_Sunrise from '@/pic/PIC_Sunrise.png';
import PIC_Dhuhr from '@/pic/PIC_Dhuhr.png';
import PIC_Asr from '@/pic/PIC_Asr.png';
import PIC_Maghreb from '@/pic/PIC_Maghreb.png';
import PIC_Isha from '@/pic/PIC_Isha.png';
import { getFajrOverlayContent, type FajrOverlayContent } from '@/lib/fajr-overlay-service';
import { getSunriseOverlayContent, type SunriseOverlayContent } from '@/lib/sunrise-overlay-service';
import { getDhuhrOverlayContent, type DhuhrOverlayContent } from '@/lib/dhuhr-overlay-service';
import { getAsrOverlayContent, type AsrOverlayContent } from '@/lib/asr-overlay-service';
import { getMaghribOverlayContent, type MaghribOverlayContent } from '@/lib/maghrib-overlay-service';
import { getIshaOverlayContent, type IshaOverlayContent } from '@/lib/isha-overlay-service';

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
  const [currentDates, setCurrentDates] = useState<{
    gregorian: GregorianDate | null;
    hijri: HijriDate | null;
  }>({
    gregorian: null,
    hijri: null,
  });

  const [showFajrInfo, setShowFajrInfo] = useState(false);
  const [fajrContent, setFajrContent] = useState<FajrOverlayContent | null>(null);
  const [fajrContentLoading, setFajrContentLoading] = useState<boolean>(true);
  const [showSunriseInfo, setShowSunriseInfo] = useState(false);
  const [sunriseContent, setSunriseContent] = useState<SunriseOverlayContent | null>(null);
  const [sunriseContentLoading, setSunriseContentLoading] = useState<boolean>(true);
  const [showDhuhrInfo, setShowDhuhrInfo] = useState(false);
  const [dhuhrContent, setDhuhrContent] = useState<DhuhrOverlayContent | null>(null);
  const [dhuhrContentLoading, setDhuhrContentLoading] = useState<boolean>(true);
  const [showAsrInfo, setShowAsrInfo] = useState(false);
  const [asrContent, setAsrContent] = useState<AsrOverlayContent | null>(null);
  const [asrContentLoading, setAsrContentLoading] = useState<boolean>(true);
  const [showMaghribInfo, setShowMaghribInfo] = useState(false);
  const [maghribContent, setMaghribContent] = useState<MaghribOverlayContent | null>(null);
  const [maghribContentLoading, setMaghribContentLoading] = useState<boolean>(true);
  const [showIshaInfo, setShowIshaInfo] = useState(false);
  const [ishaContent, setIshaContent] = useState<IshaOverlayContent | null>(null);
  const [ishaContentLoading, setIshaContentLoading] = useState<boolean>(true);

  // Mobile compact header state (iOS large-title style)
  const [showCompactHeader, setShowCompactHeader] = useState(false);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

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
    fetchCurrentDates();
  }, [userProfile]);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const content = await getFajrOverlayContent();
        if (active) setFajrContent(content);
      } catch (error) {
        logger.warn('Error loading Fajr overlay content:', error as Error);
      } finally {
        if (active) setFajrContentLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const content = await getSunriseOverlayContent();
        if (active) setSunriseContent(content);
      } catch (error) {
        logger.warn('Error loading Sunrise overlay content:', error as Error);
      } finally {
        if (active) setSunriseContentLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const content = await getDhuhrOverlayContent();
        if (active) setDhuhrContent(content);
      } catch (error) {
        logger.warn('Error loading Dhuhr overlay content:', error as Error);
      } finally {
        if (active) setDhuhrContentLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const content = await getAsrOverlayContent();
        if (active) setAsrContent(content);
      } catch (error) {
        logger.warn('Error loading Asr overlay content:', error as Error);
      } finally {
        if (active) setAsrContentLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const content = await getMaghribOverlayContent();
        if (active) setMaghribContent(content);
      } catch (error) {
        logger.warn('Error loading Maghrib overlay content:', error as Error);
      } finally {
        if (active) setMaghribContentLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const content = await getIshaOverlayContent();
        if (active) setIshaContent(content);
      } catch (error) {
        logger.warn('Error loading Isha overlay content:', error as Error);
      } finally {
        if (active) setIshaContentLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Observe the large title to toggle compact header on mobile
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When large title scrolls out of view, show compact header
        setShowCompactHeader(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        // Start showing compact header a bit before the title completely leaves
        rootMargin: '-56px 0px 0px 0px',
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch current dates
  const fetchCurrentDates = async () => {
    try {
      const dates = await getCurrentDates();
      setCurrentDates(dates);
    } catch (error) {
      logger.warn('Error fetching current dates:', error as Error);
    }
  };

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
      logger.warn('Error fetching prayer times:', err as Error);
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
        icon: () => <span className="text-2xl">🌅</span>
      },
      {
        name: 'Sunrise',
        nameAr: 'الشروق',
        time: data.sunrise,
        isNext: false,
        isCurrent: false,
        icon: () => <span className="text-2xl">☀️</span>
      },
      {
        name: 'Dhuhr',
        nameAr: 'الظهر',
        time: data.dhuhr,
        isNext: nextPrayer === 'dhuhr',
        isCurrent: currentPrayer === 'dhuhr',
        icon: () => <span className="text-2xl">☀️</span>
      },
      {
        name: 'Asr',
        nameAr: 'العصر',
        time: data.asr,
        isNext: nextPrayer === 'asr',
        isCurrent: currentPrayer === 'asr',
        icon: () => <span className="text-2xl">🌇</span>
      },
      {
        name: 'Maghrib',
        nameAr: 'المغرب',
        time: data.maghrib,
        isNext: nextPrayer === 'maghrib',
        isCurrent: currentPrayer === 'maghrib',
        icon: () => <span className="text-2xl">🌇</span>
      },
      {
        name: 'Isha',
        nameAr: 'العشاء',
        time: data.isha,
        isNext: nextPrayer === 'isha',
        isCurrent: currentPrayer === 'isha',
        icon: () => <span className="text-2xl">🌙</span>
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
        <Header compactTitle={language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'} showCompactTitle={showCompactHeader} transparent />

      <div className="container mx-auto px-4 py-8 pt-20 lg:pt-24">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <span className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600 inline-block">🔄</span>
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
        <Header compactTitle={language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'} showCompactTitle={showCompactHeader} transparent />
        <div className="container mx-auto px-4 py-8 pt-20 lg:pt-24">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="w-8 h-8 text-red-600 dark:text-red-400 text-2xl">⏰</span>
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
      <Header compactTitle={language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'} showCompactTitle={showCompactHeader} transparent />
      
      {showFajrInfo && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={language === 'ar' ? 'معلومات سنة الفجر' : 'Fajr Sunnah Information'}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowFajrInfo(false); }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none"
            style={{ backgroundImage: `url(${PIC_Fajr.src})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/40 dark:bg-black/50 z-10 pointer-events-none" aria-hidden="true" />
          <button
            onClick={(e) => { e.stopPropagation(); setShowFajrInfo(false); }}
            className="absolute top-4 right-4 z-30 inline-flex items-center justify-center rounded-full p-2 bg-black/50 hover:bg-black/70 text-white transition pointer-events-auto"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <span className="w-5 h-5 text-white text-lg">✕</span>
          </button>
          <div className="absolute inset-0 flex items-center justify-center p-6 z-20 pointer-events-auto">
            <div className="max-w-2xl text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 font-amiri">
                {language === 'ar' ? 'سنة الفجر' : 'Sunnah of Fajr'}
              </h2>
              {fajrContentLoading ? (
                <div className="flex items-center justify-center">
                  <span className="w-6 h-6 animate-spin text-white inline-block">🔄</span>
                </div>
              ) : (
                language === 'ar' ? (
                  <div dir="rtl">
                    <p className="leading-relaxed whitespace-pre-line">{fajrContent?.ar}</p>
                  </div>
                ) : (
                  <div dir="ltr">
                    <p className="leading-relaxed whitespace-pre-line">{fajrContent?.en}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showSunriseInfo && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={language === 'ar' ? 'معلومات الشروق' : 'Sunrise Information'}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowSunriseInfo(false); }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none"
            style={{ backgroundImage: `url(${PIC_Sunrise.src})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/40 dark:bg-black/50 z-10 pointer-events-none" aria-hidden="true" />
          <button
            onClick={(e) => { e.stopPropagation(); setShowSunriseInfo(false); }}
            className="absolute top-4 right-4 z-30 inline-flex items-center justify-center rounded-full p-2 bg-black/50 hover:bg-black/70 text-white transition pointer-events-auto"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <span className="w-5 h-5 text-white text-lg">✕</span>
          </button>
          <div className="absolute inset-0 flex items-center justify-center p-6 z-20 pointer-events-auto">
            <div className="max-w-2xl text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 font-amiri">
                {language === 'ar' ? 'الشروق' : 'Sunrise'}
              </h2>
              {sunriseContentLoading ? (
                <div className="flex items-center justify-center">
                  <span className="w-6 h-6 animate-spin text-white inline-block">🔄</span>
                </div>
              ) : (
                language === 'ar' ? (
                  <div dir="rtl">
                    <p className="leading-relaxed whitespace-pre-line">{sunriseContent?.ar}</p>
                  </div>
                ) : (
                  <div dir="ltr">
                    <p className="leading-relaxed whitespace-pre-line">{sunriseContent?.en}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showDhuhrInfo && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={language === 'ar' ? 'معلومات الظهر' : 'Dhuhr Information'}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowDhuhrInfo(false); }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none"
            style={{ backgroundImage: `url(${PIC_Dhuhr.src})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/40 dark:bg-black/50 z-10 pointer-events-none" aria-hidden="true" />
          <button
            onClick={(e) => { e.stopPropagation(); setShowDhuhrInfo(false); }}
            className="absolute top-4 right-4 z-30 inline-flex items-center justify-center rounded-full p-2 bg-black/50 hover:bg-black/70 text-white transition pointer-events-auto"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <span className="w-5 h-5 text-white text-lg">✕</span>
          </button>
          <div className="absolute inset-0 flex items-center justify-center p-6 z-20 pointer-events-auto">
            <div className="max-w-2xl text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 font-amiri">
                {language === 'ar' ? 'الظهر' : 'Dhuhr'}
              </h2>
              {dhuhrContentLoading ? (
                <div className="flex items-center justify-center">
                  <span className="w-6 h-6 animate-spin text-white inline-block">🔄</span>
                </div>
              ) : (
                language === 'ar' ? (
                  <div dir="rtl">
                    <p className="leading-relaxed whitespace-pre-line">{dhuhrContent?.ar}</p>
                  </div>
                ) : (
                  <div dir="ltr">
                    <p className="leading-relaxed whitespace-pre-line">{dhuhrContent?.en}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showAsrInfo && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={language === 'ar' ? 'معلومات العصر' : 'Asr Information'}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowAsrInfo(false); }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none"
            style={{ backgroundImage: `url(${PIC_Asr.src})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/40 dark:bg-black/50 z-10 pointer-events-none" aria-hidden="true" />
          <button
            onClick={(e) => { e.stopPropagation(); setShowAsrInfo(false); }}
            className="absolute top-4 right-4 z-30 inline-flex items-center justify-center rounded-full p-2 bg-black/50 hover:bg-black/70 text-white transition pointer-events-auto"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <span className="w-5 h-5 text-white text-lg">✕</span>
          </button>
          <div className="absolute inset-0 flex items-center justify-center p-6 z-20 pointer-events-auto">
            <div className="max-w-2xl text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 font-amiri">
                {language === 'ar' ? 'العصر' : 'Asr'}
              </h2>
              {asrContentLoading ? (
                <div className="flex items-center justify-center">
                  <span className="w-6 h-6 animate-spin text-white inline-block">🔄</span>
                </div>
              ) : (
                language === 'ar' ? (
                  <div dir="rtl">
                    <p className="leading-relaxed whitespace-pre-line">{asrContent?.ar}</p>
                  </div>
                ) : (
                  <div dir="ltr">
                    <p className="leading-relaxed whitespace-pre-line">{asrContent?.en}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showMaghribInfo && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={language === 'ar' ? 'معلومات المغرب' : 'Maghrib Information'}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowMaghribInfo(false); }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none"
            style={{ backgroundImage: `url(${PIC_Maghreb.src})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/40 dark:bg-black/50 z-10 pointer-events-none" aria-hidden="true" />
          <button
            onClick={(e) => { e.stopPropagation(); setShowMaghribInfo(false); }}
            className="absolute top-4 right-4 z-30 inline-flex items-center justify-center rounded-full p-2 bg-black/50 hover:bg-black/70 text-white transition pointer-events-auto"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <span className="w-5 h-5 text-white text-lg">✕</span>
          </button>
          <div className="absolute inset-0 flex items-center justify-center p-6 z-20 pointer-events-auto">
            <div className="max-w-2xl text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 font-amiri">
                {language === 'ar' ? 'المغرب' : 'Maghrib'}
              </h2>
              {maghribContentLoading ? (
                <div className="flex items-center justify-center">
                  <span className="w-6 h-6 animate-spin text-white inline-block">🔄</span>
                </div>
              ) : (
                language === 'ar' ? (
                  <div dir="rtl">
                    <p className="leading-relaxed whitespace-pre-line">{maghribContent?.ar}</p>
                  </div>
                ) : (
                  <div dir="ltr">
                    <p className="leading-relaxed whitespace-pre-line">{maghribContent?.en}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showIshaInfo && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={language === 'ar' ? 'معلومات العشاء' : 'Isha Information'}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowIshaInfo(false); }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none"
            style={{ backgroundImage: `url(${PIC_Isha.src})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/40 dark:bg-black/50 z-10 pointer-events-none" aria-hidden="true" />
          <button
            onClick={(e) => { e.stopPropagation(); setShowIshaInfo(false); }}
            className="absolute top-4 right-4 z-30 inline-flex items-center justify-center rounded-full p-2 bg-black/50 hover:bg-black/70 text-white transition pointer-events-auto"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <span className="w-5 h-5 text-white text-lg">✕</span>
          </button>
          <div className="absolute inset-0 flex items-center justify-center p-6 z-20 pointer-events-auto">
            <div className="max-w-2xl text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 font-amiri">
                {language === 'ar' ? 'العشاء' : 'Isha'}
              </h2>
              {ishaContentLoading ? (
                <div className="flex items-center justify-center">
                  <span className="w-6 h-6 animate-spin text-white inline-block">🔄</span>
                </div>
              ) : (
                language === 'ar' ? (
                  <div dir="rtl">
                    <p className="leading-relaxed whitespace-pre-line">{ishaContent?.ar}</p>
                  </div>
                ) : (
                  <div dir="ltr">
                    <p className="leading-relaxed whitespace-pre-line">{ishaContent?.en}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
 
        {/* Mobile sticky compact header (iOS large title effect) */}
        <div className={`sticky top-0 z-30 md:hidden ${showCompactHeader ? '' : ''}`}>
          <div className={`transition-all duration-200 ${showCompactHeader ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} pointer-events-none`}>
            <div className="h-12 flex items-center px-4 backdrop-blur bg-white/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                {language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 pt-20 lg:pt-24">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 ref={titleRef} className={`text-5xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 font-amiri transition-transform duration-300 ${showCompactHeader ? 'md:scale-100 md:translate-y-0' : 'md:scale-100 md:translate-y-0'}`}>
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
              {formatCurrentTime(currentTime, language)}
            </div>
            
            {/* Gregorian Date */}
            <div className="mb-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {language === 'ar' ? 'التاريخ الميلادي' : 'Gregorian Date'}
              </div>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {currentDates.gregorian ? (
                  formatDate(currentDates.gregorian, language, false)
                ) : (
                  currentTime.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                )}
              </div>
            </div>

            {/* Hijri Date */}
            <div className="mb-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {language === 'ar' ? 'التاريخ الهجري' : 'Hijri Date'}
              </div>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {currentDates.hijri ? (
                  formatDate(currentDates.hijri, language, true)
                ) : (
                  language === 'ar' 
                    ? 'جاري التحميل...'
                    : 'Loading...'
                )}
              </div>
            </div>
            
            {/* Location */}
            {prayerData && (
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'ar' ? 'الموقع' : 'Location'}
                </div>
                <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1">
                  <span className="w-4 h-4 text-gray-600 dark:text-gray-400 text-sm">📍</span>
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
                {formatCountdownNumber(timeUntilNext.hours, language)}:
                {formatCountdownNumber(timeUntilNext.minutes, language)}:
                {formatCountdownNumber(timeUntilNext.seconds, language)}
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
                className={`backdrop-blur-sm rounded-2xl p-6 border shadow-lg transition-all duration-300 hover:shadow-xl bg-cover bg-center ${
                    prayer.name.toLowerCase() === 'fajr' || prayer.name.toLowerCase() === 'sunrise' || prayer.name.toLowerCase() === 'dhuhr' || prayer.name.toLowerCase() === 'asr' || prayer.name.toLowerCase() === 'maghrib' || prayer.name.toLowerCase() === 'isha' ? '' : 'bg-white/80 dark:bg-gray-800/80'
                  } ${
                    prayer.isCurrent
                      ? 'border-green-400 dark:border-green-500 ring-2 ring-green-200 dark:ring-green-800'
                      : prayer.isNext
                        ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                  } ${prayer.name.toLowerCase() === 'fajr' || prayer.name.toLowerCase() === 'sunrise' || prayer.name.toLowerCase() === 'dhuhr' || prayer.name.toLowerCase() === 'asr' || prayer.name.toLowerCase() === 'maghrib' || prayer.name.toLowerCase() === 'isha' ? 'cursor-pointer' : ''}`}
                  style={
                    prayer.name.toLowerCase() === 'fajr'
                      ? { backgroundImage: `url(${PIC_Fajr.src})` }
                      : prayer.name.toLowerCase() === 'sunrise'
                        ? { backgroundImage: `url(${PIC_Sunrise.src})` }
                        : prayer.name.toLowerCase() === 'dhuhr'
                          ? { backgroundImage: `url(${PIC_Dhuhr.src})` }
                          : prayer.name.toLowerCase() === 'asr'
                            ? { backgroundImage: `url(${PIC_Asr.src})` }
                            : prayer.name.toLowerCase() === 'maghrib'
                              ? { backgroundImage: `url(${PIC_Maghreb.src})` }
                              : prayer.name.toLowerCase() === 'isha'
                                ? { backgroundImage: `url(${PIC_Isha.src})` }
                                : undefined
                  }
                  onClick={
                    prayer.name.toLowerCase() === 'fajr' 
                      ? () => setShowFajrInfo(true) 
                      : prayer.name.toLowerCase() === 'sunrise' 
                        ? () => setShowSunriseInfo(true) 
                        : prayer.name.toLowerCase() === 'dhuhr'
                          ? () => setShowDhuhrInfo(true)
                          : prayer.name.toLowerCase() === 'asr'
                            ? () => setShowAsrInfo(true)
                            : prayer.name.toLowerCase() === 'maghrib'
                              ? () => setShowMaghribInfo(true)
                              : prayer.name.toLowerCase() === 'isha'
                                ? () => setShowIshaInfo(true)
                                : undefined
                  }
                  onKeyDown={
                    prayer.name.toLowerCase() === 'fajr' 
                      ? (e) => { if (e.key === 'Enter' || e.key === ' ') setShowFajrInfo(true); } 
                      : prayer.name.toLowerCase() === 'sunrise' 
                        ? (e) => { if (e.key === 'Enter' || e.key === ' ') setShowSunriseInfo(true); } 
                        : prayer.name.toLowerCase() === 'dhuhr' 
                          ? (e) => { if (e.key === 'Enter' || e.key === ' ') setShowDhuhrInfo(true); } 
                        : prayer.name.toLowerCase() === 'asr' 
                          ? (e) => { if (e.key === 'Enter' || e.key === ' ') setShowAsrInfo(true); } 
                          : prayer.name.toLowerCase() === 'maghrib'
                            ? (e) => { if (e.key === 'Enter' || e.key === ' ') setShowMaghribInfo(true); }
                            : prayer.name.toLowerCase() === 'isha'
                              ? (e) => { if (e.key === 'Enter' || e.key === ' ') setShowIshaInfo(true); }
                              : undefined
                  }
                  role={prayer.name.toLowerCase() === 'fajr' || prayer.name.toLowerCase() === 'sunrise' || prayer.name.toLowerCase() === 'dhuhr' || prayer.name.toLowerCase() === 'asr' || prayer.name.toLowerCase() === 'maghrib' || prayer.name.toLowerCase() === 'isha' ? 'button' : undefined}
                  tabIndex={prayer.name.toLowerCase() === 'fajr' || prayer.name.toLowerCase() === 'sunrise' || prayer.name.toLowerCase() === 'dhuhr' || prayer.name.toLowerCase() === 'asr' || prayer.name.toLowerCase() === 'maghrib' || prayer.name.toLowerCase() === 'isha' ? 0 : -1}
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
                  <h3 className="text-xl md:text-4xl font-semibold text-gray-300 dark:text-gray-200 mb-2 font-amiri">
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
              <span className="w-4 h-4 inline-block">🔄</span>
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}