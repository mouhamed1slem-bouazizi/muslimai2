'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Moon, Sun, Star, Clock, Globe, BookOpen } from 'lucide-react';
import islamicCalendarAPI, { CalendarDay, SpecialDay, IslamicMonth } from '@/lib/islamic-calendar-api';

interface CalendarState {
  currentMonth: number;
  currentYear: number;
  isHijri: boolean;
  calendarData: CalendarDay[];
  specialDays: SpecialDay[];
  islamicMonths: IslamicMonth[];
  currentIslamicInfo: {
    currentYear: number;
    currentMonth: number;
    nextHoliday: any;
  } | null;
  loading: boolean;
  error: string | null;
}

const IslamicCalendarPage: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [calendarState, setCalendarState] = useState<CalendarState>({
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear(),
    isHijri: false,
    calendarData: [],
    specialDays: [],
    islamicMonths: [],
    currentIslamicInfo: null,
    loading: true,
    error: null
  });

  const [selectedDate, setSelectedDate] = useState<CalendarDay | null>(null);

  // Translations
  const translations = {
    en: {
      title: 'Islamic Calendar',
      subtitle: 'Hijri & Gregorian Calendar with Islamic Events',
      gregorianCalendar: 'Gregorian Calendar',
      hijriCalendar: 'Hijri Calendar',
      currentIslamicYear: 'Current Islamic Year',
      currentIslamicMonth: 'Current Islamic Month',
      nextHoliday: 'Next Holiday',
      specialDays: 'Special Days',
      islamicHolidays: 'Islamic Holidays',
      today: 'Today',
      loading: 'Loading calendar...',
      error: 'Error loading calendar data',
      retry: 'Retry',
      dateConverter: 'Date Converter',
      ramadanCalendar: 'Ramadan Calendar',
      language: 'Language',
      monthNames: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    },
    ar: {
      title: 'التقويم الإسلامي',
      subtitle: 'التقويم الهجري والميلادي مع الأحداث الإسلامية',
      gregorianCalendar: 'التقويم الميلادي',
      hijriCalendar: 'التقويم الهجري',
      currentIslamicYear: 'السنة الهجرية الحالية',
      currentIslamicMonth: 'الشهر الهجري الحالي',
      nextHoliday: 'العطلة القادمة',
      specialDays: 'الأيام المميزة',
      islamicHolidays: 'الأعياد الإسلامية',
      today: 'اليوم',
      loading: 'جاري تحميل التقويم...',
      error: 'خطأ في تحميل بيانات التقويم',
      retry: 'إعادة المحاولة',
      dateConverter: 'محول التاريخ',
      ramadanCalendar: 'تقويم رمضان',
      language: 'اللغة',
      monthNames: [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ],
      weekDays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    }
  };

  const t = translations[language];

  // Load calendar data
  const loadCalendarData = async () => {
    try {
      setCalendarState(prev => ({ ...prev, loading: true, error: null }));

      const [comprehensiveData, currentInfo] = await Promise.all([
        islamicCalendarAPI.getComprehensiveCalendarData(
          calendarState.currentMonth,
          calendarState.currentYear,
          calendarState.isHijri
        ),
        Promise.resolve({
          currentYear: 1445,
          currentMonth: 1,
          nextHoliday: null
        })
      ]);

      setCalendarState(prev => ({
        ...prev,
        calendarData: comprehensiveData.calendar.data || [],
        specialDays: comprehensiveData.specialDays.data || [],
        islamicMonths: comprehensiveData.islamicMonths.data || [],
        currentIslamicInfo: currentInfo,
        loading: false
      }));
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setCalendarState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      }));
    }
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarState(prev => {
      let newMonth = prev.currentMonth;
      let newYear = prev.currentYear;

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
        currentMonth: newMonth,
        currentYear: newYear
      };
    });
  };

  // Toggle calendar type
  const toggleCalendarType = () => {
    setCalendarState(prev => ({
      ...prev,
      isHijri: !prev.isHijri
    }));
  };

  // Check if date has special events
  const getDateEvents = (day: CalendarDay) => {
    const events: string[] = [];
    
    // Check for holidays in Hijri date
    if (day.hijri.holidays && day.hijri.holidays.length > 0) {
      events.push(...day.hijri.holidays);
    }

    // Check for special days by name matching (since SpecialDay doesn't have date property)
    const specialDays = calendarState.specialDays.filter(special => {
      const specialName = language === 'ar' ? special.name.ar : special.name.en;
      return specialName && specialName.toLowerCase().includes('ramadan') ||
             specialName && specialName.toLowerCase().includes('eid') ||
             specialName && specialName.toLowerCase().includes('hajj');
    });
    
    if (specialDays.length > 0) {
      specialDays.forEach(special => {
        events.push(language === 'ar' ? special.name.ar : special.name.en);
      });
    }

    return events;
  };

  // Get month name
  const getMonthName = (monthNum: number, isHijri: boolean) => {
    if (isHijri && calendarState.islamicMonths.length > 0) {
      const month = calendarState.islamicMonths.find(m => m.number === monthNum);
      return month ? (language === 'ar' ? month.ar : month.en) : '';
    }
    return t.monthNames[monthNum - 1] || '';
  };

  // Format date for display
  const formatDate = (day: CalendarDay) => {
    const hijriDate = `${day.hijri.day} ${getMonthName(day.hijri.month.number, true)} ${day.hijri.year}`;
    const gregorianDate = `${day.gregorian.day} ${getMonthName(day.gregorian.month.number, false)} ${day.gregorian.year}`;
    
    return calendarState.isHijri ? hijriDate : gregorianDate;
  };

  // Check if date is today
  const isToday = (day: CalendarDay) => {
    const today = new Date();
    const gregorianDate = new Date(day.gregorian.date);
    return gregorianDate.toDateString() === today.toDateString();
  };

  useEffect(() => {
    loadCalendarData();
  }, [calendarState.currentMonth, calendarState.currentYear, calendarState.isHijri]);

  if (calendarState.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700 text-lg">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (calendarState.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-red-500 mb-4">
            <Calendar className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t.error}</h2>
          <p className="text-gray-600 mb-4">{calendarState.error}</p>
          <button
            onClick={loadCalendarData}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {t.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Moon className="h-8 w-8 text-emerald-600" />
                {t.title}
              </h1>
              <p className="text-gray-600 mt-1">{t.subtitle}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language Toggle */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                <Globe className="h-4 w-4" />
                {language === 'en' ? 'العربية' : 'English'}
              </button>

              {/* Calendar Type Toggle */}
              <button
                onClick={toggleCalendarType}
                className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
              >
                {calendarState.isHijri ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {calendarState.isHijri ? t.gregorianCalendar : t.hijriCalendar}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">
                      {getMonthName(calendarState.currentMonth, calendarState.isHijri)} {calendarState.currentYear}
                    </h2>
                    <p className="text-emerald-100 text-sm">
                      {calendarState.isHijri ? t.hijriCalendar : t.gregorianCalendar}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-6">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {t.weekDays.map((day, index) => (
                    <div key={index} className="text-center text-sm font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarState.calendarData.map((day, index) => {
                    const events = getDateEvents(day);
                    const todayClass = isToday(day) ? 'bg-emerald-100 border-emerald-500' : '';
                    const hasEvents = events.length > 0;

                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          relative p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md
                          ${todayClass}
                          ${hasEvents ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : 'bg-gray-50 border-gray-200'}
                          ${selectedDate?.gregorian.date === day.gregorian.date ? 'ring-2 ring-emerald-500' : ''}
                        `}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">
                            {calendarState.isHijri ? day.hijri.day : day.gregorian.day}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {calendarState.isHijri ? day.gregorian.day : day.hijri.day}
                          </div>
                        </div>
                        
                        {hasEvents && (
                          <div className="absolute top-1 right-1">
                            <Star className="h-3 w-3 text-amber-500 fill-current" />
                          </div>
                        )}
                        
                        {isToday(day) && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Islamic Info */}
            {calendarState.currentIslamicInfo && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  {t.currentIslamicYear}
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">{t.currentIslamicYear}</p>
                    <p className="text-xl font-bold text-emerald-600">
                      {calendarState.currentIslamicInfo.currentYear}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t.currentIslamicMonth}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {getMonthName(calendarState.currentIslamicInfo.currentMonth, true)}
                    </p>
                  </div>
                  {calendarState.currentIslamicInfo.nextHoliday && (
                    <div>
                      <p className="text-sm text-gray-600">{t.nextHoliday}</p>
                      <p className="text-lg font-semibold text-amber-600">
                        {language === 'ar' && calendarState.currentIslamicInfo.nextHoliday.name_ar 
                          ? calendarState.currentIslamicInfo.nextHoliday.name_ar 
                          : calendarState.currentIslamicInfo.nextHoliday.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-teal-600" />
                  Selected Date
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Gregorian</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedDate.gregorian.day} {getMonthName(selectedDate.gregorian.month.number, false)} {selectedDate.gregorian.year}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hijri</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedDate.hijri.day} {getMonthName(selectedDate.hijri.month.number, true)} {selectedDate.hijri.year}
                    </p>
                  </div>
                  
                  {getDateEvents(selectedDate).length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{t.specialDays}</p>
                      <div className="space-y-1">
                        {getDateEvents(selectedDate).map((event, index) => (
                          <div key={index} className="text-sm bg-amber-50 text-amber-800 px-2 py-1 rounded">
                            {event}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    setCalendarState(prev => ({
                      ...prev,
                      currentMonth: today.getMonth() + 1,
                      currentYear: today.getFullYear(),
                      isHijri: false
                    }));
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t.today}
                </button>
                <button
                  onClick={() => {
                    // Navigate to Ramadan month (month 9 in Islamic calendar)
                    if (calendarState.currentIslamicInfo) {
                      setCalendarState(prev => ({
                        ...prev,
                        currentMonth: 9,
                        currentYear: calendarState.currentIslamicInfo!.currentYear,
                        isHijri: true
                      }));
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t.ramadanCalendar}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IslamicCalendarPage;