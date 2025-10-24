// Aladhan Islamic Calendar API Service
// Comprehensive service for all Islamic calendar related APIs

import { logger } from '@/lib/logger';

export interface IslamicYearResponse {
  code: number;
  status: string;
  data: number;
}

export interface IslamicMonthResponse {
  code: number;
  status: string;
  data: number;
}

export interface IslamicMonth {
  number: number;
  en: string;
  ar: string;
}

export interface IslamicMonthsResponse {
  code: number;
  status: string;
  data: { [key: string]: IslamicMonth };
}

export interface SpecialDay {
  day: number;
  month: number;
  name: {
    en: string;
    ar: string;
  };
  type: string;
}

export interface SpecialDaysResponse {
  code: number;
  status: string;
  data: SpecialDay[];
}

export interface NextHijriHoliday {
  name: {
    en: string;
    ar: string;
  };
  date: {
    hijri: {
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
    };
    gregorian: {
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
    };
  };
}

export interface NextHijriHolidayResponse {
  code: number;
  status: string;
  data: NextHijriHoliday;
}

export interface CalendarDay {
  date: {
    readable: string;
    timestamp: string;
    hijri: {
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
    };
    gregorian: {
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
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: {
      id: number;
      name: string;
      params: {
        Fajr: number;
        Isha: number;
      };
      location: {
        latitude: number;
        longitude: number;
      };
    };
    latitudeAdjustmentMethod: string;
    midnightMode: string;
    school: string;
    offset: {
      Imsak: number;
      Fajr: number;
      Sunrise: number;
      Dhuhr: number;
      Asr: number;
      Maghrib: number;
      Sunset: number;
      Isha: number;
      Midnight: number;
    };
  };
  timings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Sunset: string;
    Maghrib: string;
    Isha: string;
    Imsak: string;
    Midnight: string;
    Firstthird: string;
    Lastthird: string;
  };
}

export interface CalendarResponse {
  code: number;
  status: string;
  data: CalendarDay[];
}

const BASE_URL = 'https://api.aladhan.com/v1';

// Get current Islamic year
export async function getCurrentIslamicYear(): Promise<number> {
  try {
    const response = await fetch(`${BASE_URL}/currentIslamicYear`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: IslamicYearResponse = await response.json();
    return data.data;
  } catch (error) {
    logger.warn('Error fetching current Islamic year:', error);
    return 1446;
  }
}

// Get current Islamic month
export async function getCurrentIslamicMonth(): Promise<number> {
  try {
    const response = await fetch(`${BASE_URL}/currentIslamicMonth`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: IslamicMonthResponse = await response.json();
    return data.data;
  } catch (error) {
    logger.warn('Error fetching current Islamic month:', error);
    return 1;
  }
}

// Get Islamic months list
export async function getIslamicMonths(): Promise<IslamicMonth[]> {
  try {
    const response = await fetch(`${BASE_URL}/islamicMonths`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: IslamicMonthsResponse = await response.json();
    // Convert object to array and sanitize entries
    return Object.values(data.data)
      .filter((m: any) => !!m && typeof m === 'object')
      .map((m: any, idx: number) => ({
        number: typeof m.number === 'number' ? m.number : idx + 1,
        en: typeof m.en === 'string' ? m.en : (typeof m.ar === 'string' ? m.ar : `Month ${typeof m.number === 'number' ? m.number : idx + 1}`),
        ar: typeof m.ar === 'string' ? m.ar : (typeof m.en === 'string' ? m.en : `الشهر ${typeof m.number === 'number' ? m.number : idx + 1}`),
      }));
  } catch (error) {
    logger.warn('Error fetching Islamic months:', error);
    return [
      { number: 1, en: 'Muharram', ar: 'محرم' },
      { number: 2, en: 'Safar', ar: 'صفر' },
      { number: 3, en: "Rabi' al-awwal", ar: 'ربيع الأول' },
      { number: 4, en: "Rabi' al-thani", ar: 'ربيع الآخر' },
      { number: 5, en: 'Jumada al-awwal', ar: 'جمادى الأولى' },
      { number: 6, en: 'Jumada al-thani', ar: 'جمادى الآخرة' },
      { number: 7, en: 'Rajab', ar: 'رجب' },
      { number: 8, en: "Sha'ban", ar: 'شعبان' },
      { number: 9, en: 'Ramadan', ar: 'رمضان' },
      { number: 10, en: 'Shawwal', ar: 'شوال' },
      { number: 11, en: 'Dhu al-Qadah', ar: 'ذو القعدة' },
      { number: 12, en: 'Dhu al-Hijjah', ar: 'ذو الحجة' },
    ];
  }
}

// Get special days
export async function getSpecialDays(): Promise<SpecialDay[]> {
  try {
    const response = await fetch(`${BASE_URL}/specialDays`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: SpecialDaysResponse = await response.json();
    return (data.data || [])
      .filter((d: any) => !!d)
      .map((d: any) => ({
        day: typeof d?.day === 'number' ? d.day : 0,
        month: typeof d?.month === 'number' ? d.month : 0,
        name: {
          en: typeof d?.name?.en === 'string' ? d.name.en : (typeof d?.name?.ar === 'string' ? d.name.ar : ''),
          ar: typeof d?.name?.ar === 'string' ? d.name.ar : (typeof d?.name?.en === 'string' ? d.name.en : ''),
        },
        type: typeof d?.type === 'string' ? d.type : '',
      }));
  } catch (error) {
    logger.warn('Error fetching special days:', error);
    return [];
  }
}

// Get next Hijri holiday
export async function getNextHijriHoliday(): Promise<NextHijriHoliday> {
  try {
    const response = await fetch(`${BASE_URL}/nextHijriHoliday`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: NextHijriHolidayResponse = await response.json();
    const holiday: any = data.data;
    if (holiday && holiday.name) {
      holiday.name = {
        en: typeof holiday.name.en === 'string' ? holiday.name.en : (typeof holiday.name.ar === 'string' ? holiday.name.ar : ''),
        ar: typeof holiday.name.ar === 'string' ? holiday.name.ar : (typeof holiday.name.en === 'string' ? holiday.name.en : ''),
      };
    }
    return holiday as NextHijriHoliday;
  } catch (error) {
    logger.warn('Error fetching next Hijri holiday:', error);
    return {
      name: { en: '', ar: '' },
      date: {
        hijri: {
          date: '',
          format: 'DD-MM-YYYY',
          day: '1',
          weekday: { en: 'Monday', ar: 'الإثنين' },
          month: { number: 1, en: 'Muharram', ar: 'محرم' },
          year: '1446',
          designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' },
          holidays: []
        },
        gregorian: {
          date: '',
          format: 'DD-MM-YYYY',
          day: '1',
          weekday: { en: 'Monday' },
          month: { number: 1, en: 'January' },
          year: '2025',
          designation: { abbreviated: 'CE', expanded: 'Common Era' }
        }
      }
    } as NextHijriHoliday;
  }
}

// Get Hijri calendar for a Gregorian month
export async function getHijriCalendarForGregorianMonth(month: number, year: number): Promise<CalendarDay[]> {
  try {
    const response = await fetch(`/api/aladhan/calendar?type=gToH&month=${month}&year=${year}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: CalendarResponse = await response.json();
    return data.data;
  } catch (error) {
    logger.warn('Error fetching Hijri calendar for Gregorian month:', error);
    return [];
  }
}

// Get Gregorian calendar for a Hijri month
export async function getGregorianCalendarForHijriMonth(month: number, year: number): Promise<CalendarDay[]> {
  try {
    const response = await fetch(`/api/aladhan/calendar?type=hToG&month=${month}&year=${year}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: CalendarResponse = await response.json();
    return data.data;
  } catch (error) {
    logger.warn('Error fetching Gregorian calendar for Hijri month:', error);
    return [];
  }
}

// Helper function to get current Islamic date info
export async function getCurrentIslamicDateInfo() {
  try {
    const [currentYear, currentMonth, months] = await Promise.all([
      getCurrentIslamicYear(),
      getCurrentIslamicMonth(),
      getIslamicMonths()
    ]);

    const currentMonthInfo = months.find(month => month.number === currentMonth);

    return {
      year: currentYear,
      month: currentMonth,
      monthName: currentMonthInfo ? {
        en: currentMonthInfo.en,
        ar: currentMonthInfo.ar
      } : null
    };
  } catch (error) {
    logger.warn('Error fetching current Islamic date info:', error);
    const months = [
      { number: 1, en: 'Muharram', ar: 'محرم' },
      { number: 2, en: 'Safar', ar: 'صفر' },
      { number: 3, en: "Rabi' al-awwal", ar: 'ربيع الأول' },
      { number: 4, en: "Rabi' al-thani", ar: 'ربيع الآخر' },
      { number: 5, en: 'Jumada al-awwal', ar: 'جمادى الأولى' },
      { number: 6, en: 'Jumada al-thani', ar: 'جمادى الآخرة' },
      { number: 7, en: 'Rajab', ar: 'رجب' },
      { number: 8, en: "Sha'ban", ar: 'شعبان' },
      { number: 9, en: 'Ramadan', ar: 'رمضان' },
      { number: 10, en: 'Shawwal', ar: 'شوال' },
      { number: 11, en: 'Dhu al-Qadah', ar: 'ذو القعدة' },
      { number: 12, en: 'Dhu al-Hijjah', ar: 'ذو الحجة' },
    ];
    return {
      year: 1446,
      month: 1,
      monthName: months[0]
    };
  }
}