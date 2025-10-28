import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Supported language and edition slugs
const LANGS = new Set(["ar", "en"]);
const EDITIONS = new Set([
  "abudawud",
  "bukhari",
  "dehlawi",
  "ibnmajah",
  "malik",
  "muslim",
  "nasai",
  "nawawi",
  "qudsi",
  "tirmidhi",
]);

function upstreamUrl(lang: string, edition: string): string {
  const langCode = lang === "ar" ? "ara" : "eng";
  return `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${langCode}-${edition}.json`;
}

async function fetchWithRetry(url: string, attempts = 3, timeoutMs = 15000): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      // Allow upstream/CDN caching; avoid disabling cache on this proxy fetch
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) return res;
      lastErr = new Error(`Upstream error ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  throw lastErr ?? new Error("Failed to fetch upstream");
}

// Simple in-memory cache to avoid repeated heavy upstream fetches per lang/edition
const memoryCache: Map<string, { ts: number; data: any }> = new Map();
const TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export async function GET(request: NextRequest, context: { params: Promise<{ lang?: string; edition?: string }> }) {
  const params = await context.params;
  const lang = (params.lang ?? "").toLowerCase();
  const edition = (params.edition ?? "").toLowerCase();

  if (!LANGS.has(lang)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }
  if (!EDITIONS.has(edition)) {
    return NextResponse.json({ error: "Invalid edition" }, { status: 400 });
  }

  const url = upstreamUrl(lang, edition);
  try {
    const key = `${lang}:${edition}`;
    const now = Date.now();
    const cached = memoryCache.get(key);
    if (cached && now - cached.ts < TTL_MS) {
      const headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      } as Record<string, string>;
      return NextResponse.json(cached.data, { status: 200, headers });
    }

    const res = await fetchWithRetry(url, 3);
    const data = await res.json();
    memoryCache.set(key, { ts: now, data });
    // Cache for 1 day; allow stale while revalidate to reduce load
    const headers = {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    } as Record<string, string>;
    return NextResponse.json(data, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Proxy failure" }, { status: 502 });
  }
}