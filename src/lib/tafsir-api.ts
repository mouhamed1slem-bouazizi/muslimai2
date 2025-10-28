export type LanguageCode = 'ar' | 'en';

export type TafsirVerse = {
  ayah: number;
  text: string;
  footnotes?: string;
};

export type TafsirResponse = any;

function normalizeTafsir(json: TafsirResponse): TafsirVerse[] {
  const arr = Array.isArray(json?.result) ? json.result : Array.isArray(json) ? json : [];
  return arr.map((item: any) => {
    const ayahRaw = item?.aya ?? item?.ayah ?? item?.verse ?? item?.id ?? 0;
    const textRaw = item?.text ?? item?.translation ?? '';
    const foot = item?.footnotes ?? item?.footnote ?? undefined;
    return {
      ayah: Number(ayahRaw) || 0,
      text: String(textRaw),
      footnotes: foot ? String(foot) : undefined,
    };
  });
}

export async function fetchTafsir(lang: LanguageCode, sura: number): Promise<TafsirVerse[]> {
  const url = `/api/tafsir/${lang}/${sura}`;
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Failed to fetch Tafsir (${lang}, sura ${sura})`);
  const json = await res.json();
  return normalizeTafsir(json);
}