import { NextResponse } from 'next/server';
import { getFeaturedStory } from '@/lib/stories-service';

// Simple in-memory cache with TTL to reduce work per request
const cache = new Map<string, { timestamp: number; payload: any }>();
const TTL_MS = 60 * 60 * 1000; // 1 hour (rotation is deterministic per day)

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

export async function GET() {
  try {
    const date = new Date();
    const cacheKey = `featured:${date.toDateString()}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=1800' },
      });
    }

    const data = getFeaturedStory(date);
    setCache(cacheKey, { code: 200, status: 'OK', data });
    return NextResponse.json({ code: 200, status: 'OK', data }, {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=1800' },
    });
  } catch (e: any) {
    return NextResponse.json({ code: 500, status: 'ERROR', error: e?.message || String(e) }, { status: 500 });
  }
}