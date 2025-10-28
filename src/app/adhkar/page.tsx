'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/Header';
import { useApp } from '../providers';
import type { AdhkarCategory, AdhkarLang } from '@/lib/adhkar-api';
import { fetchAdhkar } from '@/lib/adhkar-api';

export default function AdhkarPage() {
  const { language: appLanguage, theme } = useApp();
  const [lang, setLang] = useState<AdhkarLang>(appLanguage === 'ar' ? 'ar' : 'en');
  const [categories, setCategories] = useState<AdhkarCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentAudio, setCurrentAudio] = useState<{ src: string; title: string; itemKey?: string | number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const title = lang === 'ar' ? 'الأذكار' : 'Adhkar';
  const subtitle = lang === 'ar' ? 'مجموعة من الأذكار مع خيار تشغيل الصوت' : 'Collection of Adhkar with audio playback';

  const calmCard = theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/85 border-white/30';

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchAdhkar(lang)
      .then((data) => {
        if (!mounted) return;
        setCategories(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(String(err?.message ?? err));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [lang]);

  useEffect(() => {
    // Wire audio element events
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
    };
  }, []);

  const isRTL = lang === 'ar';
  const textDir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'text-right' : 'text-left';
  const bodyFont = isRTL ? 'font-amiri' : '';

  function playAudio(url: string, title: string, itemKey?: string | number) {
    if (!audioRef.current) return;
    if (!url) return;
    const el = audioRef.current;
    if (currentAudio?.src === url) {
      // toggle
      if (isPlaying) el.pause();
      else el.play();
      return;
    }
    setCurrentAudio({ src: url, title, itemKey });
    el.src = url;
    el.play().catch(() => {
      // autoplay might be blocked; keep state in sync
      setIsPlaying(false);
    });
  }

  function stopAudio() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setIsPlaying(false);
  }

  const headerActions = useMemo(() => (
    <div className="flex items-center justify-center gap-2 mt-4">
      <label className="text-gray-700 dark:text-gray-300">{lang === 'ar' ? 'اللغة' : 'Language'}:</label>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as AdhkarLang)}
        className="rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1"
      >
        <option value="ar">العربية</option>
        <option value="en">English</option>
      </select>
    </div>
  ), [lang]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={textDir}>
        <h1 className={`text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 ${isRTL ? 'font-amiri' : ''} text-center`}>{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">{subtitle}</p>
        {headerActions}

        <div className={`rounded-2xl shadow-2xl p-4 md:p-6 border ${calmCard} mt-6`}>
          {loading && (
            <p className="text-gray-700 dark:text-gray-300 text-center">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
          )}
          {error && (
            <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
          )}
          {!loading && !error && categories.length === 0 && (
            <p className="text-gray-700 dark:text-gray-300 text-center">{lang === 'ar' ? 'لا توجد بيانات' : 'No data available'}</p>
          )}

          {!loading && !error && categories.length > 0 && (
            <div className="space-y-6">
              {categories.map((cat, idx) => (
                <section key={cat.id ?? idx} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 bg-white/70 dark:bg-gray-800/60">
                  <div className="flex items-center justify-between">
                    <h2 className={`text-lg md:text-xl font-semibold text-emerald-700 dark:text-emerald-300 ${isRTL ? 'font-amiri' : ''}`}>{cat.title}</h2>
                    {cat.audio ? (
                      <button
                        onClick={() => playAudio(cat.audio!, `${cat.title} — ${lang === 'ar' ? 'صوت' : 'Audio'}`)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                      >
                        <span>{lang === 'ar' ? (currentAudio?.src === cat.audio && isPlaying ? 'إيقاف مؤقت' : 'تشغيل') : (currentAudio?.src === cat.audio && isPlaying ? 'Pause' : 'Play')}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M7 6v12l10-6-10-6z" />
                        </svg>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{lang === 'ar' ? 'لا يوجد صوت للقسم' : 'No section audio'}</span>
                    )}
                  </div>

                  <div className="mt-3 space-y-3">
                    {cat.content.map((c, cIdx) => {
                      const itemKey = c.id ?? `${idx}:${cIdx}`;
                      const audioUrl = c.audio || cat.audio || '';
                      const playingThis = currentAudio?.itemKey === itemKey || currentAudio?.src === audioUrl;
                      return (
                        <article key={itemKey} className={`rounded-lg p-3 border ${playingThis ? 'border-emerald-400 dark:border-emerald-500' : 'border-gray-200 dark:border-gray-700'} bg-white/60 dark:bg-gray-800/50`}>
                          <p className={`text-gray-900 dark:text-gray-100 ${textAlign} ${bodyFont}`}>{c.text}</p>
                          <div className={`mt-2 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {c.repeat ? (
                                <span>{lang === 'ar' ? `التكرار: ${c.repeat}` : `Repeat: ${c.repeat}`}</span>
                              ) : (
                                <span className="opacity-70">{lang === 'ar' ? '—' : '—'}</span>
                              )}
                              {c.source ? (
                                <span className={`${isRTL ? 'mr-3' : 'ml-3'} opacity-80`}>{lang === 'ar' ? `المصدر: ${c.source}` : `Source: ${c.source}`}</span>
                              ) : null}
                            </div>
                            {audioUrl ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => playAudio(audioUrl, `${cat.title}`, itemKey)}
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${playingThis && isPlaying ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                                >
                                  <span>{(playingThis && isPlaying) ? (lang === 'ar' ? 'إيقاف مؤقت' : 'Pause') : (lang === 'ar' ? 'تشغيل' : 'Play')}</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M7 6v12l10-6-10-6z" />
                                  </svg>
                                </button>
                                {playingThis && (
                                  <button
                                    onClick={stopAudio}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm"
                                  >
                                    {lang === 'ar' ? 'إيقاف' : 'Stop'}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">{lang === 'ar' ? 'لا يوجد صوت' : 'No audio'}</span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Hidden audio element used for playback control */}
        <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />

        {/* Mini player status */}
        {currentAudio && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full shadow-lg px-4 py-2 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <span className="text-sm">{lang === 'ar' ? 'يتم التشغيل:' : 'Now Playing:'} {currentAudio.title}</span>
            <button
              onClick={() => {
                const el = audioRef.current; if (!el) return; if (isPlaying) el.pause(); else el.play();
              }}
              className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
            >
              {isPlaying ? (lang === 'ar' ? 'إيقاف مؤقت' : 'Pause') : (lang === 'ar' ? 'تشغيل' : 'Play')}
            </button>
            <button onClick={stopAudio} className="px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm text-gray-900 dark:text-gray-200">
              {lang === 'ar' ? 'إيقاف' : 'Stop'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}