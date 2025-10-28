import { logger } from '@/lib/logger';

export type Ayah = {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | { recommended: boolean; obligatory: boolean } | number;
};

export type Surah = {
  number: number;
  name: string; // Arabic name
  englishName: string;
  englishNameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  ayahs: Ayah[];
};

export type QuranData = {
  surahs: Surah[];
};

export type QuranResponse = {
  code: number;
  status: string;
  data: QuranData;
};

export type LanguageCode = 'ar' | 'en';

const ENDPOINTS: Record<LanguageCode, string> = {
  ar: 'https://api.alquran.cloud/v1/quran/quran-uthmani',
  en: 'https://api.alquran.cloud/v1/quran/en.asad',
};

type PageIndexEntry = {
  page: number;
  entries: Array<{
    surahNumber: number;
    surahNameAr: string;
    surahNameEn: string;
    ayah: Ayah;
  }>;
};

export type QuranIndexes = {
  pagesMap: Map<number, PageIndexEntry>;
  surahFirstPage: Map<number, number>;
  juzFirstPage: Map<number, number>;
  manzilFirstPage: Map<number, number>;
  rukuFirstPage: Map<number, number>;
  hizbQuarterFirstPage: Map<number, number>;
  sajdaPages: Set<number>;
};

const memoryCache: {
  data: Partial<Record<LanguageCode, QuranData>>;
  indexes: Partial<Record<LanguageCode, QuranIndexes>>;
} = { data: {}, indexes: {} };

const LS_KEY_DATA = (lang: LanguageCode) => `quran_data_${lang}_v1`;
const LS_KEY_TIME = (lang: LanguageCode) => `quran_data_${lang}_ts`;
const CACHE_TTL_MS = 24 * 3600 * 1000; // 24h

export async function fetchQuran(lang: LanguageCode): Promise<QuranData> {
  // Memory cache
  if (memoryCache.data && memoryCache.data[lang]) {
    return memoryCache.data[lang] as QuranData;
  }

  // LocalStorage cache
  try {
    const ts = typeof window !== 'undefined' ? Number(localStorage.getItem(LS_KEY_TIME(lang)) || '0') : 0;
    if (ts && Date.now() - ts < CACHE_TTL_MS) {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY_DATA(lang)) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as QuranData;
        memoryCache.data![lang] = parsed;
        return parsed;
      }
    }
  } catch {}

  // Network fetch
  const url = ENDPOINTS[lang];
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Failed to fetch Quran (${lang}): ${res.status}`);
  const json = (await res.json()) as QuranResponse;
  if (json.code !== 200 || !json.data) throw new Error(`Invalid Quran response (${lang})`);
  const data = json.data;

  // Store in caches
  memoryCache.data![lang] = data;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY_DATA(lang), JSON.stringify(data));
      localStorage.setItem(LS_KEY_TIME(lang), String(Date.now()));
    }
  } catch {}

  return data;
}

export function buildIndexes(data: QuranData): QuranIndexes {
  const pagesMap = new Map<number, PageIndexEntry>();
  const surahFirstPage = new Map<number, number>();
  const juzFirstPage = new Map<number, number>();
  const manzilFirstPage = new Map<number, number>();
  const rukuFirstPage = new Map<number, number>();
  const hizbQuarterFirstPage = new Map<number, number>();
  const sajdaPages = new Set<number>();

  for (const surah of data.surahs) {
    let minPageForSurah = Infinity;
    for (const ayah of surah.ayahs) {
      const page = ayah.page;
      minPageForSurah = Math.min(minPageForSurah, page);

      const entry = pagesMap.get(page) || {
        page,
        entries: [],
      };
      entry.entries.push({
        surahNumber: surah.number,
        surahNameAr: surah.name,
        surahNameEn: surah.englishName,
        ayah,
      });
      pagesMap.set(page, entry);

      // first pages for filters
      if (!juzFirstPage.has(ayah.juz)) juzFirstPage.set(ayah.juz, page);
      if (!manzilFirstPage.has(ayah.manzil)) manzilFirstPage.set(ayah.manzil, page);
      if (!rukuFirstPage.has(ayah.ruku)) rukuFirstPage.set(ayah.ruku, page);
      if (!hizbQuarterFirstPage.has(ayah.hizbQuarter)) hizbQuarterFirstPage.set(ayah.hizbQuarter, page);

      // sajda indicator
      if (ayah.sajda) sajdaPages.add(page);
    }
    if (minPageForSurah !== Infinity && !surahFirstPage.has(surah.number)) {
      surahFirstPage.set(surah.number, minPageForSurah);
    }
  }

  return { pagesMap, surahFirstPage, juzFirstPage, manzilFirstPage, rukuFirstPage, hizbQuarterFirstPage, sajdaPages };
}

export async function getQuranIndexes(lang: LanguageCode): Promise<QuranIndexes> {
  if (memoryCache.indexes && memoryCache.indexes[lang]) {
    return memoryCache.indexes[lang] as QuranIndexes;
  }
  const data = await fetchQuran(lang);
  const indexes = buildIndexes(data);
  memoryCache.indexes![lang] = indexes;
  return indexes;
}

export function getPageContent(indexes: QuranIndexes, page: number) {
  return indexes.pagesMap.get(page) || { page, entries: [] };
}

export function getSurahsSummary(data: QuranData) {
  return data.surahs.map(s => ({
    number: s.number,
    nameAr: s.name,
    nameEn: s.englishName,
    translation: s.englishNameTranslation,
  }));
}

export async function getMetadata(lang: LanguageCode) {
  try {
    const data = await fetchQuran(lang);
    const surahs = getSurahsSummary(data);
    return {
      surahs,
      totalPages: 604,
      totalJuz: 30,
      totalManzil: 7,
    };
  } catch (e) {
    logger.warn('Quran metadata error:', e as Error);
    return { surahs: [], totalPages: 604, totalJuz: 30, totalManzil: 7 };
  }
}