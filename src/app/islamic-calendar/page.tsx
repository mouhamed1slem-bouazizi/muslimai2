'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../providers';
import Header from '@/components/Header';
import IslamicStoryCard from '@/components/IslamicStoryCard';
import {
  getCurrentIslamicYear,
  getCurrentIslamicMonth,
  getIslamicMonths,
  getSpecialDays,
  getNextHijriHoliday,
  getHijriCalendarForGregorianMonth,
  getGregorianCalendarForHijriMonth,
  getCurrentIslamicDateInfo,
  IslamicMonth,
  SpecialDay,
  NextHijriHoliday,
  CalendarDay
} from '@/lib/aladhan-islamic-calendar-api';
import { convertGregorianToHijri, convertHijriToGregorian, formatNumberForLanguage } from '@/lib/date-utils';
import { logger } from '@/lib/logger';

interface CalendarState {
  currentIslamicYear: number;
  currentIslamicMonth: number;
  currentMonthName: { en: string; ar: string } | null;
  islamicMonths: IslamicMonth[];
  specialDays: SpecialDay[];
  nextHoliday: NextHijriHoliday | null;
  calendarData: CalendarDay[];
  selectedMonth: number;
  selectedYear: number;
  calendarType: 'hijri' | 'gregorian';
  loading: boolean;
  error: string | null;
  ramadanDaysRemaining?: number | null;
  ramadanTargetGregorianDate?: string | null;
  ramadanTargetHijriDate?: string | null;
  // Added for click handling
  selectedDay: CalendarDay | null;
  selectedSpecial: SpecialDay | null;
}

export default function IslamicCalendar() {
  const { language, theme } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [state, setState] = useState<CalendarState>({
    currentIslamicYear: 0,
    currentIslamicMonth: 0,
    currentMonthName: null,
    islamicMonths: [],
    specialDays: [],
    nextHoliday: null,
    calendarData: [],
    selectedMonth: new Date().getMonth() + 1,
    selectedYear: new Date().getFullYear(),
    calendarType: 'gregorian',
    loading: true,
    error: null,
    selectedDay: null,
    selectedSpecial: null,
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load calendar data when month/year/type changes
  useEffect(() => {
    if (state.selectedMonth && state.selectedYear) {
      loadCalendarData();
    }
  }, [state.selectedMonth, state.selectedYear, state.calendarType]);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [dateInfo, months, specialDays, nextHoliday] = await Promise.all([
        getCurrentIslamicDateInfo(),
        getIslamicMonths(),
        getSpecialDays(),
        getNextHijriHoliday()
      ]);

      // Calculate Ramadan countdown based on current Hijri year/month
      let ramadanDaysRemaining: number | null = null;
      let ramadanTargetGregorianDate: string | null = null;
      let ramadanTargetHijriDate: string | null = null;
      try {
        const targetHijriYear = dateInfo.month >= 9 ? dateInfo.year + 1 : dateInfo.year;
        const targetGregorian = await convertHijriToGregorian(1, 9, targetHijriYear);
        const gDay = parseInt(targetGregorian.day, 10);
        const gMonthIdx = Number(targetGregorian.month.number) - 1;
        const gYear = parseInt(String(targetGregorian.year), 10);
        const targetUTC = Date.UTC(gYear, gMonthIdx, gDay);
        const now = new Date();
        const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        ramadanDaysRemaining = Math.max(0, Math.ceil((targetUTC - todayUTC) / 86400000));
        ramadanTargetGregorianDate = `${String(gDay).padStart(2, '0')}-${String(gMonthIdx + 1).padStart(2, '0')}-${String(gYear)}`;
        ramadanTargetHijriDate = `01-09-${String(targetHijriYear)}`;
      } catch (e) {
        logger.warn('Failed to compute Ramadan countdown:', e as Error);
        ramadanDaysRemaining = null;
        ramadanTargetGregorianDate = null;
        ramadanTargetHijriDate = null;
      }

      setState(prev => ({
        ...prev,
        currentIslamicYear: dateInfo.year,
        currentIslamicMonth: dateInfo.month,
        currentMonthName: dateInfo.monthName,
        islamicMonths: months,
        specialDays,
        nextHoliday,
        ramadanDaysRemaining,
        ramadanTargetGregorianDate,
        ramadanTargetHijriDate,
        loading: false
      }));
    } catch (error) {
      logger.warn('Error loading initial data:', error as Error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load Islamic calendar data',
        loading: false
      }));
    }
  };

  const loadCalendarData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      let calendarData: CalendarDay[];
      if (state.calendarType === 'gregorian') {
        calendarData = await getHijriCalendarForGregorianMonth(state.selectedMonth, state.selectedYear);
      } else {
        calendarData = await getGregorianCalendarForHijriMonth(state.selectedMonth, state.selectedYear);
      }

      // Validate shape; if invalid or empty, use local fallback
      const isValid = isCalendarDataValid(calendarData, state.calendarType);
      if (!Array.isArray(calendarData) || calendarData.length === 0 || !isValid) {
        const generated = state.calendarType === 'gregorian'
           ? await generateGregorianMonthFallback(state.selectedMonth, state.selectedYear, state.islamicMonths, state.specialDays)
           : await generateHijriMonthFallback(state.selectedMonth, state.selectedYear, state.islamicMonths);
        calendarData = generated;
      }

      setState(prev => ({
        ...prev,
        calendarData,
        loading: false
      }));
    } catch (error) {
      logger.warn('Error loading calendar data:', error as Error);
      // Attempt local fallback on error
      try {
        const generated = state.calendarType === 'gregorian'
          ? await generateGregorianMonthFallback(state.selectedMonth, state.selectedYear, state.islamicMonths, state.specialDays)
          : await generateHijriMonthFallback(state.selectedMonth, state.selectedYear, state.islamicMonths);
        setState(prev => ({ ...prev, calendarData: generated, loading: false }));
      } catch (innerError) {
        logger.warn('Error generating local calendar fallback:', innerError as Error);
        setState(prev => ({ ...prev, error: 'Failed to load calendar data', loading: false }));
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setState(prev => {
      let newMonth = prev.selectedMonth;
      let newYear = prev.selectedYear;

      if (direction === 'next') {
        newMonth += 1;
        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        }
      } else {
        newMonth -= 1;
        if (newMonth < 1) {
          newMonth = 12;
          newYear -= 1;
        }
      }

      return {
        ...prev,
        selectedMonth: newMonth,
        selectedYear: newYear
      };
    });
  };

  const toggleCalendarType = () => {
    setState(prev => ({
      ...prev,
      calendarType: prev.calendarType === 'gregorian' ? 'hijri' : 'gregorian',
      selectedMonth: prev.calendarType === 'gregorian' ? prev.currentIslamicMonth : new Date().getMonth() + 1,
      selectedYear: prev.calendarType === 'gregorian' ? prev.currentIslamicYear : new Date().getFullYear()
    }));
  };

  const getMonthName = (monthNumber: number, type: 'gregorian' | 'hijri') => {
    if (type === 'hijri') {
      const month = state.islamicMonths.find(m => m.number === monthNumber);
      return month ? (language === 'ar' ? month.ar : month.en) : '';
    } else {
      const gregorianMonths = {
        en: ['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December'],
        ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
              'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      };
      return gregorianMonths[language][monthNumber - 1] || '';
    }
  };

  const checkIsSpecialHijriDay = (day: CalendarDay) => {
    try {
      const hijriDayStr = day?.date?.hijri?.day;
      const hijriMonthNum = day?.date?.hijri?.month?.number;
      if (!hijriDayStr || !hijriMonthNum) return false;
      const hijriDay = parseInt(hijriDayStr);
      const hijriMonth = hijriMonthNum;
      return Array.isArray(state.specialDays) && state.specialDays.some(
        (special) => typeof special.day === 'number' && typeof special.month === 'number' &&
          special.day === hijriDay && special.month === hijriMonth
      );
    } catch (e) {
      return false;
    }
  };

  // Back-compat alias to avoid stale chunk references
  const isSpecialDay = (day: CalendarDay) => {
    return checkIsSpecialHijriDay(day);
  };

  const getSpecialHijriDayInfo = (day: CalendarDay) => {
    try {
      const hijriDayStr = day?.date?.hijri?.day;
      const hijriMonthNum = day?.date?.hijri?.month?.number;
      if (!hijriDayStr || !hijriMonthNum) return null;
      const hijriDay = parseInt(hijriDayStr);
      const hijriMonth = hijriMonthNum;
      const fromSpecialDays = (Array.isArray(state.specialDays)
        ? state.specialDays.find(
            (special) => typeof special.day === 'number' && typeof special.month === 'number' &&
              special.day === hijriDay && special.month === hijriMonth
          )
        : null) || null;

      const holidayNameCandidate = (day?.date?.hijri?.holidays || []).find(
        (h) => !!h && h.trim().length > 0
      );

      if (fromSpecialDays) {
        const en = (fromSpecialDays.name?.en || '').trim();
        const ar = (fromSpecialDays.name?.ar || '').trim();
        if (en || ar) return fromSpecialDays;
        if (holidayNameCandidate) {
          return ({
            day: hijriDay,
            month: hijriMonth,
            name: { en: holidayNameCandidate, ar: holidayNameCandidate },
            type: fromSpecialDays.type || 'holiday'
          } as SpecialDay);
        }
        // As an absolute last resort, return a generic label
        return ({
          day: hijriDay,
          month: hijriMonth,
          name: { en: 'Special Day', ar: 'مناسبة خاصة' },
          type: fromSpecialDays.type || 'holiday'
        } as SpecialDay);
      }

      return holidayNameCandidate
        ? ({ day: hijriDay, month: hijriMonth, name: { en: holidayNameCandidate, ar: holidayNameCandidate }, type: 'holiday' } as SpecialDay)
        : null;
    } catch (e) {
      return null;
    }
  };

  // Back-compat alias to avoid stale chunk references
  const getSpecialDayInfo = (day: CalendarDay) => {
    return getSpecialHijriDayInfo(day);
  };

  // Handle grid cell click to show special-day details
  const handleDayClick = (day: CalendarDay) => {
    const special = getSpecialHijriDayInfo(day);
    setState(prev => ({ ...prev, selectedDay: day, selectedSpecial: special }));
  };

  if (state.loading && state.islamicMonths.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-24">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <span className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4 text-3xl inline-block">🔄</span>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'جاري تحميل التقويم الإسلامي...' : 'Loading Islamic Calendar...'}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-24">
          <div className="text-center py-12">
            <div className="bg-red-100 dark:bg-red-900/30 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-red-600 dark:text-red-400 mb-4">{state.error}</p>
              <button
                onClick={loadInitialData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 font-amiri">
            {language === 'ar' ? 'التقويم الإسلامي' : 'Islamic Calendar'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            {language === 'ar' 
              ? 'التقويم الهجري الشامل مع المناسبات الإسلامية والتحويل بين التقاويم'
              : 'Complete Hijri calendar with Islamic occasions and calendar conversions'
            }
          </p>
        </div>

        {/* Current Islamic Date Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Current Islamic Year */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700 text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="w-8 h-8 text-emerald-600 text-2xl">🌙</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-amiri">
              {language === 'ar' ? 'السنة الهجرية الحالية' : 'Current Hijri Year'}
            </h3>
            <div className="text-3xl font-bold text-emerald-600 font-mono">
              {formatNumberForLanguage(state.currentIslamicYear, language)}
            </div>
          </div>

          {/* Current Islamic Month */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700 text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="w-8 h-8 text-blue-600 text-2xl">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-amiri">
              {language === 'ar' ? 'الشهر الهجري الحالي' : 'Current Hijri Month'}
            </h3>
            <div className="text-2xl font-bold text-blue-600 font-amiri">
              {state.currentMonthName ? (language === 'ar' ? state.currentMonthName.ar : state.currentMonthName.en) : ''}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {language === 'ar' ? `الشهر ${formatNumberForLanguage(state.currentIslamicMonth, language)}` : `Month ${state.currentIslamicMonth}`}
            </div>
          </div>

          {/* Ramadan Countdown (replaces Next Holiday) */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700 text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="w-8 h-8 text-purple-600 text-2xl">🎁</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-amiri">
              {language === 'ar' ? 'العد التنازلي لرمضان' : 'Ramadan Countdown'}
            </h3>
            <div className="text-lg font-bold text-purple-600 font-amiri mb-1">
              {typeof state.ramadanDaysRemaining === 'number' ? (
                language === 'ar'
                  ? `بداية رمضان بعد ${formatNumberForLanguage(state.ramadanDaysRemaining, language)} ${formatDaysAr(state.ramadanDaysRemaining)}`
                  : `Ramadan begins in ${state.ramadanDaysRemaining} days`
              ) : (
                language === 'ar' ? 'غير متوفر مؤقتًا' : 'Temporarily unavailable'
              )}
            </div>
            {state.ramadanTargetGregorianDate && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'التاريخ الميلادي:' : 'Gregorian:'} {state.ramadanTargetGregorianDate}
              </div>
            )}
            {state.ramadanTargetHijriDate && (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {language === 'ar' ? 'التاريخ الهجري:' : 'Hijri:'} {state.ramadanTargetHijriDate}
              </div>
            )}
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Calendar Type Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleCalendarType}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <span className="w-4 h-4 text-lg">↔️</span>
                {state.calendarType === 'gregorian' 
                  ? (language === 'ar' ? 'عرض التقويم الهجري' : 'Show Hijri Calendar')
                  : (language === 'ar' ? 'عرض التقويم الميلادي' : 'Show Gregorian Calendar')
                }
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {state.calendarType === 'gregorian'
                  ? (language === 'ar' ? 'التقويم الميلادي مع التواريخ الهجرية' : 'Gregorian Calendar with Hijri Dates')
                  : (language === 'ar' ? 'التقويم الهجري مع التواريخ الميلادية' : 'Hijri Calendar with Gregorian Dates')
                }
              </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="w-5 h-5 text-lg">◀️</span>
              </button>
              
              <div className="text-center min-w-[200px]">
                <div className="text-xl font-bold text-gray-900 dark:text-white font-amiri">
                  {getMonthName(state.selectedMonth, state.calendarType)} {formatNumberForLanguage(state.selectedYear, language)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {state.calendarType === 'gregorian' 
                    ? (language === 'ar' ? 'ميلادي' : 'Gregorian')
                    : (language === 'ar' ? 'هجري' : 'Hijri')
                  }
                </div>
              </div>

              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="w-5 h-5 text-lg">▶️</span>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700 mb-8">
          {state.loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-8 h-8 text-emerald-600 animate-spin text-2xl inline-block">🔄</span>
            </div>
          ) : (
            <>
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <div key={day} className="text-center py-2 font-semibold text-gray-600 dark:text-gray-400">
                    {language === 'ar' 
                      ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][index]
                      : day
                    }
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {state.calendarData.filter(day => !!day?.date).map((day, index) => {
                   try {
                     const hasHijri = !!day?.date?.hijri?.day && !!day?.date?.hijri?.month?.number;
                     const isSpecial = hasHijri ? checkIsSpecialHijriDay(day) : false;
                     const specialInfo = hasHijri ? getSpecialHijriDayInfo(day) : null;
                     const today = new Date();
                     const gDay = today.getDate();
                     const gMonth = today.getMonth() + 1;
                     const gYear = today.getFullYear();
                     const isTodayGregorian = String(day?.date?.gregorian?.day) === String(gDay)
                       && Number(day?.date?.gregorian?.month?.number) === gMonth
                       && String(day?.date?.gregorian?.year) === String(gYear);
                     let isTodayHijri = false;
                     try {
                       const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(today);
                       const hDay = Number(parts.find(p => p.type === 'day')?.value || 0);
                       const hMonth = Number(parts.find(p => p.type === 'month')?.value || 0);
                       const hYear = String(parts.find(p => p.type === 'year')?.value || '');
                       isTodayHijri = String(day?.date?.hijri?.day) === String(hDay)
                         && Number(day?.date?.hijri?.month?.number) === hMonth
                         && String(day?.date?.hijri?.year) === String(hYear);
                     } catch {
                       try {
                         const parts2 = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(today);
                         const hDay2 = Number(parts2.find(p => p.type === 'day')?.value || 0);
                         const hMonth2 = Number(parts2.find(p => p.type === 'month')?.value || 0);
                         const hYear2 = String(parts2.find(p => p.type === 'year')?.value || '');
                         isTodayHijri = String(day?.date?.hijri?.day) === String(hDay2)
                           && Number(day?.date?.hijri?.month?.number) === hMonth2
                           && String(day?.date?.hijri?.year) === String(hYear2);
                       } catch {
                         isTodayHijri = false;
                       }
                     }
                     const isToday = state.calendarType === 'gregorian' ? isTodayGregorian : isTodayHijri;

                     return (
                    <div
                       key={index}
                       className={`relative p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                         isToday
                           ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500 dark:ring-emerald-400'
                           : isSpecial
                             ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
                             : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                       }`}
                       onClick={() => handleDayClick(day)}
                     >
                       {isToday && (
                         <div className="absolute top-1 right-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-white dark:bg-emerald-600">
                           {language === 'ar' ? 'اليوم' : 'Today'}
                         </div>
                       )}
                       <div className="text-center">
                        {/* Primary Date */}
                         <div className={`text-lg font-extrabold mb-1 ${
                           isToday
                             ? 'text-emerald-700 dark:text-emerald-300'
                             : isSpecial
                               ? 'text-purple-700 dark:text-purple-300'
                               : 'text-gray-900 dark:text-white'
                         }`}>
                           {state.calendarType === 'gregorian' 
                             ? formatNumberForLanguage(day?.date?.gregorian?.day ?? '', language)
                             : formatNumberForLanguage(day?.date?.hijri?.day ?? '', language)}
                        </div>

                        {/* Secondary Date */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {state.calendarType === 'gregorian' 
                            ? formatNumberForLanguage(day?.date?.hijri?.day ?? '', language)
                            : formatNumberForLanguage(day?.date?.gregorian?.day ?? '', language)}
                        </div>

                        {/* Special day badge inside cell */}
                        {isSpecial && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-purple-700 dark:text-purple-300">
                            <span className="w-3 h-3 text-sm">⭐</span>
                            <span>
                              {language === 'ar'
                                ? (specialInfo?.name?.ar || specialInfo?.name?.en || (day?.date?.hijri?.holidays || []).find((h) => !!h && h.trim().length > 0) || 'مناسبة خاصة')
                                : (specialInfo?.name?.en || specialInfo?.name?.ar || (day?.date?.hijri?.holidays || []).find((h) => !!h && h.trim().length > 0) || 'Special Day')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } catch (e) {
                  return (
                    <div
                      key={index}
                      className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold mb-1 text-gray-400">{''}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{''}</div>
                      </div>
                    </div>
                  );
                }
              })}
              </div>
            </>
          )}
        </div>

        {/* Selected Day Detail Panel */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
          <div className="max-w-7xl mx-auto">
            {state.selectedDay ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ar' ? 'التاريخ الميلادي' : 'Gregorian Date'}: {state.selectedDay?.date?.gregorian?.date}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ar' ? 'التاريخ الهجري' : 'Hijri Date'}: {state.selectedDay?.date?.hijri?.date}
                  </div>
                </div>
                <div>
                  {state.selectedSpecial ? (
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <span className="w-4 h-4 text-lg">⭐</span>
                      <span className="font-medium">
                        {language === 'ar' ? (state.selectedSpecial.name.ar || state.selectedSpecial.name.en) : (state.selectedSpecial.name.en || state.selectedSpecial.name.ar)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-gray-700 dark:text-gray-300">
                      {language === 'ar' ? 'لا توجد مناسبة خاصة لهذا اليوم' : 'No special day for this date'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                {language === 'ar' ? 'اضغط على أي يوم لعرض التفاصيل' : 'Click any day to view details'}
              </div>
            )}
          </div>
        </div>

        {/* Featured Islamic Story (replaces Special Days list) */}
        <IslamicStoryCard />

        {/* Islamic Months Reference */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center font-amiri">
            {language === 'ar' ? 'الأشهر الهجرية' : 'Islamic Months'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {state.islamicMonths.filter(Boolean).map((month) => (
                       <div
                         key={month.number}
                         className={`p-4 rounded-xl border text-center transition-all duration-200 hover:shadow-md ${
                           month.number === state.currentIslamicMonth
                             ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                             : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                         }`}
                       >
                         <div className={`text-2xl font-bold mb-2 ${
                           month.number === state.currentIslamicMonth
                             ? 'text-emerald-600'
                             : 'text-gray-600 dark:text-gray-400'
                         }`}>
                           {month.number}
                         </div>
                         <div className={`font-amiri text-lg ${
                           month.number === state.currentIslamicMonth
                             ? 'text-emerald-700 dark:text-emerald-300'
                             : 'text-gray-900 dark:text-white'
                         }`}>
                          {language === 'ar' ? (month?.ar ?? month?.en ?? '') : (month?.en ?? month?.ar ?? '')}
                         </div>
                         {month.number === state.currentIslamicMonth && (
                           <div className="text-xs mt-2 px-2 py-1 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">
                             {language === 'ar' ? 'الشهر الحالي' : 'Current Month'}
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
      </main>
    </div>
  );
}

// Generate local fallback for Gregorian calendar with Hijri dates
const generateGregorianMonthFallback = async (
  month: number,
  year: number,
  months: IslamicMonth[],
  specialDays: SpecialDay[] = []
): Promise<CalendarDay[]> => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const items = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const results: CalendarDay[] = await Promise.all(items.map(async (dayNum) => {
    const d = new Date(year, month - 1, dayNum);
    const weekdayEn = d.toLocaleDateString('en-US', { weekday: 'long' });
    const monthEn = d.toLocaleDateString('en-US', { month: 'long' });
    const dd = String(dayNum).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    const yyyy = String(year);

    // Prefer local ICU conversion first to avoid API rate limits
    let hijri = null as any;
    try {
      const enNumeric = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric', month: 'numeric', year: 'numeric', weekday: 'long'
      }).formatToParts(d);
      const enLong = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
      }).formatToParts(d);
      let arLong: Intl.DateTimeFormatPart[] = [];
      try {
        arLong = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
          day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
        }).formatToParts(d);
      } catch {
        arLong = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
          day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
        }).formatToParts(d);
      }
      const hijriDayStr = enNumeric.find(p => p.type === 'day')?.value || '1';
      const hijriMonthNum = Number(enNumeric.find(p => p.type === 'month')?.value || 1);
      const hijriYearStr = enNumeric.find(p => p.type === 'year')?.value || '1446';
      const hijriWeekdayEn = enNumeric.find(p => p.type === 'weekday')?.value || weekdayEn;
      const hijriWeekdayAr = (arLong.find(p => p.type === 'weekday')?.value || d.toLocaleDateString('ar-SA', { weekday: 'long' }));
      const hijriMonthEn = (enLong.find(p => p.type === 'month')?.value || 'Muharram');
      const hijriMonthAr = (arLong.find(p => p.type === 'month')?.value || 'محرم');
      hijri = {
        day: String(hijriDayStr),
        month: { number: hijriMonthNum, en: String(hijriMonthEn), ar: String(hijriMonthAr) },
        year: String(hijriYearStr),
        weekday: { en: String(hijriWeekdayEn), ar: String(hijriWeekdayAr) },
        designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' }
      };
    } catch {
      // Last resort: call API for this date
      try {
        hijri = await convertGregorianToHijri(`${dd}-${mm}-${yyyy}`);
      } catch {
        const arWeekdayMap: Record<string, string> = {
          Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس',
          Friday: 'الجمعة', Saturday: 'السبت', Sunday: 'الأحد'
        };
        hijri = {
          day: dd,
          month: { number: 1, en: 'Muharram', ar: 'محرم' },
          year: String(new Date().getFullYear()),
          weekday: { en: weekdayEn, ar: arWeekdayMap[weekdayEn] || 'الإثنين' },
          designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' }
        };
      }
    }

    const holidaysFromSpecial = specialDays
      .filter(s => s.day === Number(hijri.day) && s.month === Number(hijri.month.number))
      .map(s => s.name?.en || s.name?.ar || '');

    const entry = {
      date: {
        readable: d.toDateString(),
        timestamp: String(Math.floor(d.getTime() / 1000)),
        hijri: {
          date: `${String(hijri.day).padStart(2, '0')}-${String(hijri.month.number).padStart(2, '0')}-${hijri.year}`,
          format: 'DD-MM-YYYY',
          day: String(hijri.day),
          weekday: { en: hijri.weekday.en, ar: hijri.weekday.ar },
          month: { number: hijri.month.number, en: hijri.month.en, ar: hijri.month.ar },
          year: String(hijri.year),
          designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' },
          holidays: holidaysFromSpecial
        },
        gregorian: {
          date: `${dd}-${mm}-${yyyy}`,
          format: 'DD-MM-YYYY',
          day: String(dayNum),
          weekday: { en: weekdayEn },
          month: { number: month, en: monthEn },
          year: yyyy,
          designation: { abbreviated: 'CE', expanded: 'Common Era' }
        }
      }
    } as any as CalendarDay;
    return entry;
  }));
  return results;
};

// Generate local fallback for Hijri calendar with Gregorian dates
const generateHijriMonthFallback = async (month: number, year: number, months: IslamicMonth[]): Promise<CalendarDay[]> => {
  const hijriMonth = months.find(m => m.number === month);
   const daysInHijriMonth = 30; // best-effort fallback
   const items = Array.from({ length: daysInHijriMonth }, (_, i) => i + 1);
   const results: CalendarDay[] = await Promise.all(items.map(async (dayNum) => {
     let greg;
     try {
       greg = await convertHijriToGregorian(dayNum, month, year);
     } catch {
       const d = new Date();
       greg = {
         day: String(d.getDate()),
         month: { number: d.getMonth() + 1, en: d.toLocaleDateString('en-US', { month: 'long' }) },
         year: String(d.getFullYear()),
         weekday: { en: d.toLocaleDateString('en-US', { weekday: 'long' }) },
         designation: { abbreviated: 'CE', expanded: 'Common Era' }
       };
     }

     const dd = String(dayNum).padStart(2, '0');
     const mm = String(month).padStart(2, '0');
     const yyyy = String(year);

     const entry = {
       date: {
         readable: `${dd}-${mm}-${yyyy}`,
         timestamp: String(Math.floor(Date.now() / 1000)),
         hijri: {
           date: `${dd}-${mm}-${yyyy}`,
           format: 'DD-MM-YYYY',
           day: String(dayNum),
           weekday: { en: 'Monday', ar: 'الإثنين' },
           month: { number: month, en: hijriMonth?.en || 'Muharram', ar: hijriMonth?.ar || 'محرم' },
           year: yyyy,
           designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' },
           holidays: []
         },
         gregorian: {
           date: `${String(greg.day).padStart(2, '0')}-${String(greg.month.number).padStart(2, '0')}-${greg.year}`,
           format: 'DD-MM-YYYY',
           day: String(greg.day),
           weekday: { en: greg.weekday.en },
           month: { number: greg.month.number, en: greg.month.en },
           year: String(greg.year),
           designation: { abbreviated: 'CE', expanded: 'Common Era' }
         }
       }
     } as any as CalendarDay;
     return entry;
   }));
   return results;
 };

// Validate calendar data shape
const isCalendarDataValid = (data: CalendarDay[], type: 'gregorian' | 'hijri'): boolean => {
  if (!Array.isArray(data) || data.length === 0) return false;
  // Require most items to have both date objects
  const validItems = data.filter((d) => {
    const hasDate = !!d?.date;
    const hasG = !!d?.date?.gregorian?.day && !!d?.date?.gregorian?.date;
    const hasH = !!d?.date?.hijri?.day && !!d?.date?.hijri?.date;
    return hasDate && hasG && hasH;
  }).length;
  return validItems >= Math.max(1, Math.floor(data.length * 0.6));
};

// Helper: Arabic pluralization for days
const formatDaysAr = (n: number) => {
  if (n === 1) return 'يوم';
  if (n === 2) return 'يومان';
  return 'أيام';
};