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
  // Resolve input into Date and DD-MM-YYYY string
  let d: Date;
  let dateString: string;
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'string') {
    const [dd, mm, yyyy] = date.split('-').map(x => Number(x));
    d = new Date(yyyy, mm - 1, dd);
  } else {
    d = new Date();
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  dateString = `${day}-${month}-${year}`;

  // Try local ICU conversion first (Umm al-Qura preferred)
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
    const hijriWeekdayEn = enNumeric.find(p => p.type === 'weekday')?.value || d.toLocaleDateString('en', { weekday: 'long' });
    const hijriWeekdayAr = (arLong.find(p => p.type === 'weekday')?.value || d.toLocaleDateString('ar-SA', { weekday: 'long' }));
    const hijriMonthEn = (enLong.find(p => p.type === 'month')?.value || 'Muharram');
    const hijriMonthAr = (arLong.find(p => p.type === 'month')?.value || 'محرم');
    return {
      day: String(hijriDayStr),
      month: { number: hijriMonthNum, en: String(hijriMonthEn), ar: String(hijriMonthAr) },
      year: String(hijriYearStr),
      weekday: { en: String(hijriWeekdayEn), ar: String(hijriWeekdayAr) },
      designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' }
    };
  } catch {}

  // Fallback to API if ICU conversion fails
  try {
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
    logger.warn('Error converting Gregorian to Hijri (API fallback):', error);
    // Last-ditch attempt: generic Islamic calendar via ICU
    try {
      const partsNumeric = new Intl.DateTimeFormat('en-u-ca-islamic', {
        day: 'numeric', month: 'numeric', year: 'numeric', weekday: 'long'
      }).formatToParts(d);
      const partsEnLong = new Intl.DateTimeFormat('en-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
      }).formatToParts(d);
      const partsArLong = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
      }).formatToParts(d);
      const hijriDayStr = partsNumeric.find(p => p.type === 'day')?.value || '1';
      const hijriMonthNum = Number(partsNumeric.find(p => p.type === 'month')?.value || 1);
      const hijriYearStr = partsNumeric.find(p => p.type === 'year')?.value || '1446';
      const hijriWeekdayEn = partsNumeric.find(p => p.type === 'weekday')?.value || d.toLocaleDateString('en', { weekday: 'long' });
      const hijriWeekdayAr = (partsArLong.find(p => p.type === 'weekday')?.value || d.toLocaleDateString('ar-SA', { weekday: 'long' }));
      const hijriMonthEn = (partsEnLong.find(p => p.type === 'month')?.value || 'Muharram');
      const hijriMonthAr = (partsArLong.find(p => p.type === 'month')?.value || 'محرم');
      return {
        day: String(hijriDayStr),
        month: { number: hijriMonthNum, en: String(hijriMonthEn), ar: String(hijriMonthAr) },
        year: String(hijriYearStr),
        weekday: { en: String(hijriWeekdayEn), ar: String(hijriWeekdayAr) },
        designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' }
      };
    } catch (icuError) {
      logger.warn('ICU generic Islamic conversion failed:', icuError);
      return {
        day: '1',
        month: { number: 1, en: 'Muharram', ar: 'محرم' },
        year: '1446',
        weekday: { en: 'Monday', ar: 'الإثنين' },
        designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' }
      } as any;
    }
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
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();

  // Build Gregorian locally without API
  const weekdayEn = now.toLocaleDateString('en', { weekday: 'long' });
  const monthEn = now.toLocaleDateString('en', { month: 'long' });
  const gregorian: GregorianDate = {
    day: dd,
    month: { number: Number(mm), en: monthEn },
    year: String(yyyy),
    weekday: { en: weekdayEn },
    designation: { abbreviated: 'CE', expanded: 'Common Era' }
  };

  // Try Hijri locally first
  try {
    const hijri = await convertGregorianToHijri(now);
    return { gregorian, hijri };
  } catch {}

  // Fallback to API for Hijri if local fails
  try {
    const dateString = `${dd}-${mm}-${yyyy}`;
    const response = await fetch(`/api/aladhan/convert?type=gToH&date=${dateString}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: DateConversionResponse = await response.json();
    if (data.code !== 200) {
      throw new Error(`API error: ${data.status}`);
    }
    return { gregorian, hijri: data.data.hijri };
  } catch (error) {
    logger.warn('Error getting current dates (Hijri):', error);
    // Last-ditch: generic ICU, else static fallback
    try {
      const partsNumeric = new Intl.DateTimeFormat('en-u-ca-islamic', {
        day: 'numeric', month: 'numeric', year: 'numeric', weekday: 'long'
      }).formatToParts(now);
      const partsEnLong = new Intl.DateTimeFormat('en-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
      }).formatToParts(now);
      const partsArLong = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
      }).formatToParts(now);
      const hijriDayStr = partsNumeric.find(p => p.type === 'day')?.value || '1';
      const hijriMonthNum = Number(partsNumeric.find(p => p.type === 'month')?.value || 1);
      const hijriYearStr = partsNumeric.find(p => p.type === 'year')?.value || '1446';
      const hijriWeekdayEn = partsNumeric.find(p => p.type === 'weekday')?.value || weekdayEn;
      const hijriWeekdayAr = (partsArLong.find(p => p.type === 'weekday')?.value || now.toLocaleDateString('ar-SA', { weekday: 'long' }));
      const hijriMonthEn = (partsEnLong.find(p => p.type === 'month')?.value || 'Muharram');
      const hijriMonthAr = (partsArLong.find(p => p.type === 'month')?.value || 'محرم');
      return {
        gregorian,
        hijri: {
          day: String(hijriDayStr),
          month: { number: hijriMonthNum, en: String(hijriMonthEn), ar: String(hijriMonthAr) },
          year: String(hijriYearStr),
          weekday: { en: String(hijriWeekdayEn), ar: String(hijriWeekdayAr) },
          designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' }
        }
      };
    } catch {
      return {
        gregorian,
        hijri: {
          day: '1',
          month: { number: 1, en: 'Muharram', ar: 'محرم' },
          year: '1446',
          weekday: { en: 'Monday', ar: 'الإثنين' },
          designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' }
        } as any
      } as any;
    }
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