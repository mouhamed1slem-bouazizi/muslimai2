import { logger } from '@/lib/logger';

export interface AladhanPrayerTimes {
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
}

export interface AladhanResponse {
  code: number;
  status: string;
  data: {
    timings: AladhanPrayerTimes;
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
  };
}

export interface PrayerTimesData {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: {
    hijri: {
      date: string;
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
    };
    gregorian: {
      date: string;
      day: string;
      month: {
        number: number;
        en: string;
      };
      year: string;
      weekday: {
        en: string;
      };
    };
  };
  location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  method: {
    id: number;
    name: string;
  };
}

/**
 * Fetch prayer times from Aladhan API using city and country
 */
export const fetchPrayerTimesByCity = async (
  city: string,
  country: string,
  method: number = 8, // Default to Umm Al-Qura University, Makkah
  date?: string // Format: DD-MM-YYYY
): Promise<PrayerTimesData> => {
  try {
    const dateParam = date || new Date().toLocaleDateString('en-GB').split('/').reverse().join('-');
    const url = `https://api.aladhan.com/v1/timingsByCity/${dateParam}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: AladhanResponse = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`API error: ${data.status}`);
    }
    
    return {
      fajr: data.data.timings.Fajr,
      sunrise: data.data.timings.Sunrise,
      dhuhr: data.data.timings.Dhuhr,
      asr: data.data.timings.Asr,
      maghrib: data.data.timings.Maghrib,
      isha: data.data.timings.Isha,
      date: {
        hijri: {
          date: data.data.date.hijri.date,
          day: data.data.date.hijri.day,
          month: {
            number: data.data.date.hijri.month.number,
            en: data.data.date.hijri.month.en,
            ar: data.data.date.hijri.month.ar,
          },
          year: data.data.date.hijri.year,
          weekday: {
            en: data.data.date.hijri.weekday.en,
            ar: data.data.date.hijri.weekday.ar,
          },
        },
        gregorian: {
          date: data.data.date.gregorian.date,
          day: data.data.date.gregorian.day,
          month: {
            number: data.data.date.gregorian.month.number,
            en: data.data.date.gregorian.month.en,
          },
          year: data.data.date.gregorian.year,
          weekday: {
            en: data.data.date.gregorian.weekday.en,
          },
        },
      },
      location: {
        city,
        country,
        latitude: data.data.meta.latitude,
        longitude: data.data.meta.longitude,
      },
      method: {
        id: data.data.meta.method.id,
        name: data.data.meta.method.name,
      },
    };
  } catch (error) {
    logger.warn('Error fetching prayer times:', error);
    throw error;
  }
};

/**
 * Fetch prayer times from Aladhan API using coordinates
 */
export const fetchPrayerTimesByCoordinates = async (
  latitude: number,
  longitude: number,
  method: number = 8,
  date?: string
): Promise<PrayerTimesData> => {
  try {
    const dateParam = date || new Date().toLocaleDateString('en-GB').split('/').reverse().join('-');
    const url = `https://api.aladhan.com/v1/timings/${dateParam}?latitude=${latitude}&longitude=${longitude}&method=${method}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: AladhanResponse = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`API error: ${data.status}`);
    }
    
    return {
      fajr: data.data.timings.Fajr,
      sunrise: data.data.timings.Sunrise,
      dhuhr: data.data.timings.Dhuhr,
      asr: data.data.timings.Asr,
      maghrib: data.data.timings.Maghrib,
      isha: data.data.timings.Isha,
      date: {
        hijri: {
          date: data.data.date.hijri.date,
          day: data.data.date.hijri.day,
          month: {
            number: data.data.date.hijri.month.number,
            en: data.data.date.hijri.month.en,
            ar: data.data.date.hijri.month.ar,
          },
          year: data.data.date.hijri.year,
          weekday: {
            en: data.data.date.hijri.weekday.en,
            ar: data.data.date.hijri.weekday.ar,
          },
        },
        gregorian: {
          date: data.data.date.gregorian.date,
          day: data.data.date.gregorian.day,
          month: {
            number: data.data.date.gregorian.month.number,
            en: data.data.date.gregorian.month.en,
          },
          year: data.data.date.gregorian.year,
          weekday: {
            en: data.data.date.gregorian.weekday.en,
          },
        },
      },
      location: {
        city: 'Unknown',
        country: 'Unknown',
        latitude: data.data.meta.latitude,
        longitude: data.data.meta.longitude,
      },
      method: {
        id: data.data.meta.method.id,
        name: data.data.meta.method.name,
      },
    };
  } catch (error) {
    logger.warn('Error fetching prayer times:', error as Error);
    throw error;
  }
};

/**
 * Get current prayer based on current time and prayer times
 */
export const getCurrentPrayer = (prayerTimes: PrayerTimesData): string | null => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const prayers = [
    { name: 'fajr', time: parseTime(prayerTimes.fajr) },
    { name: 'sunrise', time: parseTime(prayerTimes.sunrise) },
    { name: 'dhuhr', time: parseTime(prayerTimes.dhuhr) },
    { name: 'asr', time: parseTime(prayerTimes.asr) },
    { name: 'maghrib', time: parseTime(prayerTimes.maghrib) },
    { name: 'isha', time: parseTime(prayerTimes.isha) },
  ];
  
  for (let i = 0; i < prayers.length - 1; i++) {
    if (currentTime >= prayers[i].time && currentTime < prayers[i + 1].time) {
      return prayers[i].name;
    }
  }
  
  // If after Isha or before Fajr
  if (currentTime >= prayers[prayers.length - 1].time || currentTime < prayers[0].time) {
    return 'isha';
  }
  
  return null;
};

/**
 * Get next prayer based on current time and prayer times
 */
export const getNextPrayer = (prayerTimes: PrayerTimesData): string | null => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const prayers = [
    { name: 'fajr', time: parseTime(prayerTimes.fajr) },
    { name: 'dhuhr', time: parseTime(prayerTimes.dhuhr) },
    { name: 'asr', time: parseTime(prayerTimes.asr) },
    { name: 'maghrib', time: parseTime(prayerTimes.maghrib) },
    { name: 'isha', time: parseTime(prayerTimes.isha) },
  ];
  
  for (const prayer of prayers) {
    if (currentTime < prayer.time) {
      return prayer.name;
    }
  }
  
  // If after all prayers, next is Fajr tomorrow
  return 'fajr';
};

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
const parseTime = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Get time remaining until next prayer
 */
export const getTimeUntilNextPrayer = (prayerTimes: PrayerTimesData): {
  prayer: string | null;
  hours: number;
  minutes: number;
  seconds: number;
} => {
  const nextPrayer = getNextPrayer(prayerTimes);
  
  if (!nextPrayer) {
    return { prayer: null, hours: 0, minutes: 0, seconds: 0 };
  }
  
  const now = new Date();
  const nextPrayerTime = parseTime(prayerTimes[nextPrayer as keyof PrayerTimesData] as string);
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  let timeDiff = nextPrayerTime - currentTime;
  
  // If next prayer is tomorrow
  if (timeDiff <= 0) {
    timeDiff += 24 * 60; // Add 24 hours in minutes
  }
  
  const hours = Math.floor(timeDiff / 60);
  const minutes = timeDiff % 60;
  const seconds = 60 - now.getSeconds();
  
  return { prayer: nextPrayer, hours, minutes, seconds };
};

/**
 * Get calculation methods available in Aladhan API
 */
export const getCalculationMethods = () => [
  { id: 1, name: 'University of Islamic Sciences, Karachi', nameAr: 'جامعة العلوم الإسلامية، كراتشي' },
  { id: 2, name: 'Islamic Society of North America', nameAr: 'الجمعية الإسلامية لأمريكا الشمالية' },
  { id: 3, name: 'Muslim World League', nameAr: 'رابطة العالم الإسلامي' },
  { id: 4, name: 'Umm Al-Qura University, Makkah', nameAr: 'جامعة أم القرى، مكة' },
  { id: 5, name: 'Egyptian General Authority of Survey', nameAr: 'الهيئة المصرية العامة للمساحة' },
  { id: 7, name: 'Institute of Geophysics, University of Tehran', nameAr: 'معهد الجيوفيزياء، جامعة طهران' },
  { id: 8, name: 'Gulf Region', nameAr: 'منطقة الخليج' },
  { id: 9, name: 'Kuwait', nameAr: 'الكويت' },
  { id: 10, name: 'Qatar', nameAr: 'قطر' },
  { id: 11, name: 'Majlis Ugama Islam Singapura, Singapore', nameAr: 'مجلس الشؤون الإسلامية، سنغافورة' },
  { id: 12, name: 'Union Organization islamic de France', nameAr: 'الاتحاد الإسلامي الفرنسي' },
  { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey', nameAr: 'رئاسة الشؤون الدينية، تركيا' },
  { id: 14, name: 'Spiritual Administration of Muslims of Russia', nameAr: 'الإدارة الروحية لمسلمي روسيا' },
  { id: 15, name: 'Moonsighting Committee Worldwide', nameAr: 'لجنة رؤية الهلال العالمية' },
  { id: 16, name: 'Dubai (unofficial)', nameAr: 'دبي (غير رسمي)' },
];