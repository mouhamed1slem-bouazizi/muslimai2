export type HadithLang = "ar" | "en";
export type HadithEdition =
  | "abudawud"
  | "bukhari"
  | "dehlawi"
  | "ibnmajah"
  | "malik"
  | "muslim"
  | "nasai"
  | "nawawi"
  | "qudsi"
  | "tirmidhi";

export interface HadithGrade {
  name?: string;
  grade?: string;
}

export interface HadithReference {
  book?: number;
  hadith?: number;
}

export interface HadithItem {
  hadithnumber?: number;
  arabicnumber?: string;
  text: string;
  grades?: HadithGrade[];
  reference?: HadithReference;
  // Optional section id for quick navigation
  sectionId?: string;
}

export interface HadithMetadata {
  name?: string;
  section?: Record<string, string>;
  section_detail?: Record<string, { hadithnumber_first?: number; hadithnumber_last?: number }>;
}

export interface HadithEditionResponse {
  metadata?: HadithMetadata;
  hadiths?: HadithItem[];
}

export interface HadithInfoResponse {
  // Free-form info.json, structure varies; keep loose typing
  [key: string]: any;
}

const memCache: Record<string, { ts: number; data: HadithEditionResponse }> = {};
const infoCache: { ts: number; data?: HadithInfoResponse } = { ts: 0 };
const DAY_MS = 24 * 60 * 60 * 1000;

function cacheKey(lang: HadithLang, edition: HadithEdition) {
  return `${lang}:${edition}`;
}

export async function fetchHadithEdition(lang: HadithLang, edition: HadithEdition): Promise<HadithEditionResponse> {
  const key = cacheKey(lang, edition);
  const now = Date.now();
  const cached = memCache[key];
  if (cached && now - cached.ts < DAY_MS) {
    return cached.data;
  }

  const res = await fetch(`/api/hadith/${lang}/${edition}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load hadith ${edition} (${lang})`);
  const raw: HadithEditionResponse = await res.json();

  // Normalize minimal shape
  const data: HadithEditionResponse = {
    metadata: raw.metadata ?? {},
    hadiths: (raw.hadiths ?? []).map((h) => ({
      hadithnumber: h.hadithnumber,
      arabicnumber: h.arabicnumber,
      text: h.text,
      grades: h.grades,
      reference: h.reference,
    })),
  };

  memCache[key] = { ts: now, data };
  return data;
}

export async function fetchHadithInfo(): Promise<HadithInfoResponse> {
  const now = Date.now();
  if (infoCache.data && now - infoCache.ts < DAY_MS) return infoCache.data;
  const res = await fetch(`/api/hadith/info`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load hadith info`);
  const data: HadithInfoResponse = await res.json();
  infoCache.ts = now;
  infoCache.data = data;
  return data;
}

export const EDITION_OPTIONS: { id: HadithEdition; label: string }[] = [
  { id: "bukhari", label: "Sahih al-Bukhari" },
  { id: "muslim", label: "Sahih Muslim" },
  { id: "tirmidhi", label: "Jami' at-Tirmidhi" },
  { id: "abudawud", label: "Sunan Abi Dawud" },
  { id: "nasai", label: "Sunan an-Nasa'i" },
  { id: "ibnmajah", label: "Sunan Ibn Majah" },
  { id: "malik", label: "Muwatta Malik" },
  { id: "nawawi", label: "Al-Nawawi" },
  { id: "qudsi", label: "Hadith Qudsi" },
  { id: "dehlawi", label: "Dehlawi" },
];

export function getSections(metadata?: HadithMetadata): { id: string; name: string; first?: number; last?: number }[] {
  if (!metadata?.section) return [];
  const detail = metadata.section_detail ?? {};
  return Object.keys(metadata.section).map((id) => ({
    id,
    name: metadata.section![id],
    first: detail[id]?.hadithnumber_first,
    last: detail[id]?.hadithnumber_last,
  }));
}

export function paginateHadiths(items: HadithItem[], perPage = 20) {
  const pages: HadithItem[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return pages;
}

export function filterBySection(items: HadithItem[], sectionFirst?: number, sectionLast?: number) {
  if (!sectionFirst || !sectionLast) return items;
  return items.filter((h) => {
    const n = h.hadithnumber ?? 0;
    return n >= sectionFirst && n <= sectionLast;
  });
}

export function filterByQuery(items: HadithItem[], q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return items;
  return items.filter((h) => h.text.toLowerCase().includes(query));
}