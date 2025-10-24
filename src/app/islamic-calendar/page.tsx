'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../providers';
import Header from '@/components/Header';
import { 
  Calendar, 
  Clock, 
  Star, 
  Moon, 
  Sun, 
  ChevronLeft, 
  ChevronRight,
  CalendarDays,
  Gift,
  MapPin,
  Sparkles,
  ArrowLeftRight,
  RefreshCw
} from 'lucide-react';
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
    error: null
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

      setState(prev => ({
        ...prev,
        currentIslamicYear: dateInfo.year,
        currentIslamicMonth: dateInfo.month,
        currentMonthName: dateInfo.monthName,
        islamicMonths: months,
        specialDays,
        nextHoliday,
        loading: false
      }));
    } catch (error) {
      console.error('Error loading initial data:', error);
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

      setState(prev => ({
        ...prev,
        calendarData,
        loading: false
      }));
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load calendar data',
        loading: false
      }));
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

  const isSpecialDay = (day: CalendarDay) => {
    if (!day?.date?.hijri?.day || !day?.date?.hijri?.month?.number) return false;
    const hijriDay = parseInt(day.date.hijri.day);
    const hijriMonth = day.date.hijri.month.number;
    
    return state.specialDays.some(special => 
      special.day === hijriDay && special.month === hijriMonth
    );
  };

  const getSpecialDayInfo = (day: CalendarDay) => {
    if (!day?.date?.hijri?.day || !day?.date?.hijri?.month?.number) return null;
    const hijriDay = parseInt(day.date.hijri.day);
    const hijriMonth = day.date.hijri.month.number;
    
    return state.specialDays.find(special => 
      special.day === hijriDay && special.month === hijriMonth
    );
  };

  if (state.loading && state.islamicMonths.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <Moon className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-amiri">
              {language === 'ar' ? 'السنة الهجرية الحالية' : 'Current Hijri Year'}
            </h3>
            <div className="text-3xl font-bold text-emerald-600 font-mono">
              {state.currentIslamicYear}
            </div>
          </div>

          {/* Current Islamic Month */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700 text-center">
            <div className="flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-amiri">
              {language === 'ar' ? 'الشهر الهجري الحالي' : 'Current Hijri Month'}
            </h3>
            <div className="text-2xl font-bold text-blue-600 font-amiri">
              {state.currentMonthName ? (language === 'ar' ? state.currentMonthName.ar : state.currentMonthName.en) : ''}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {language === 'ar' ? `الشهر ${state.currentIslamicMonth}` : `Month ${state.currentIslamicMonth}`}
            </div>
          </div>

          {/* Next Holiday */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700 text-center">
            <div className="flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-amiri">
              {language === 'ar' ? 'المناسبة القادمة' : 'Next Holiday'}
            </h3>
            {state.nextHoliday && (
              <>
                <div className="text-lg font-bold text-purple-600 font-amiri mb-1">
                  {language === 'ar' ? state.nextHoliday.name.ar : state.nextHoliday.name.en}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {state.nextHoliday.date.gregorian.date}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {state.nextHoliday.date.hijri.date}
                </div>
              </>
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
                <ArrowLeftRight className="w-4 h-4" />
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
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center min-w-[200px]">
                <div className="text-xl font-bold text-gray-900 dark:text-white font-amiri">
                  {getMonthName(state.selectedMonth, state.calendarType)} {state.selectedYear}
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
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700 mb-8">
          {state.loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
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
                {state.calendarData.map((day, index) => {
                  const isSpecial = isSpecialDay(day);
                  const specialInfo = getSpecialDayInfo(day);
                  const isToday = day?.date?.gregorian?.date 
                    ? new Date().toDateString() === new Date(day.date.gregorian.date).toDateString()
                    : false;

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        isToday
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                          : isSpecial
                            ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        {/* Primary Date */}
                        <div className={`text-lg font-bold mb-1 ${
                          isToday
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : isSpecial
                              ? 'text-purple-700 dark:text-purple-300'
                              : 'text-gray-900 dark:text-white'
                        }`}>
                          {state.calendarType === 'gregorian' 
                            ? day.date.gregorian?.day || ''
                            : day.date.hijri?.day || ''}
                        </div>

                        {/* Secondary Date */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {state.calendarType === 'gregorian' 
                            ? day.date.hijri?.day || '' 
                            : day.date.gregorian?.day || ''}
                        </div>

                        {/* Special Day Indicator */}
                        {isSpecial && specialInfo && (
                          <div className="flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                          </div>
                        )}

                        {/* Today Indicator */}
                        {isToday && (
                          <div className="text-xs mt-1 px-2 py-1 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">
                            {language === 'ar' ? 'اليوم' : 'Today'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Special Days List */}
        {state.specialDays.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center font-amiri">
              {language === 'ar' ? 'المناسبات الإسلامية' : 'Islamic Special Days'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.specialDays.map((day, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-white"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5" />
                    <div className="text-sm font-medium">
                      {language === 'ar' ? `${day.day} ${state.islamicMonths.find(m => m.number === day.month)?.ar}` 
                                         : `${day.day} ${state.islamicMonths.find(m => m.number === day.month)?.en}`}
                    </div>
                  </div>
                  <div className="font-amiri text-lg">
                    {language === 'ar' ? day.name.ar : day.name.en}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Islamic Months Reference */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center font-amiri">
            {language === 'ar' ? 'الأشهر الهجرية' : 'Islamic Months'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {state.islamicMonths.map((month) => (
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
                  {language === 'ar' ? month.ar : month.en}
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