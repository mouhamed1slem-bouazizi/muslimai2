import { NextRequest, NextResponse } from "next/server";

const UPSTREAMS: Record<string, string> = {
  ar: "https://www.hisnmuslim.com/api/ar/husn_ar.json",
  en: "https://www.hisnmuslim.com/api/en/husn_en.json",
};

// Simple in-memory cache with TTL to reduce upstream calls
type CacheEntry = { body: any; expiresAt: number };
const CACHE: Map<string, CacheEntry> = new Map();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  let attempt = 0;
  let lastErr: any = null;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, {
        // Allow Next.js to cache at the edge/CDN level too
        next: { revalidate: TTL_MS / 1000 },
      });
      if (!res.ok) throw new Error(`Upstream ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err;
      attempt += 1;
      if (attempt > retries) break;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
  throw lastErr ?? new Error("Upstream fetch failed");
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ lang: string }> }
) {
  const { lang: rawLang } = await ctx.params;
  const lang = rawLang?.toLowerCase();
  if (!lang || !(lang in UPSTREAMS)) {
    return NextResponse.json(
      { error: "Unsupported language. Use 'ar' or 'en'." },
      { status: 400 }
    );
  }

  const now = Date.now();
  const cacheKey = `adhkar:${lang}`;
  const entry = CACHE.get(cacheKey);
  if (entry && entry.expiresAt > now) {
    return NextResponse.json(entry.body, {
      // client-side caching hints
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  }

  try {
    const upstream = UPSTREAMS[lang];
    const res = await fetchWithRetry(upstream);
    const body = await res.json();

    CACHE.set(cacheKey, { body, expiresAt: now + TTL_MS });

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch Adhkar", details: String(err?.message ?? err) },
      { status: 502 }
    );
  }
}