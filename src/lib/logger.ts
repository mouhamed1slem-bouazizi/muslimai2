// Lightweight centralized logger with dev-only output and duplicate throttling
const isDev = process.env.NODE_ENV !== 'production';

const lastPrint = new Map<string, number>();
const THROTTLE_MS = 5000; // suppress duplicates within 5 seconds

function shouldPrint(args: any[]): boolean {
  try {
    const keyBase = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0] ?? '');
    const key = keyBase.slice(0, 200); // cap key size
    const now = Date.now();
    const last = lastPrint.get(key) || 0;
    if (now - last < THROTTLE_MS) return false;
    lastPrint.set(key, now);
    return true;
  } catch {
    return true;
  }
}

export const logger = {
  debug: (...args: any[]) => {
    if (!isDev) return;
    if (!shouldPrint(args)) return;
    console.debug('[debug]', ...args);
  },
  info: (...args: any[]) => {
    if (!isDev) return;
    if (!shouldPrint(args)) return;
    console.info('[info]', ...args);
  },
  warn: (...args: any[]) => {
    if (!isDev) return;
    if (!shouldPrint(args)) return;
    console.warn('[warn]', ...args);
  },
  error: (...args: any[]) => {
    // Downgrade to warn in dev to avoid scary red errors spam
    if (!isDev) return;
    if (!shouldPrint(args)) return;
    console.warn('[error]', ...args);
  },
};