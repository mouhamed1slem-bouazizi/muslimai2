export type AdhkarLang = "ar" | "en";

export interface AdhkarContent {
  id?: number | string;
  text: string;
  repeat?: number | string | null;
  audio?: string | null;
  source?: string | null;
  description?: string | null;
}

export interface AdhkarCategory {
  id?: number | string;
  title: string;
  audio?: string | null;
  content: AdhkarContent[];
}

function normalizeText(obj: any): string {
  return (
    obj?.zekr ?? obj?.zikr ?? obj?.zkr ?? obj?.text ?? obj?.content ?? ""
  );
}

function normalizeContent(item: any): AdhkarContent {
  return {
    id: item?.id ?? item?.cid ?? undefined,
    text: normalizeText(item),
    repeat: item?.repeat ?? item?.times ?? null,
    audio: item?.audio ?? null,
    source: item?.source ?? null,
    description: item?.description ?? item?.desc ?? null,
  };
}

function normalizeCategory(cat: any): AdhkarCategory {
  const contentArr = Array.isArray(cat?.content)
    ? cat.content
    : Array.isArray(cat?.items)
    ? cat.items
    : Array.isArray(cat?.zkr)
    ? cat.zkr
    : [];

  return {
    id: cat?.id ?? cat?.cid ?? undefined,
    title: cat?.title ?? cat?.name ?? "",
    audio: cat?.audio ?? null,
    content: contentArr.map(normalizeContent).filter((c: AdhkarContent) => c.text?.trim().length > 0),
  };
}

export async function fetchAdhkar(lang: AdhkarLang): Promise<AdhkarCategory[]> {
  const res = await fetch(`/api/adhkar/${lang}`);
  if (!res.ok) throw new Error(`Failed to fetch Adhkar (${lang})`);
  const raw = await res.json();

  const rootArr = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.content)
    ? raw.content
    : [];

  return rootArr.map(normalizeCategory).filter((c: AdhkarCategory) => c.title?.trim().length > 0);
}