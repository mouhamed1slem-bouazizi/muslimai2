'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../providers';
import Header from '@/components/Header';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Moon, 
  Sun,
  Star,
  Heart,
  MapPin,
  Clock,
  Sunrise,
  Sunset
} from 'lucide-react';
import { islamicCalendarAPI } from '@/lib/islamic-calendar-api';
import type { 
  CalendarDay, 
  CalendarResponse, 
  SpecialDay, 
  IslamicMonth
} from '@/lib/islamic-calendar-api';

interface CalendarState {
  calendarData: CalendarDay[];
  specialDays: SpecialDay[];
  islamicMonths: IslamicMonth[];
  currentInfo: {
    currentYear: number | string;
    currentMonth: string;
    nextHoliday: string;
  };
  loading: boolean;
  error: string | null;
}

export default function IslamicCalendar() {
  const { language, theme } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarType, setCalendarType] = useState<'gregorian' | 'hijri'>('gregorian');
  const [calendarState, setCalendarState] = useState<CalendarState>({
    calendarData: [],
    specialDays: [],
    islamicMonths: [],
    currentInfo: {
      currentYear: 1445,
      currentMonth: 'Ramadan',
      nextHoliday: 'Eid al-Fitr'
    },
    loading: true,
    error: null
  });

  const toggleCalendarType = () => {
    setCalendarType(prev => prev === 'gregorian' ? 'hijri' : 'gregorian');
  };

  const getDateEvents = (day: CalendarDay): string[] => {
    const events: string[] = [];
    
    // Filter special days that might be related to this date
    const relevantSpecialDays = calendarState.specialDays.filter(special =>    
      special.name.ar?.toLowerCase().includes('رمضان') ||
      special.name.ar?.toLowerCase().includes('عيد') ||
      special.name.ar?.toLowerCase().includes('حج') ||
      special.name.en?.toLowerCase().includes('ramadan') ||
      special.name.en?.toLowerCase().includes('eid') ||
      special.name.en?.toLowerCase().includes('hajj')
    );
    
    relevantSpecialDays.forEach(special => {
      events.push(language === 'ar' ? special.name.ar : special.name.en);
    });
    
    return events;
  };

  const getMonthName = (monthNumber: number, type: 'gregorian' | 'hijri'): string => {
    if (type === 'hijri') {
      const hijriMonths = language === 'ar' ? [
        'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
        'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
      ] : [
        'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani',
        'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
      ];
      return hijriMonths[monthNumber - 1] || '';
    } else {
      const gregorianMonths = language === 'ar' ? [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ] : [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return gregorianMonths[monthNumber - 1] || '';
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const isToday = (day: CalendarDay): boolean => {
    const today = new Date();
    const dayDate = new Date(day.gregorian.date);
    return dayDate.toDateString() === today.toDateString();
  };

  // Load calendar data
  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        setCalendarState(prev => ({ ...prev, loading: true, error: null }));
        
        const comprehensiveData = await islamicCalendarAPI.getComprehensiveCalendarData(
          new Date().getMonth() + 1, 
          new Date().getFullYear(), 
          false
        );
        
        setCalendarState(prev => ({
          ...prev,
          calendarData: comprehensiveData.calendar.data || [],
          specialDays: comprehensiveData.specialDays.data || [],
          islamicMonths: comprehensiveData.islamicMonths.data || [],
          currentInfo: {
            currentYear: (typeof comprehensiveData.currentYear === 'object' && comprehensiveData.currentYear?.data?.year) 
              ? Number(comprehensiveData.currentYear.data.year) 
              : (typeof comprehensiveData.currentYear === 'number' ? comprehensiveData.currentYear : 1445),
            currentMonth: (typeof comprehensiveData.currentMonth === 'object' && comprehensiveData.currentMonth?.data) 
              ? (comprehensiveData.currentMonth.data.month?.ar || comprehensiveData.currentMonth.data.month?.en || 'Ramadan')
              : (typeof comprehensiveData.currentMonth === 'string' ? comprehensiveData.currentMonth : 'Ramadan'),
            nextHoliday: (typeof comprehensiveData.nextHoliday === 'object' && comprehensiveData.nextHoliday?.data?.name) 
              ? comprehensiveData.nextHoliday.data.name 
              : 'Eid al-Fitr'
          },
          loading: false
        }));
      } catch (error) {
        console.error('Error loading calendar data:', error);
        setCalendarState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load calendar data'
        }));
      }
    };

    loadCalendarData();
  }, []);

  if (calendarState.loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'جاري تحميل التقويم...' : 'Loading calendar...'}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (calendarState.error) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Calendar className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-red-600 dark:text-red-400">
                {language === 'ar' ? 'خطأ في تحميل التقويم' : 'Error loading calendar'}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                {calendarState.error}
              </p>
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
              ? 'التقويم الهجري مع المناسبات الإسلامية والتحويل بين التقاويم'
              : 'Hijri calendar with Islamic occasions and date conversion'
            }
          </p>
          
          {/* Current Islamic Info */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto border border-emerald-200 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mb-2">
              <Moon className="w-5 h-5 text-emerald-600" />
              <span className="text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'السنة الهجرية الحالية' : 'Current Hijri Year'}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
              {calendarState.currentInfo.currentYear}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {language === 'ar' ? 'الشهر الحالي:' : 'Current Month:'} {calendarState.currentInfo.currentMonth}
            </div>
            {calendarState.currentInfo.nextHoliday && (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                {language === 'ar' ? 'المناسبة القادمة:' : 'Next Holiday:'} {calendarState.currentInfo.nextHoliday}
              </div>
            )}
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-emerald-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-amiri">
                {getMonthName(currentDate.getMonth() + 1, calendarType)} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                onClick={toggleCalendarType}
                className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-300"
              >
                {calendarType === 'gregorian' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>
                  {calendarType === 'gregorian' 
                    ? (language === 'ar' ? 'التقويم الهجري' : 'Hijri Calendar')
                    : (language === 'ar' ? 'التقويم الميلادي' : 'Gregorian Calendar')
                  }
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700 mb-8">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {(language === 'ar' ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : 
              ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarState.calendarData.slice(0, 42).map((day, index) => {
              const events = getDateEvents(day);
              const todayClass = isToday(day) ? 'bg-emerald-500 text-white' : '';
              const hasEvents = events.length > 0;
              
              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-2 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    todayClass || 
                    (hasEvents 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700')
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium ${
                      isToday(day) ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      {calendarType === 'gregorian' ? day.gregorian.day : day.hijri.day}
                    </span>
                    {hasEvents && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Secondary date */}
                  <div className={`text-xs ${
                    isToday(day) ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {calendarType === 'gregorian' ? day.hijri.day : day.gregorian.day}
                  </div>
                  
                  {/* Events */}
                  {events.slice(0, 2).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`text-xs mt-1 px-1 py-0.5 rounded truncate ${
                        isToday(day) 
                          ? 'bg-white/20 text-white' 
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      }`}
                      title={event}
                    >
                      {event}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Special Days Section */}
        {calendarState.specialDays.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center font-amiri">
              {language === 'ar' ? 'المناسبات الإسلامية' : 'Islamic Occasions'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {calendarState.specialDays.slice(0, 6).map((specialDay, index) => (
                <div
                  key={index}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-emerald-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-amiri">
                      {language === 'ar' ? specialDay.name.ar : specialDay.name.en}
                    </h3>
                  </div>
                  {specialDay.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {language === 'ar' ? specialDay.description.ar : specialDay.description.en}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Islamic Quote */}
        <div className="text-center bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-white/80 mx-2" />
            <Moon className="w-8 h-8 text-white" />
            <Heart className="w-6 h-6 text-white/80 mx-2" />
          </div>
          <blockquote className="text-xl md:text-2xl font-amiri mb-4">
            {language === 'ar' 
              ? '"إِنَّ عِدَّةَ الشُّهُورِ عِندَ اللَّهِ اثْنَا عَشَرَ شَهْرًا فِي كِتَابِ اللَّهِ"'
              : '"Indeed, the number of months with Allah is twelve months in the register of Allah"'
            }
          </blockquote>
          <cite className="text-white/80">
            {language === 'ar' ? 'سورة التوبة - آية 36' : 'Quran 9:36'}
          </cite>
        </div>
      </main>
    </div>
  );
}