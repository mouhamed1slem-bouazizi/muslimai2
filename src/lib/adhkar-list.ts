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

function normalizeText(obj: any): string {
  // Handle common Arabic text fields, including HisnMuslim uppercase keys
  return (
    obj?.ARABIC_TEXT ??
    obj?.arabic_text ??
    obj?.Arabic_Text ??
    obj?.zekr ??
    obj?.zikr ??
    obj?.zkr ??
    obj?.text ??
    obj?.content ??
    ""
  );
}

function normalizeItem(item: any): AdhkarContentItem {
  return {
    id: item?.ID ?? item?.id ?? item?.cid ?? undefined,
    text: normalizeText(item),
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

  return arr.map(normalizeItem).filter((x: AdhkarContentItem) => x.text?.trim().length > 0);
}