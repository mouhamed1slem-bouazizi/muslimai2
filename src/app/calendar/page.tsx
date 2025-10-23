'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Moon, 
  Sun, 
  Clock,
  MapPin,
  Search,
  Filter,
  Loader2,
  CalendarDays,
  Globe,
  Heart,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/app/providers';
import { useAuth } from '@/contexts/AuthContext';
import islamicCalendarAPI, { 
  CalendarDay, 
  HolidayInfo, 
  SpecialDay, 
  NextHolidayResponse,
  CurrentIslamicResponse 
} from '@/lib/islamic-calendar-api';
import toast from 'react-hot-toast';

export default function IslamicCalendarPage() {
  const { language, theme } = useApp();
  const { user } = useAuth();
  
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'gregorian' | 'hijri'>('gregorian');
  const [selectedDate, setSelectedDate] = useState<CalendarDay | null>(null);
  const [currentIslamicYear, setCurrentIslamicYear] = useState<string>('');
  const [currentIslamicMonth, setCurrentIslamicMonth] = useState<string>('');
  const [nextHoliday, setNextHoliday] = useState<NextHolidayResponse | null>(null);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [ramadanData, setRamadanData] = useState<any>(null);
  const [showConverter, setShowConverter] = useState(false);
  const [converterDate, setConverterDate] = useState('');
  const [convertedDate, setConvertedDate] = useState<string>('');

  // Load calendar data
  const loadCalendarData = async (date: Date) => {
    setLoading(true);
    try {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const data = await islamicCalendarAPI.getComprehensiveCalendarData(month, year, viewMode === 'hijri');
      setCalendarData(data.calendar.data);
      
      if (data.currentYear.data.year) {
        setCurrentIslamicYear(data.currentYear.data.year);
      }
      
      if (data.currentMonth.data.month) {
        setCurrentIslamicMonth(data.currentMonth.data.month.ar);
      }
      
      setNextHoliday(data.nextHoliday);
      setSpecialDays(data.specialDays.data);
      
      // Load Ramadan data
      const ramadan = await islamicCalendarAPI.getRamadanData(year);
      setRamadanData(ramadan);
      
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error(language === 'ar' ? 'فشل في تحميل بيانات التقويم' : 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  // Date conversion function
  const convertDate = async () => {
    if (!converterDate) return;
    
    try {
      const [day, month, year] = converterDate.split('/').map(Number);
      if (viewMode === 'gregorian') {
        const result = await islamicCalendarAPI.getGregorianToHijriCalendar(month, year);
        const targetDay = result.data.find(d => parseInt(d.gregorian.day) === day);
        if (targetDay) {
          setConvertedDate(islamicCalendarAPI.formatDate(targetDay.hijri, language));
        }
      } else {
        const result = await islamicCalendarAPI.getHijriToGregorianCalendar(month, year);
        const targetDay = result.data.find(d => parseInt(d.hijri.day) === day);
        if (targetDay) {
          setConvertedDate(islamicCalendarAPI.formatDate(targetDay.gregorian, language));
        }
      }
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل في تحويل التاريخ' : 'Failed to convert date');
    }
  };

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'gregorian' ? 'hijri' : 'gregorian');
  };

  // Effects
  useEffect(() => {
    loadCalendarData(currentDate);
  }, [currentDate, viewMode]);

  // Render calendar grid
  const renderCalendarGrid = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      );
    }

    const daysOfWeek = language === 'ar' 
      ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Days of week header */}
        {daysOfWeek.map((day, index) => (
          <div key={index} className={`p-2 text-center font-semibold ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarData.map((day, index) => {
          const isSpecial = islamicCalendarAPI.isSpecialDay(day);
          const isToday = new Date().toDateString() === new Date(day.gregorian.date).toDateString();
          
          return (
            <div
              key={index}
              onClick={() => setSelectedDate(day)}
              className={`
                p-2 min-h-[80px] border cursor-pointer transition-all hover:shadow-md
                ${theme === 'dark' 
                  ? 'border-gray-600 hover:bg-gray-700' 
                  : 'border-gray-200 hover:bg-gray-50'
                }
                ${isToday ? 'ring-2 ring-blue-500' : ''}
                ${isSpecial ? 'bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20' : ''}
                ${selectedDate === day ? 'ring-2 ring-purple-500' : ''}
              `}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {viewMode === 'gregorian' ? day.gregorian.day : day.hijri.day}
                  </span>
                  {isSpecial && <Star className="w-3 h-3 text-yellow-500" />}
                </div>
                
                <div className="text-xs opacity-70">
                  {viewMode === 'gregorian' 
                    ? `${day.hijri.day} ${language === 'ar' ? day.hijri.month.ar : day.hijri.month.en}`
                    : `${day.gregorian.day} ${day.gregorian.month.en}`
                  }
                </div>
                
                {isSpecial && (
                  <div className="mt-1 flex-1">
                    {day.hijri.holidays.slice(0, 2).map((holiday, idx) => (
                      <div key={idx} className="text-xs text-green-600 dark:text-green-400 truncate">
                        {holiday}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-green-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Moon className="w-8 h-8 text-blue-500 mr-3" />
            <h1 className={`text-4xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {language === 'ar' ? 'التقويم الإسلامي' : 'Islamic Calendar'}
            </h1>
            <Sun className="w-8 h-8 text-yellow-500 ml-3" />
          </div>
          
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {language === 'ar' 
              ? 'تقويم شامل يجمع بين التاريخ الهجري والميلادي مع المناسبات الإسلامية'
              : 'Comprehensive calendar combining Hijri and Gregorian dates with Islamic occasions'
            }
          </p>
        </div>

        {/* Current Islamic Date Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl shadow-lg ${
            theme === 'dark' 
              ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' 
              : 'bg-white/80 backdrop-blur-sm border border-gray-200'
          }`}>
            <div className="flex items-center mb-3">
              <CalendarDays className="w-6 h-6 text-blue-500 mr-2" />
              <h3 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'ar' ? 'السنة الهجرية الحالية' : 'Current Islamic Year'}
              </h3>
            </div>
            <p className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {currentIslamicYear} {language === 'ar' ? 'هـ' : 'AH'}
            </p>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${
            theme === 'dark' 
              ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' 
              : 'bg-white/80 backdrop-blur-sm border border-gray-200'
          }`}>
            <div className="flex items-center mb-3">
              <Moon className="w-6 h-6 text-purple-500 mr-2" />
              <h3 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'ar' ? 'الشهر الهجري الحالي' : 'Current Islamic Month'}
              </h3>
            </div>
            <p className={`text-xl font-bold ${
              theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
            }`}>
              {currentIslamicMonth}
            </p>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${
            theme === 'dark' 
              ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' 
              : 'bg-white/80 backdrop-blur-sm border border-gray-200'
          }`}>
            <div className="flex items-center mb-3">
              <Sparkles className="w-6 h-6 text-green-500 mr-2" />
              <h3 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'ar' ? 'المناسبة القادمة' : 'Next Holiday'}
              </h3>
            </div>
            {nextHoliday && (
              <p className={`text-lg font-medium ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>
                {nextHoliday.data.name}
              </p>
            )}
          </div>
        </div>

        {/* Calendar Controls */}
        <div className={`p-6 rounded-xl shadow-lg mb-8 ${
          theme === 'dark' 
            ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' 
            : 'bg-white/80 backdrop-blur-sm border border-gray-200'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <button
                onClick={() => navigateMonth('prev')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h2 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {islamicCalendarAPI.getMonthName(currentDate.getMonth() + 1, language, false)} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleViewMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {viewMode === 'gregorian' 
                  ? (language === 'ar' ? 'عرض هجري' : 'Hijri View')
                  : (language === 'ar' ? 'عرض ميلادي' : 'Gregorian View')
                }
              </button>
              
              <button
                onClick={() => setShowConverter(!showConverter)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                <Globe className="w-4 h-4 mr-2 inline" />
                {language === 'ar' ? 'محول التاريخ' : 'Date Converter'}
              </button>
            </div>
          </div>

          {/* Date Converter */}
          {showConverter && (
            <div className={`p-4 rounded-lg mb-6 ${
              theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <h3 className={`font-semibold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'ar' ? 'محول التاريخ' : 'Date Converter'}
              </h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder={`${viewMode === 'gregorian' ? 'DD/MM/YYYY' : 'DD/MM/YYYY (Hijri)'}`}
                  value={converterDate}
                  onChange={(e) => setConverterDate(e.target.value)}
                  className={`px-3 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <button
                  onClick={convertDate}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  {language === 'ar' ? 'تحويل' : 'Convert'}
                </button>
              </div>
              {convertedDate && (
                <p className={`mt-3 font-medium ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`}>
                  {language === 'ar' ? 'التاريخ المحول: ' : 'Converted Date: '}{convertedDate}
                </p>
              )}
            </div>
          )}

          {/* Calendar Grid */}
          {renderCalendarGrid()}
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className={`p-6 rounded-xl shadow-lg mb-8 ${
            theme === 'dark' 
              ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' 
              : 'bg-white/80 backdrop-blur-sm border border-gray-200'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {language === 'ar' ? 'تفاصيل التاريخ المحدد' : 'Selected Date Details'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {language === 'ar' ? 'التاريخ الميلادي' : 'Gregorian Date'}
                </h4>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {islamicCalendarAPI.formatDate(selectedDate.gregorian, language)}
                </p>
              </div>
              
              <div>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {language === 'ar' ? 'التاريخ الهجري' : 'Hijri Date'}
                </h4>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {islamicCalendarAPI.formatDate(selectedDate.hijri, language)}
                </p>
              </div>
            </div>
            
            {selectedDate.hijri.holidays.length > 0 && (
              <div className="mt-4">
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`}>
                  {language === 'ar' ? 'المناسبات الإسلامية' : 'Islamic Occasions'}
                </h4>
                <ul className="space-y-1">
                  {selectedDate.hijri.holidays.map((holiday, index) => (
                    <li key={index} className={`flex items-center ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <Star className="w-4 h-4 text-yellow-500 mr-2" />
                      {holiday}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Ramadan Information */}
        {ramadanData && (
          <div className={`p-6 rounded-xl shadow-lg mb-8 ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-purple-700' 
              : 'bg-gradient-to-r from-purple-50 to-blue-50 backdrop-blur-sm border border-purple-200'
          }`}>
            <div className="flex items-center mb-4">
              <Moon className="w-6 h-6 text-purple-500 mr-3" />
              <h3 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'ar' ? 'معلومات رمضان' : 'Ramadan Information'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {language === 'ar' ? 'السنة الهجرية لرمضان' : 'Hijri Year for Ramadan'}
                </h4>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {ramadanData.ramadanYear.data.year} {language === 'ar' ? 'هـ' : 'AH'}
                </p>
              </div>
              
              <div>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {language === 'ar' ? 'المناسبات الخاصة' : 'Special Occasions'}
                </h4>
                <div className="space-y-1">
                  {ramadanData.specialDays.slice(0, 3).map((day: SpecialDay, index: number) => (
                    <p key={index} className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {language === 'ar' ? day.name.ar : day.name.en}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Islamic Months Reference */}
        <div className={`p-6 rounded-xl shadow-lg ${
          theme === 'dark' 
            ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' 
            : 'bg-white/80 backdrop-blur-sm border border-gray-200'
        }`}>
          <h3 className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {language === 'ar' ? 'الأشهر الهجرية' : 'Islamic Months'}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <div key={month} className={`p-3 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {month}. {islamicCalendarAPI.getMonthName(month, 'en', true)}
                </div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {islamicCalendarAPI.getMonthName(month, 'ar', true)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}