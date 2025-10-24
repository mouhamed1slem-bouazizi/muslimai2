import { NextResponse } from 'next/server';

// Simple in-memory cache with TTL
const cache = new Map<string, { timestamp: number; payload: any }>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function setCache(key: string, payload: any) {
  cache.set(key, { timestamp: Date.now(), payload });
}
function getCache(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.payload;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // 'gToH' | 'hToG'
    const date = url.searchParams.get('date'); // 'DD-MM-YYYY'

    if (!type || !['gToH', 'hToG'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use gToH or hToG.' }, { status: 400 });
    }
    if (!date || !/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date. Use DD-MM-YYYY.' }, { status: 400 });
    }

    const cacheKey = `${type}:${date}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    const externalUrl = `https://api.aladhan.com/v1/${type}/${date}`;
    const resp = await fetch(externalUrl, {
      headers: { 'Accept': 'application/json' },
    });

    // If rate-limited, bubble up gracefully for client fallback
    if (!resp.ok) {
      const status = resp.status;
      const text = await resp.text();
      return NextResponse.json({ error: `Upstream error ${status}`, details: text }, { status: 502 });
    }

    const data = await resp.json();
    setCache(cacheKey, data);
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error', details: e?.message || String(e) }, { status: 500 });
  }
}