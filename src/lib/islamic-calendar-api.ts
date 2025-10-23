'use client';

// TypeScript interfaces for Islamic Calendar API responses
export interface HijriDate {
  date: string;
  format: string;
  day: string;
  weekday: {
    en: string;
    ar: string;
  };
  month: {
    number: number;
    en: string;
    ar: string;
  };
  year: string;
  designation: {
    abbreviated: string;
    expanded: string;
  };
  holidays: string[];
}

export interface GregorianDate {
  date: string;
  format: string;
  day: string;
  weekday: {
    en: string;
  };
  month: {
    number: number;
    en: string;
  };
  year: string;
  designation: {
    abbreviated: string;
    expanded: string;
  };
}

export interface CalendarDay {
  hijri: HijriDate;
  gregorian: GregorianDate;
}

export interface CalendarResponse {
  code: number;
  status: string;
  data: CalendarDay[];
}

export interface HolidayInfo {
  name: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
  date: {
    hijri: string;
    gregorian: string;
  };
  type: 'religious' | 'cultural' | 'special';
}

export interface NextHolidayResponse {
  code: number;
  status: string;
  data: {
    name: string;
    date: {
      hijri: HijriDate;
      gregorian: GregorianDate;
    };
  };
}

export interface CurrentIslamicResponse {
  code: number;
  status: string;
  data: {
    year?: string;
    month?: {
      number: number;
      en: string;
      ar: string;
    };
  };
}

export interface IslamicMonth {
  number: number;
  en: string;
  ar: string;
}

export interface IslamicMonthsResponse {
  code: number;
  status: string;
  data: IslamicMonth[];
}

export interface SpecialDay {
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  significance: string;
  observance: string;
}

export interface SpecialDaysResponse {
  code: number;
  status: string;
  data: SpecialDay[];
}

export interface HolidaysByYearResponse {
  code: number;
  status: string;
  data: HolidayInfo[];
}

export interface CalendarMethod {
  id: number;
  name: string;
  description: string;
}

export interface CalendarMethodsResponse {
  code: number;
  status: string;
  data: CalendarMethod[];
}

// Islamic Calendar API Service Class
class IslamicCalendarAPI {
  private readonly baseUrl = 'https://api.aladhan.com/v1';

  /**
   * Convert Gregorian month/year to Hijri calendar
   */
  async getGregorianToHijriCalendar(month: number, year: number): Promise<CalendarResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/gToHCalendar/${month}/${year}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Gregorian to Hijri calendar:', error);
      throw new Error('Failed to fetch Gregorian to Hijri calendar');
    }
  }

  /**
   * Convert Hijri month/year to Gregorian calendar
   */
  async getHijriToGregorianCalendar(month: number, year: number): Promise<CalendarResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/hToGCalendar/${month}/${year}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Hijri to Gregorian calendar:', error);
      throw new Error('Failed to fetch Hijri to Gregorian calendar');
    }
  }

  /**
   * Get the next upcoming Hijri holiday
   */
  async getNextHijriHoliday(): Promise<NextHolidayResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/nextHijriHoliday`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching next Hijri holiday:', error);
      throw new Error('Failed to fetch next Hijri holiday');
    }
  }

  /**
   * Get current Islamic year
   */
  async getCurrentIslamicYear(): Promise<CurrentIslamicResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/currentIslamicYear`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching current Islamic year:', error);
      throw new Error('Failed to fetch current Islamic year');
    }
  }

  /**
   * Get current Islamic month
   */
  async getCurrentIslamicMonth(): Promise<CurrentIslamicResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/currentIslamicMonth`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching current Islamic month:', error);
      throw new Error('Failed to fetch current Islamic month');
    }
  }

  /**
   * Get Islamic year from Gregorian year for Ramadan
   */
  async getIslamicYearFromGregorianForRamadan(year: number): Promise<CurrentIslamicResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/islamicYearFromGregorianForRamadan/${year}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Islamic year for Ramadan:', error);
      throw new Error('Failed to fetch Islamic year for Ramadan');
    }
  }

  /**
   * Get Hijri holidays for a specific day and month
   */
  async getHijriHolidays(day: number, month: number): Promise<HolidaysByYearResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/hijriHolidays/${day}/${month}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Hijri holidays:', error);
      throw new Error('Failed to fetch Hijri holidays');
    }
  }

  /**
   * Get all special Islamic days
   */
  async getSpecialDays(): Promise<SpecialDaysResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/specialDays`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching special days:', error);
      throw new Error('Failed to fetch special days');
    }
  }

  /**
   * Get all Islamic months with names in English and Arabic
   */
  async getIslamicMonths(): Promise<IslamicMonthsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/islamicMonths`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Islamic months:', error);
      throw new Error('Failed to fetch Islamic months');
    }
  }

  /**
   * Get Islamic holidays by Hijri year
   */
  async getIslamicHolidaysByHijriYear(year: number): Promise<HolidaysByYearResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/islamicHolidaysByHijriYear/${year}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Islamic holidays by year:', error);
      throw new Error('Failed to fetch Islamic holidays by year');
    }
  }

  /**
   * Get available Islamic calendar calculation methods
   */
  async getCalendarMethods(): Promise<CalendarMethodsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/islamicCalendar/methods`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching calendar methods:', error);
      throw new Error('Failed to fetch calendar methods');
    }
  }

  /**
   * Get comprehensive calendar data for a specific month/year
   */
  async getComprehensiveCalendarData(month: number, year: number, isHijri: boolean = false) {
    try {
      const [calendarData, currentYear, currentMonth, nextHoliday, specialDays, islamicMonths] = await Promise.all([
        isHijri 
          ? this.getHijriToGregorianCalendar(month, year)
          : this.getGregorianToHijriCalendar(month, year),
        this.getCurrentIslamicYear(),
        this.getCurrentIslamicMonth(),
        this.getNextHijriHoliday(),
        this.getSpecialDays(),
        this.getIslamicMonths()
      ]);

      return {
        calendar: calendarData,
        currentYear,
        currentMonth,
        nextHoliday,
        specialDays,
        islamicMonths
      };
    } catch (error) {
      console.error('Error fetching comprehensive calendar data:', error);
      throw new Error('Failed to fetch comprehensive calendar data');
    }
  }

  /**
   * Get Ramadan-specific data for a given year
   */
  async getRamadanData(gregorianYear: number) {
    try {
      const [ramadanYear, specialDays] = await Promise.all([
        this.getIslamicYearFromGregorianForRamadan(gregorianYear),
        this.getSpecialDays()
      ]);

      // Get Ramadan calendar (month 9 in Islamic calendar)
      const ramadanCalendar = await this.getHijriToGregorianCalendar(9, parseInt(ramadanYear.data.year || '1445'));

      return {
        ramadanYear,
        ramadanCalendar,
        specialDays: specialDays.data.filter(day => 
          day.name.en.toLowerCase().includes('ramadan') || 
          day.name.en.toLowerCase().includes('eid') ||
          day.name.en.toLowerCase().includes('laylat')
        )
      };
    } catch (error) {
      console.error('Error fetching Ramadan data:', error);
      throw new Error('Failed to fetch Ramadan data');
    }
  }

  /**
   * Utility function to format dates for display
   */
  formatDate(date: HijriDate | GregorianDate, language: 'en' | 'ar' = 'en'): string {
    if ('ar' in date.weekday) {
      // Hijri date
      const hijriDate = date as HijriDate;
      return language === 'ar' 
        ? `${hijriDate.weekday.ar}، ${hijriDate.day} ${hijriDate.month.ar} ${hijriDate.year} هـ`
        : `${hijriDate.weekday.en}, ${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH`;
    } else {
      // Gregorian date
      const gregDate = date as GregorianDate;
      return `${gregDate.weekday.en}, ${gregDate.day} ${gregDate.month.en} ${gregDate.year}`;
    }
  }

  /**
   * Check if a date has any holidays or special significance
   */
  isSpecialDay(day: CalendarDay): boolean {
    return day.hijri.holidays && day.hijri.holidays.length > 0;
  }

  /**
   * Get month name in specified language
   */
  getMonthName(monthNumber: number, language: 'en' | 'ar' = 'en', isHijri: boolean = true): string {
    const hijriMonths = {
      1: { en: 'Muharram', ar: 'محرم' },
      2: { en: 'Safar', ar: 'صفر' },
      3: { en: 'Rabi\' al-awwal', ar: 'ربيع الأول' },
      4: { en: 'Rabi\' al-thani', ar: 'ربيع الثاني' },
      5: { en: 'Jumada al-awwal', ar: 'جمادى الأولى' },
      6: { en: 'Jumada al-thani', ar: 'جمادى الثانية' },
      7: { en: 'Rajab', ar: 'رجب' },
      8: { en: 'Sha\'ban', ar: 'شعبان' },
      9: { en: 'Ramadan', ar: 'رمضان' },
      10: { en: 'Shawwal', ar: 'شوال' },
      11: { en: 'Dhu al-Qi\'dah', ar: 'ذو القعدة' },
      12: { en: 'Dhu al-Hijjah', ar: 'ذو الحجة' }
    };

    const gregorianMonths = {
      1: { en: 'January', ar: 'يناير' },
      2: { en: 'February', ar: 'فبراير' },
      3: { en: 'March', ar: 'مارس' },
      4: { en: 'April', ar: 'أبريل' },
      5: { en: 'May', ar: 'مايو' },
      6: { en: 'June', ar: 'يونيو' },
      7: { en: 'July', ar: 'يوليو' },
      8: { en: 'August', ar: 'أغسطس' },
      9: { en: 'September', ar: 'سبتمبر' },
      10: { en: 'October', ar: 'أكتوبر' },
      11: { en: 'November', ar: 'نوفمبر' },
      12: { en: 'December', ar: 'ديسمبر' }
    };

    const months = isHijri ? hijriMonths : gregorianMonths;
    return months[monthNumber as keyof typeof months]?.[language] || '';
  }
}

// Export singleton instance
export const islamicCalendarAPI = new IslamicCalendarAPI();
export default islamicCalendarAPI;