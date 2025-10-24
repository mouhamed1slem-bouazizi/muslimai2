import { NextResponse } from 'next/server';

// Simple in-memory cache with TTL
const cache = new Map<string, { timestamp: number; payload: any }>();
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours for calendar

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
    const monthStr = url.searchParams.get('month');
    const yearStr = url.searchParams.get('year');

    if (!type || !['gToH', 'hToG'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use gToH or hToG.' }, { status: 400 });
    }
    const month = Number(monthStr);
    const year = Number(yearStr);
    if (!month || month < 1 || month > 12 || !year || year < 1) {
      return NextResponse.json({ error: 'Invalid month/year.' }, { status: 400 });
    }

    const cacheKey = `${type}:calendar:${month}-${year}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    const endpoint = type === 'gToH' ? 'gToHCalendar' : 'hToGCalendar';
    const externalUrl = `https://api.aladhan.com/v1/${endpoint}/${month}/${year}`;
    const resp = await fetch(externalUrl, { headers: { 'Accept': 'application/json' } });

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