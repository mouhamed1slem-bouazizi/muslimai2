'use strict';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type LanguageCode = 'ar' | 'en';

const UPSTREAM: Record<LanguageCode, (sura: number) => string> = {
  ar: (sura) => `https://quranenc.com/api/v1/translation/sura/arabic_moyassar/${sura}`,
  en: (sura) => `https://quranenc.com/api/v1/translation/sura/english_saheeh/${sura}`,
};

async function fetchWithRetry(url: string, init: RequestInit, retries = 3, backoffMs = 500) {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(10_000),
        next: { revalidate: 24 * 60 * 60 },
      });
      if (!res.ok) {
        lastErr = new Error(`Upstream responded ${res.status}`);
      } else {
        return res;
      }
    } catch (e) {
      lastErr = e;
    }
    const sleep = backoffMs * Math.pow(2, attempt) + Math.floor(Math.random() * 100);
    await new Promise(r => setTimeout(r, sleep));
  }
  throw lastErr;
}

export async function GET(req: NextRequest, context: { params: Promise<{ lang: string; sura: string }> }) {
  const { lang, sura } = await context.params;
  const normalizedLang = (lang || '').toLowerCase() as LanguageCode;
  if (normalizedLang !== 'ar' && normalizedLang !== 'en') {
    return NextResponse.json({ code: 400, status: 'invalid_language' }, { status: 400 });
  }

  const suraNum = Number(sura);
  if (!Number.isFinite(suraNum) || suraNum < 1 || suraNum > 114) {
    return NextResponse.json({ code: 400, status: 'invalid_sura' }, { status: 400 });
  }

  const url = UPSTREAM[normalizedLang](suraNum);
  try {
    const res = await fetchWithRetry(url, { headers: { 'Accept': 'application/json' } });
    const json = await res.json();
    const response = NextResponse.json(json, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
    return response;
  } catch (e) {
    return NextResponse.json(
      { code: 502, status: 'upstream_unreachable', error: 'Failed to fetch Tafsir data from upstream' },
      { status: 502 }
    );
  }
}