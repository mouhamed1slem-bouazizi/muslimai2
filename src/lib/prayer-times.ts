import { 
  Coordinates, 
  CalculationMethod, 
  PrayerTimes, 
  Prayer,
  Madhab,
  HighLatitudeRule
} from 'adhan';

export interface PrayerTimesData {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  qiyam?: Date;
}

export interface PrayerTimesOptions {
  calculationMethod?: any;
  madhab?: any;
  highLatitudeRule?: any;
  adjustments?: {
    fajr?: number;
    sunrise?: number;
    dhuhr?: number;
    asr?: number;
    maghrib?: number;
    isha?: number;
  };
}

/**
 * Calculate prayer times for given coordinates and date
 */
export const calculatePrayerTimes = (
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  options: PrayerTimesOptions = {}
): PrayerTimesData => {
  const coordinates = new Coordinates(latitude, longitude);
  
  // Default calculation method (can be customized based on user location/preference)
  const calculationMethod = options.calculationMethod || CalculationMethod.MuslimWorldLeague();
  
  // Create calculation parameters
  const params = calculationMethod;
  
  // Set madhab (Hanafi or Shafi - affects Asr calculation)
  if (options.madhab) {
    params.madhab = options.madhab;
  }
  
  // Set high latitude rule for polar regions
  if (options.highLatitudeRule) {
    params.highLatitudeRule = options.highLatitudeRule;
  }
  
  // Apply manual adjustments if provided
  if (options.adjustments) {
    if (options.adjustments.fajr) params.adjustments.fajr = options.adjustments.fajr;
    if (options.adjustments.sunrise) params.adjustments.sunrise = options.adjustments.sunrise;
    if (options.adjustments.dhuhr) params.adjustments.dhuhr = options.adjustments.dhuhr;
    if (options.adjustments.asr) params.adjustments.asr = options.adjustments.asr;
    if (options.adjustments.maghrib) params.adjustments.maghrib = options.adjustments.maghrib;
    if (options.adjustments.isha) params.adjustments.isha = options.adjustments.isha;
  }
  
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  
  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
  };
};

/**
 * Get current prayer based on current time
 */
export const getCurrentPrayer = (prayerTimes: PrayerTimesData, currentTime: Date = new Date()): any | null => {
  const coordinates = new Coordinates(0, 0); // Dummy coordinates for Prayer enum
  const params = CalculationMethod.MuslimWorldLeague();
  const prayers = new PrayerTimes(coordinates, currentTime, params);
  
  return prayers.currentPrayer(currentTime);
};

/**
 * Get next prayer based on current time
 */
export const getNextPrayer = (prayerTimes: PrayerTimesData, currentTime: Date = new Date()): any | null => {
  const coordinates = new Coordinates(0, 0); // Dummy coordinates for Prayer enum
  const params = CalculationMethod.MuslimWorldLeague();
  const prayers = new PrayerTimes(coordinates, currentTime, params);
  
  return prayers.nextPrayer(currentTime);
};

/**
 * Get time remaining until next prayer
 */
export const getTimeUntilNextPrayer = (prayerTimes: PrayerTimesData, currentTime: Date = new Date()): {
  prayer: any | null;
  timeRemaining: number; // in milliseconds
  hours: number;
  minutes: number;
  seconds: number;
} => {
  const nextPrayer = getNextPrayer(prayerTimes, currentTime);
  
  if (!nextPrayer) {
    return {
      prayer: null,
      timeRemaining: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }
  
  let nextPrayerTime: Date;
  
  switch (nextPrayer) {
    case Prayer.Fajr:
      nextPrayerTime = prayerTimes.fajr;
      break;
    case Prayer.Dhuhr:
      nextPrayerTime = prayerTimes.dhuhr;
      break;
    case Prayer.Asr:
      nextPrayerTime = prayerTimes.asr;
      break;
    case Prayer.Maghrib:
      nextPrayerTime = prayerTimes.maghrib;
      break;
    case Prayer.Isha:
      nextPrayerTime = prayerTimes.isha;
      break;
    default:
      nextPrayerTime = prayerTimes.fajr;
  }
  
  // If next prayer is tomorrow, calculate for next day
  if (nextPrayerTime < currentTime) {
    const tomorrow = new Date(currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Recalculate for tomorrow - this is a simplified approach
    nextPrayerTime = new Date(nextPrayerTime.getTime() + 24 * 60 * 60 * 1000);
  }
  
  const timeRemaining = nextPrayerTime.getTime() - currentTime.getTime();
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  return {
    prayer: nextPrayer,
    timeRemaining,
    hours,
    minutes,
    seconds,
  };
};

/**
 * Format prayer time for display
 */
export const formatPrayerTime = (time: Date, format24Hour: boolean = false): string => {
  if (format24Hour) {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  
  return time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get prayer name in Arabic and English
 */
export const getPrayerName = (prayer: any, language: 'en' | 'ar' = 'en'): string => {
  const names: any = {
    [Prayer.Fajr]: { en: 'Fajr', ar: 'الفجر' },
    [Prayer.Dhuhr]: { en: 'Dhuhr', ar: 'الظهر' },
    [Prayer.Asr]: { en: 'Asr', ar: 'العصر' },
    [Prayer.Maghrib]: { en: 'Maghrib', ar: 'المغرب' },
    [Prayer.Isha]: { en: 'Isha', ar: 'العشاء' },
  };
  
  return names[prayer]?.[language] || 'Unknown';
};

/**
 * Get calculation method name
 */
export const getCalculationMethodName = (method: any, language: 'en' | 'ar' = 'en'): string => {
  const methods: any = {
    'MuslimWorldLeague': {
      en: 'Muslim World League',
      ar: 'رابطة العالم الإسلامي'
    },
    'Egyptian': {
      en: 'Egyptian General Authority',
      ar: 'الهيئة المصرية العامة للمساحة'
    },
    'Karachi': {
      en: 'University of Islamic Sciences, Karachi',
      ar: 'جامعة العلوم الإسلامية، كراتشي'
    },
    'UmmAlQura': {
      en: 'Umm Al-Qura University, Makkah',
      ar: 'جامعة أم القرى، مكة'
    },
    'Dubai': {
      en: 'Dubai',
      ar: 'دبي'
    },
    'MoonsightingCommittee': {
      en: 'Moonsighting Committee Worldwide',
      ar: 'لجنة رؤية الهلال العالمية'
    },
    'NorthAmerica': {
      en: 'Islamic Society of North America',
      ar: 'الجمعية الإسلامية لأمريكا الشمالية'
    },
    'Kuwait': {
      en: 'Kuwait',
      ar: 'الكويت'
    },
    'Qatar': {
      en: 'Qatar',
      ar: 'قطر'
    },
    'Singapore': {
      en: 'Singapore',
      ar: 'سنغافورة'
    },
  };
  
  return methods[method]?.[language] || 'Unknown Method';
};

/**
 * Get recommended calculation method based on country
 */
export const getRecommendedCalculationMethod = (country: string): any => {
  const countryMethods: { [key: string]: any } = {
    // Middle East
    'Saudi Arabia': 'UmmAlQura',
    'UAE': 'Dubai',
    'Kuwait': 'Kuwait',
    'Qatar': 'Qatar',
    'Egypt': 'Egyptian',
    
    // South Asia
    'Pakistan': 'Karachi',
    'India': 'Karachi',
    'Bangladesh': 'Karachi',
    
    // North America
    'United States': 'NorthAmerica',
    'Canada': 'NorthAmerica',
    
    // Southeast Asia
    'Singapore': 'Singapore',
    'Malaysia': 'Singapore',
    'Indonesia': 'Singapore',
    
    // Default for other countries
  };
  
  return countryMethods[country] || 'MuslimWorldLeague';
};