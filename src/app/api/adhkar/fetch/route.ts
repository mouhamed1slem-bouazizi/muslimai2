import { NextRequest, NextResponse } from "next/server";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
type CacheEntry = { body: any; expiresAt: number };
const CACHE: Map<string, CacheEntry> = new Map();

function isAllowedUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();
    const allowedHost = host === "hisnmuslim.com" || host === "www.hisnmuslim.com";
    const allowedPath = u.pathname.startsWith("/api/ar/");
    return allowedHost && allowedPath;
  } catch {
    return false;
  }
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  let attempt = 0;
  let lastErr: any = null;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, { next: { revalidate: TTL_MS / 1000 } });
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

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam || !isAllowedUrl(urlParam)) {
    return NextResponse.json(
      { error: "Invalid or unsupported URL. Use hisnmuslim.com/api/ar/*.json" },
      { status: 400 }
    );
  }

  const cacheKey = `adhkar:fetch:${urlParam}`;
  const now = Date.now();
  const entry = CACHE.get(cacheKey);
  if (entry && entry.expiresAt > now) {
    return NextResponse.json(entry.body, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  }

  try {
    const res = await fetchWithRetry(urlParam);
    const body = await res.json();
    CACHE.set(cacheKey, { body, expiresAt: now + TTL_MS });
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch category", details: String(err?.message ?? err) },
      { status: 502 }
    );
  }
}