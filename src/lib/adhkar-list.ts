export interface AdhkarMenuItem {
  title: string;
  url: string;
}

export interface AdhkarContentItem {
  id?: number | string;
  text: string;
  repeat?: number | string | null;
  audio?: string | null;
  source?: string | null;
  description?: string | null;
}

// Language-aware text normalization
function normalizeArabicText(obj: any): string {
  const candidates = [
    obj?.ARABIC_TEXT,
    obj?.arabic_text,
    obj?.Arabic_Text,
    obj?.zekr,
    obj?.zikr,
    obj?.zkr,
    obj?.text,
    obj?.content,
  ];
  const val = candidates.find((v) => typeof v === 'string');
  return typeof val === 'string' ? val : "";
}

function normalizeEnglishText(obj: any): string {
  const candidates = [
    typeof obj?.TRANSLATED_TEXT === 'string' ? obj.TRANSLATED_TEXT : undefined,
    obj?.text,
    obj?.content,
  ];
  const val = candidates.find((v) => typeof v === 'string');
  return typeof val === 'string' ? val : "";
}

function normalizeItem(item: any, lang: 'ar' | 'en'): AdhkarContentItem {
  return {
    id: item?.ID ?? item?.id ?? item?.cid ?? undefined,
    text: lang === 'en' ? normalizeEnglishText(item) : normalizeArabicText(item),
    repeat: item?.REPEAT ?? item?.repeat ?? item?.times ?? null,
    audio: item?.AUDIO ?? item?.audio ?? null,
    source: item?.REFERENCE ?? item?.source ?? null,
    description: item?.description ?? item?.desc ?? null,
  };
}

export async function fetchArabicMenu(): Promise<AdhkarMenuItem[]> {
  const res = await fetch('/api/adhkar/ar-list');
  if (!res.ok) throw new Error('Failed to load Arabic menu list');
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.filter((x: any) => x?.title && x?.url);
}

export async function fetchArabicCategoryItems(url: string): Promise<AdhkarContentItem[]> {
  const res = await fetch(`/api/adhkar/fetch?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('Failed to load Arabic category');
  const raw = await res.json();

  // The HisnMuslim Arabic JSON often uses a single dynamic key with an array value,
  // e.g. { "أذكار الصباح والمساء": [ ... ] }. Extract that array if present.
  let arr: any[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (Array.isArray(raw?.data)) {
    arr = raw.data;
  } else if (Array.isArray(raw?.items)) {
    arr = raw.items;
  } else if (Array.isArray(raw?.content)) {
    arr = raw.content;
  } else if (raw && typeof raw === 'object') {
    const firstArray = Object.values(raw as Record<string, unknown>).find((v) => Array.isArray(v)) as any[] | undefined;
    if (Array.isArray(firstArray)) arr = firstArray;
  }

  return arr
    .map((item) => normalizeItem(item, 'ar'))
    .filter((x: AdhkarContentItem) => typeof x.text === 'string' && x.text.trim().length > 0);
}

export async function fetchEnglishMenu(): Promise<AdhkarMenuItem[]> {
  const res = await fetch('/api/adhkar/en-list');
  if (!res.ok) throw new Error('Failed to load English menu list');
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.filter((x: any) => x?.title && x?.url);
}

export async function fetchEnglishCategoryItems(url: string): Promise<AdhkarContentItem[]> {
  const res = await fetch(`/api/adhkar/fetch?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('Failed to load English category');
  const raw = await res.json();

  // English JSON is similar structure; also may use dynamic root keys
  let arr: any[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (Array.isArray(raw?.data)) {
    arr = raw.data;
  } else if (Array.isArray(raw?.items)) {
    arr = raw.items;
  } else if (Array.isArray(raw?.content)) {
    arr = raw.content;
  } else if (raw && typeof raw === 'object') {
    const firstArray = Object.values(raw as Record<string, unknown>).find((v) => Array.isArray(v)) as any[] | undefined;
    if (Array.isArray(firstArray)) arr = firstArray;
  }

  return arr
    .map((item) => normalizeItem(item, 'en'))
    .filter((x: AdhkarContentItem) => typeof x.text === 'string' && x.text.trim().length > 0);
}