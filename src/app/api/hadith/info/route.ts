import { NextResponse } from "next/server";

const INFO_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/info.json";

async function fetchWithRetry(url: string, attempts = 3, timeoutMs = 15000): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
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

// In-memory cache for info.json (can be large)
let infoCache: { ts: number; data?: any } = { ts: 0 };
const TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export async function GET() {
  try {
    const now = Date.now();
    if (infoCache.data && now - infoCache.ts < TTL_MS) {
      const headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      } as Record<string, string>;
      return NextResponse.json(infoCache.data, { status: 200, headers });
    }
    const res = await fetchWithRetry(INFO_URL, 3);
    const data = await res.json();
    infoCache = { ts: now, data };
    const headers = {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    } as Record<string, string>;
    return NextResponse.json(data, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Proxy failure" }, { status: 502 });
  }
}