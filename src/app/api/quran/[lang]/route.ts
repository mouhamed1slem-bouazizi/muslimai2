'use server';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type LanguageCode = 'ar' | 'en';

const UPSTREAM: Record<LanguageCode, string> = {
  ar: 'https://api.alquran.cloud/v1/quran/quran-uthmani',
  en: 'https://api.alquran.cloud/v1/quran/en.asad',
};

async function fetchWithRetry(url: string, init: RequestInit, retries = 3, backoffMs = 500) {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        // Time out to avoid hanging connections in some hosting environments
        signal: AbortSignal.timeout(10_000),
        // Hint to Next to cache at the edge while allowing revalidation
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
    // exponential backoff with jitter
    const sleep = backoffMs * Math.pow(2, attempt) + Math.floor(Math.random() * 100);
    await new Promise(r => setTimeout(r, sleep));
  }
  throw lastErr;
}

export async function GET(req: NextRequest, ctx: { params: { lang: string } }) {
  const lang = (ctx.params.lang || '').toLowerCase() as LanguageCode;
  if (lang !== 'ar' && lang !== 'en') {
    return NextResponse.json({ code: 400, status: 'invalid_language' }, { status: 400 });
  }

  const url = UPSTREAM[lang];
  try {
    const res = await fetchWithRetry(url, { headers: { 'Accept': 'application/json' } });
    const json = await res.json();
    // Cache headers for CDN/proxy layers; SWR for 12h
    const response = NextResponse.json(json, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
    return response;
  } catch (e) {
    // Gracefully surface status without exposing upstream details
    return NextResponse.json(
      {
        code: 502,
        status: 'upstream_unreachable',
        error: 'Failed to fetch Quran data from upstream',
      },
      { status: 502 }
    );
  }
}