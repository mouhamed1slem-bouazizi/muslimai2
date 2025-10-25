import { logger } from '@/lib/logger';

export interface QiblaDirectionResponse {
  success: boolean;
  direction?: number; // degrees clockwise from true north
  latitude?: number;
  longitude?: number;
  error?: string;
}

export interface QiblaCompassResponse {
  success: boolean;
  compass?: string; // textual compass direction (e.g., N, NNE, NE)
  direction?: number; // degrees
  error?: string;
}

const QIBLA_BASE = 'https://api.aladhan.com/v1/qibla';

export async function fetchQiblaDirection(latitude: number, longitude: number): Promise<QiblaDirectionResponse> {
  try {
    const url = `${QIBLA_BASE}/${latitude}/${longitude}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Qibla API error: ${res.status}`);
    const data = await res.json();
    const direction = Number(data?.data?.direction);
    const lat = Number(data?.data?.latitude);
    const lon = Number(data?.data?.longitude);
    if (isFinite(direction)) {
      return { success: true, direction, latitude: lat, longitude: lon };
    }
    return { success: false, error: 'Invalid qibla direction in response' };
  } catch (error) {
    logger.warn('fetchQiblaDirection error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Some deployments of Aladhan may not support the /compass endpoint.
// We attempt it and gracefully fall back to computing a textual compass label from degrees.
export async function fetchQiblaCompass(latitude: number, longitude: number): Promise<QiblaCompassResponse> {
  try {
    const url = `${QIBLA_BASE}/${latitude}/${longitude}/compass`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Qibla Compass API error: ${res.status}`);
    const data = await res.json();
    const direction = Number(data?.data?.direction);
    const compass = String(data?.data?.compass || '');
    if (isFinite(direction)) {
      return { success: true, direction, compass };
    }
    return { success: false, error: 'Invalid compass response' };
  } catch (error) {
    logger.warn('fetchQiblaCompass error (will fallback):', error);
    return { success: false, error: (error as Error).message };
  }
}

// Fallback: convert degrees to 16-wind compass point (N, NNE, NE, ...)
export function degreesToCompass(deg: number): string {
  const points = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const idx = Math.round(((deg % 360) / 22.5)) % 16;
  return points[idx];
}