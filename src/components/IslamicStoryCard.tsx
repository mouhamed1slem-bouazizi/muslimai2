'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/app/providers';
import { logger } from '@/lib/logger';

type FeaturedPayload = {
  code: number;
  status: string;
  data: {
    story: {
      id: string;
      title_en: string;
      title_ar: string;
      content_en: string;
      content_ar: string;
      source: { citation: string; url?: string };
    };
    featuredDateISO: string;
    nextRotationTs: number;
    totalStories: number;
  };
};

type ByIdResponse = {
  code: number;
  status: string;
  data?: { story: FeaturedPayload['data']['story'] };
};

const storageSafe = (fn: () => any) => {
  try { return fn(); } catch { return null; }
};

const formatRemaining = (ms: number, lang: 'en' | 'ar') => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (lang === 'ar') {
    return `${h} ساعة ${m} دقيقة ${sec} ثانية`;
  }
  return `${h}h ${m}m ${sec}s`;
};

export default function IslamicStoryCard() {
  const { language } = useApp();
  const lang = (language === 'ar' ? 'ar' : 'en') as 'en' | 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featured, setFeatured] = useState<FeaturedPayload['data'] | null>(null);
  const [aiText, setAiText] = useState<string>('');
  const [countdown, setCountdown] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [altStory, setAltStory] = useState<FeaturedPayload['data']['story'] | null>(null);

  const currentStory = altStory || featured?.story || null;
  const title = useMemo(() => currentStory ? (lang === 'ar' ? currentStory.title_ar : currentStory.title_en) : '', [currentStory, lang]);
  const baseSummary = useMemo(() => currentStory ? (lang === 'ar' ? currentStory.content_ar : currentStory.content_en) : '', [currentStory, lang]);

  // Load featured from API with localStorage caching for offline access
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      const cacheKey = 'featured_story_cache';
      const cached = storageSafe(() => JSON.parse(localStorage.getItem(cacheKey) || 'null'));

      const now = Date.now();
      let payload: FeaturedPayload | null = null;
      if (cached && typeof cached?.data?.nextRotationTs === 'number' && now < cached.data.nextRotationTs) {
        payload = cached as FeaturedPayload;
      }
      if (!payload) {
        try {
          const res = await fetch('/api/stories/featured', { headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: FeaturedPayload = await res.json();
          payload = data;
          storageSafe(() => localStorage.setItem(cacheKey, JSON.stringify(data)));
          // Update history
          const histKey = 'story_history';
          const hist = storageSafe(() => JSON.parse(localStorage.getItem(histKey) || '[]')) || [];
          const record = {
            dateISO: data.data.featuredDateISO,
            id: data.data.story.id,
            title_en: data.data.story.title_en,
            title_ar: data.data.story.title_ar,
          };
          const exists = (Array.isArray(hist) ? hist : []).some((h: any) => h?.dateISO === record.dateISO);
          const nextHist = exists ? hist : [record, ...(Array.isArray(hist) ? hist : [])].slice(0, 30);
          storageSafe(() => localStorage.setItem(histKey, JSON.stringify(nextHist)));
        } catch (e) {
          logger.warn('Featured story fetch error:', e as Error);
          if (!cached) {
            setError(lang === 'ar' ? 'تعذّر تحميل القصة' : 'Failed to load story');
          }
          payload = cached || null;
        }
      }
      if (!mounted) return;
      if (payload?.data) setFeatured(payload.data);
      setLoading(false);
    };
    run();
    return () => { mounted = false; };
  }, [lang]);

  // Update rotation countdown every second
  useEffect(() => {
    if (!featured?.nextRotationTs) return;
    const tick = () => {
      const remainingMs = featured.nextRotationTs - Date.now();
      setCountdown(formatRemaining(remainingMs, lang));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [featured?.nextRotationTs, lang]);

  // AI text generation (language-specific, cached per story/date)
  useEffect(() => {
    const story = currentStory;
    const dateISO = featured?.featuredDateISO || 'unknown';
    if (!story || !dateISO) return;

    const key = `ai_story_${lang}_${dateISO}_${story.id}`;
    const cached = storageSafe(() => localStorage.getItem(key));
    if (cached) {
      setAiText(cached);
      return;
    }
    const prompt_en = `Using ONLY the vetted summary below, write a historically accurate, family-friendly Islamic story in 100-130 words. Do not invent details. Title: ${story.title_en}. Summary: ${story.content_en}. End with a one-line takeaway.`;
    const prompt_ar = `اكتب قصة إسلامية دقيقة تاريخيًا وبأسلوب مناسب للعائلة في ١٠٠–١٣٠ كلمة بالاعتماد حصريًا على الملخص التالي دون إضافة معلومات غير موثوقة. العنوان: ${story.title_ar}. الملخص: ${story.content_ar}. اختم بجملة خلاصة واحدة.`;
    const prompt = lang === 'ar' ? prompt_ar : prompt_en;

    // Fetch AI only for selected language
    (async () => {
      try {
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
        const res = await fetch(url, { headers: { Accept: 'text/plain' } });
        if (!res.ok) throw new Error(`AI ${res.status}`);
        const txt = await res.text();
        setAiText(txt);
        storageSafe(() => localStorage.setItem(key, txt));
      } catch (e) {
        logger.warn('AI text fetch error:', e as Error);
        // Fallback to curated summary
        setAiText(baseSummary);
        storageSafe(() => localStorage.setItem(key, baseSummary));
      }
    })();
  }, [currentStory, baseSummary, featured?.featuredDateISO, lang]);

  const handleShare = async () => {
    try {
      const text = `${title}\n\n${aiText}`;
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${title}\n\n${text}\n\n${url}`);
      alert(lang === 'ar' ? 'تم نسخ القصة للمشاركة' : 'Story copied for sharing');
    } catch (e) {
      logger.warn('Share error:', e as Error);
    }
  };

  const historyList = useMemo(() => {
    const hist = storageSafe(() => JSON.parse(localStorage.getItem('story_history') || '[]')) || [];
    return Array.isArray(hist) ? hist : [];
  }, [showHistory]);

  const loadAltStory = async (id: string) => {
    try {
      setAltStory(null);
      const res = await fetch(`/api/stories/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ByIdResponse = await res.json();
      setAltStory(data?.data?.story || null);
    } catch (e) {
      logger.warn('Load alt story error:', e as Error);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 dark:border-gray-700 mb-8">
      <div className="flex items-center justify-center mb-4">
        <span className="w-8 h-8 text-emerald-600">✨</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center font-amiri">
        {lang === 'ar' ? 'قصة إسلامية اليوم' : 'Today’s Islamic Story'}
      </h3>

      {loading ? (
        <div className="text-center py-6 text-gray-600 dark:text-gray-400">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : error ? (
        <div className="text-center py-6 text-red-600 dark:text-red-400">{error}</div>
      ) : currentStory ? (
        <div>
          <div className="text-center mb-4">
            <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 font-amiri">{title}</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
              <span className="w-4 h-4">⏰</span>
              <span>
                {lang === 'ar' ? 'التبديل بعد:' : 'Next rotation in:'} {countdown}
              </span>
            </div>
          </div>

          {/* AI / Summary Text - language-specific only */}
          <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-100 font-amiri leading-relaxed">
            {aiText}
          </div>

          {/* Attribution */}
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold">{lang === 'ar' ? 'المصدر:' : 'Source:'}</span> {currentStory.source.citation}
            {currentStory.source.url && (
              <a href={currentStory.source.url} target="_blank" rel="noreferrer" className="ml-2 underline text-emerald-600">{lang === 'ar' ? 'رابط مرجعي' : 'Reference link'}</a>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={handleShare} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
              <span className="w-4 h-4">🔗</span>
              {lang === 'ar' ? 'مشاركة' : 'Share'}
            </button>
            <button onClick={() => setShowHistory(v => !v)} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              <span className="w-4 h-4">📜</span>
              {lang === 'ar' ? 'سجل القصص' : 'Story History'}
              {showHistory ? <span className="w-4 h-4">🔼</span> : <span className="w-4 h-4">🔽</span>}
            </button>
          </div>

          {/* History Browser */}
          {showHistory && (
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              {historyList.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">{lang === 'ar' ? 'لا توجد عناصر في السجل بعد.' : 'No history yet.'}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {historyList.map((h: any, idx: number) => (
                    <button key={idx} onClick={() => loadAltStory(h.id)} className="text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">{h.dateISO}</div>
                      <div className="font-amiri text-sm font-semibold text-gray-900 dark:text-white">{lang === 'ar' ? h.title_ar : h.title_en}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-600 dark:text-gray-400">{lang === 'ar' ? 'لا توجد قصة متاحة.' : 'No story available.'}</div>
      )}
    </div>
  );
}