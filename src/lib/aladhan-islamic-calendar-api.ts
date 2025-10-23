// Aladhan Islamic Calendar API Service
// Comprehensive service for all Islamic calendar related APIs

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
    console.error('Error fetching current Islamic year:', error);
    throw error;
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
    console.error('Error fetching current Islamic month:', error);
    throw error;
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
    // Convert object to array
    return Object.values(data.data);
  } catch (error) {
    console.error('Error fetching Islamic months:', error);
    throw error;
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
    return data.data;
  } catch (error) {
    console.error('Error fetching special days:', error);
    throw error;
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
    return data.data;
  } catch (error) {
    console.error('Error fetching next Hijri holiday:', error);
    throw error;
  }
}

// Get Hijri calendar for a Gregorian month
export async function getHijriCalendarForGregorianMonth(month: number, year: number): Promise<CalendarDay[]> {
  try {
    const response = await fetch(`${BASE_URL}/gToHCalendar/${month}/${year}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: CalendarResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Hijri calendar for Gregorian month:', error);
    throw error;
  }
}

// Get Gregorian calendar for a Hijri month
export async function getGregorianCalendarForHijriMonth(month: number, year: number): Promise<CalendarDay[]> {
  try {
    const response = await fetch(`${BASE_URL}/hToGCalendar/${month}/${year}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: CalendarResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Gregorian calendar for Hijri month:', error);
    throw error;
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
    console.error('Error fetching current Islamic date info:', error);
    throw error;
  }
}