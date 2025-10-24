// Date conversion utilities using Aladhan API

import { logger } from '@/lib/logger';

export interface HijriDate {
  day: string;
  month: {
    number: number;
    en: string;
    ar: string;
  };
  year: string;
  weekday: {
    en: string;
    ar: string;
  };
  designation: {
    abbreviated: string;
    expanded: string;
  };
}

export interface GregorianDate {
  day: string;
  month: {
    number: number;
    en: string;
  };
  year: string;
  weekday: {
    en: string;
  };
  designation: {
    abbreviated: string;
    expanded: string;
  };
}

export interface DateConversionResponse {
  code: number;
  status: string;
  data: {
    hijri: HijriDate;
    gregorian: GregorianDate;
  };
}

// Arabic translations for weekdays and months
const arabicWeekdays: { [key: string]: string } = {
  'Monday': 'الإثنين',
  'Tuesday': 'الثلاثاء',
  'Wednesday': 'الأربعاء',
  'Thursday': 'الخميس',
  'Friday': 'الجمعة',
  'Saturday': 'السبت',
  'Sunday': 'الأحد'
};

const arabicMonths: { [key: string]: string } = {
  'January': 'يناير',
  'February': 'فبراير',
  'March': 'مارس',
  'April': 'أبريل',
  'May': 'مايو',
  'June': 'يونيو',
  'July': 'يوليو',
  'August': 'أغسطس',
  'September': 'سبتمبر',
  'October': 'أكتوبر',
  'November': 'نوفمبر',
  'December': 'ديسمبر'
};

// Function to convert Arabic-Indic numerals to regular Arabic numerals
const convertToRegularNumerals = (text: string): string => {
  const arabicIndicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const regularNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = text;
  for (let i = 0; i < arabicIndicNumerals.length; i++) {
    result = result.replace(new RegExp(arabicIndicNumerals[i], 'g'), regularNumerals[i]);
  }
  return result;
};

/**
 * Format countdown timer numbers for Arabic display (using regular numerals)
 */
export function formatCountdownNumber(num: number, language: string): string {
  const formattedNum = String(num).padStart(2, '0');
  
  if (language === 'ar') {
    // For Arabic, ensure we use regular numerals (0-9) instead of Arabic-Indic numerals
    return convertToRegularNumerals(formattedNum);
  }
  
  return formattedNum;
}

/**
 * Format current time for display with regular numerals in Arabic
 */
export function formatCurrentTime(date: Date, language: string): string {
  let timeString = date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US');
  
  if (language === 'ar') {
    // Convert Arabic-Indic numerals to regular numerals for Arabic display
    timeString = convertToRegularNumerals(timeString);
  }
  
  return timeString;
};

/**
 * Convert Gregorian date to Hijri using Aladhan API
 * @param date - Date object or date string in DD-MM-YYYY format
 */
export const convertGregorianToHijri = async (date?: Date | string): Promise<HijriDate> => {
  try {
    let dateString: string;
    
    if (date instanceof Date) {
      // Convert Date object to DD-MM-YYYY format
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      dateString = `${day}-${month}-${year}`;
    } else if (typeof date === 'string') {
      dateString = date;
    } else {
      // Use current date
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      dateString = `${day}-${month}-${year}`;
    }

    const response = await fetch(`/api/aladhan/convert?type=gToH&date=${dateString}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: DateConversionResponse = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`API error: ${data.status}`);
    }
    
    return data.data.hijri;
  } catch (error) {
    logger.warn('Error converting Gregorian to Hijri:', error);
    return {
      day: '1',
      month: { number: 1, en: 'Muharram', ar: 'محرم' },
      year: '1446',
      weekday: { en: 'Monday', ar: 'الإثنين' },
      designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' }
    } as any;
  }
};

/**
 * Convert Hijri date to Gregorian using Aladhan API
 * @param day - Day of the month
 * @param month - Month number (1-12)
 * @param year - Hijri year
 */
export const convertHijriToGregorian = async (day: number, month: number, year: number): Promise<GregorianDate> => {
  try {
    const dateString = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    const response = await fetch(`/api/aladhan/convert?type=hToG&date=${dateString}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: DateConversionResponse = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`API error: ${data.status}`);
    }
    
    return data.data.gregorian;
  } catch (error) {
    logger.warn('Error converting Hijri to Gregorian:', error);
    return {
      day: '1',
      month: { number: 1, en: 'January' },
      year: '2025',
      weekday: { en: 'Monday' },
      designation: { abbreviated: 'CE', expanded: 'Common Era' }
    } as any;
  }
};

/**
 * Get current date in both Gregorian and Hijri formats
 */
export const getCurrentDates = async (): Promise<{
  gregorian: GregorianDate;
  hijri: HijriDate;
}> => {
  try {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateString = `${day}-${month}-${year}`;

    const response = await fetch(`/api/aladhan/convert?type=gToH&date=${dateString}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: DateConversionResponse = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`API error: ${data.status}`);
    }
    
    return {
      gregorian: data.data.gregorian,
      hijri: data.data.hijri
    };
  } catch (error) {
    logger.warn('Error getting current dates:', error);
    return { hijri: null, gregorian: null } as any;
  }
};

/**
 * Format date for display
 */
export const formatDate = (
  date: GregorianDate | HijriDate,
  language: 'en' | 'ar',
  isHijri: boolean = false
): string => {
  if (isHijri && 'month' in date && 'ar' in date.month) {
    const hijriDate = date as HijriDate;
    if (language === 'ar') {
      // Convert Arabic-Indic numerals to regular numerals for Hijri dates
      const day = convertToRegularNumerals(hijriDate.day);
      const month = convertToRegularNumerals(hijriDate.month.ar);
      const year = convertToRegularNumerals(hijriDate.year);
      return `${day} ${month} ${year} هـ`;
    } else {
      return `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH`;
    }
  } else {
    const gregorianDate = date as GregorianDate;
    if (language === 'ar') {
      // Translate Gregorian date to Arabic
      const weekdayAr = arabicWeekdays[gregorianDate.weekday.en] || gregorianDate.weekday.en;
      const monthAr = arabicMonths[gregorianDate.month.en] || gregorianDate.month.en;
      return `${weekdayAr}, ${gregorianDate.day} ${monthAr} ${gregorianDate.year}`;
    } else {
      return `${gregorianDate.weekday.en}, ${gregorianDate.month.en} ${gregorianDate.day}, ${gregorianDate.year}`;
    }
  }
};