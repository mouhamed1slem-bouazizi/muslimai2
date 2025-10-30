'use client';

import React, { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import { useApp } from '../providers';
import type { AdhkarCategory, AdhkarLang } from '@/lib/adhkar-api';
import { fetchAdhkar } from '@/lib/adhkar-api';
import type { AdhkarMenuItem as ArabicMenuItem, AdhkarContentItem as ArabicContentItem } from '@/lib/adhkar-list';
import { fetchArabicMenu, fetchArabicCategoryItems, fetchEnglishMenu, fetchEnglishCategoryItems } from '@/lib/adhkar-list';

// Ensure this page renders client-first to avoid hydration mismatches
export const dynamic = 'force-dynamic';

export default function AdhkarPage() {
  const { language: appLanguage, theme } = useApp();
  const lang: AdhkarLang = appLanguage === 'ar' ? 'ar' : 'en';
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<AdhkarCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Arabic-only menu driven state
  const [arMenu, setArMenu] = useState<ArabicMenuItem[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<ArabicMenuItem | null>(null);
  const [arItems, setArItems] = useState<ArabicContentItem[]>([]);
  const [arLoading, setArLoading] = useState<boolean>(false);
  // English menu driven state
  const [enMenu, setEnMenu] = useState<ArabicMenuItem[]>([]);
  const [selectedEnMenu, setSelectedEnMenu] = useState<ArabicMenuItem | null>(null);
  const [enItems, setEnItems] = useState<ArabicContentItem[]>([]);
  const [enLoading, setEnLoading] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentAudio, setCurrentAudio] = useState<{ src: string; title: string; itemKey?: string | number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const title = lang === 'ar' ? 'الأذكار' : 'Adhkar';
  const subtitle = lang === 'ar' ? 'مجموعة من الأذكار مع خيار تشغيل الصوت' : 'Collection of Adhkar with audio playback';

  const calmCard = theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/85 border-white/30';

  // Load content based on language: Arabic uses menu-driven categories; English loads combined adhkar
  useEffect(() => {
    let isActive = true;
    setError(null);
    if (lang === 'ar') {
      // Arabic flow
      setArLoading(true);
      setArItems([]);
      setArMenu([]);
      setSelectedMenu(null);
      fetchArabicMenu()
        .then((menu) => {
          if (!isActive) return [] as ArabicContentItem[];
          setArMenu(menu);
          const first = menu[0] ?? null;
          setSelectedMenu(first ?? null);
          if (first) {
            return fetchArabicCategoryItems(first.url);
          }
          return [] as ArabicContentItem[];
        })
        .then((items) => {
          if (!isActive) return;
          setArItems(items);
        })
        .catch((err) => {
          if (!isActive) return;
          setError(String(err?.message ?? err));
        })
        .finally(() => {
          if (!isActive) return;
          setArLoading(false);
        });
      setLoading(false);
    } else {
      // English flow (menu-driven, mirroring Arabic template)
      setEnLoading(true);
      setEnItems([]);
      setEnMenu([]);
      setSelectedEnMenu(null);
      fetchEnglishMenu()
        .then((menu) => {
          if (!isActive) return [] as ArabicContentItem[];
          setEnMenu(menu);
          const first = menu[0] ?? null;
          setSelectedEnMenu(first ?? null);
          if (first) {
            return fetchEnglishCategoryItems(first.url);
          }
          return [] as ArabicContentItem[];
        })
        .then((items) => {
          if (!isActive) return;
          setEnItems(items);
        })
        .catch((err) => {
          if (!isActive) return;
          setError(String(err?.message ?? err));
        })
        .finally(() => {
          if (!isActive) return;
          setEnLoading(false);
        });
      setLoading(false);
    }
    return () => { isActive = false; };
  }, [lang]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // When Arabic selected menu changes, load category items
  useEffect(() => {
    let mounted = true;
    if (lang !== 'ar') return () => { mounted = false; };
    if (!selectedMenu?.url) return () => { mounted = false; };
    setArLoading(true);
    setError(null);
    fetchArabicCategoryItems(selectedMenu.url)
      .then((items) => { if (!mounted) return; setArItems(items); })
      .catch((err) => { if (!mounted) return; setError(String(err?.message ?? err)); })
      .finally(() => { if (!mounted) return; setArLoading(false); });
    return () => { mounted = false; };
  }, [lang, selectedMenu?.url]);

  // When English selected menu changes, load category items
  useEffect(() => {
    let mounted = true;
    if (lang !== 'en') return () => { mounted = false; };
    if (!selectedEnMenu?.url) return () => { mounted = false; };
    setEnLoading(true);
    setError(null);
    fetchEnglishCategoryItems(selectedEnMenu.url)
      .then((items) => { if (!mounted) return; setEnItems(items); })
      .catch((err) => { if (!mounted) return; setError(String(err?.message ?? err)); })
      .finally(() => { if (!mounted) return; setEnLoading(false); });
    return () => { mounted = false; };
  }, [lang, selectedEnMenu?.url]);

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

  // No manual language toggle; respects app language only

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" suppressHydrationWarning>
          <div className={`rounded-2xl shadow-2xl p-4 md:p-6 border ${calmCard} mt-6`}>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={textDir} suppressHydrationWarning>
        <h1 className={`text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 ${isRTL ? 'font-amiri' : ''} text-center`}>{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">{subtitle}</p>
        {/* Language is controlled by app settings; no manual toggle */}

        <div className={`rounded-2xl shadow-2xl p-4 md:p-6 border ${calmCard} mt-6`}>
          {error && (
            <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
          )}

          {lang === 'ar' ? (
            <div className="grid grid-cols-12 gap-4" dir={textDir}>
              <aside className="col-span-12 md:col-span-4 lg:col-span-3">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 p-3">
                  <h2 className={`text-base font-semibold text-emerald-700 dark:text-emerald-300 mb-2 ${isRTL ? 'font-amiri' : ''}`}>{lang === 'ar' ? 'القائمة' : 'Menu'}</h2>
                  {arLoading && arMenu.length === 0 ? (
                    <p className="text-gray-700 dark:text-gray-300">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                  ) : (
                    <ul className={`space-y-2 ${isRTL ? 'font-amiri' : ''}`}>
                      {arMenu.map((m) => (
                        <li key={m.url}>
                          <button
                            onClick={() => setSelectedMenu(m)}
                            className={`w-full text-sm px-3 py-2 rounded-md border ${selectedMenu?.url === m.url ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/50'} text-gray-900 dark:text-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {m.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </aside>

              <section className="col-span-12 md:col-span-8 lg:col-span-9">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 p-3">
                  <h3 className={`text-lg md:text-xl font-semibold text-emerald-700 dark:text-emerald-300 mb-2 ${isRTL ? 'font-amiri' : ''}`}>{selectedMenu?.title ?? (lang === 'ar' ? 'اختر من القائمة' : 'Select from menu')}</h3>
                  {arLoading && (
                    <p className="text-gray-700 dark:text-gray-300">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                  )}
                  {!arLoading && arItems.length === 0 && (
                    <p className="text-gray-700 dark:text-gray-300">{lang === 'ar' ? 'لا توجد عناصر' : 'No items'}</p>
                  )}
                  {!arLoading && arItems.length > 0 && (
                    <div className="space-y-3">
                      {arItems.map((c, idx) => {
                        const itemKey = c.id ?? `${selectedMenu?.url}:${idx}`;
                        const audioUrl = c.audio || '';
                        const playingThis = currentAudio?.itemKey === itemKey || (audioUrl && currentAudio?.src === audioUrl);
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
                                    onClick={() => playAudio(audioUrl, `${selectedMenu?.title ?? ''}`, itemKey)}
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
                  )}
                </div>
              </section>
            </div>
          ) : (
            // English menu-driven view (matching Arabic template)
            <div className="grid grid-cols-12 gap-4" dir={textDir}>
              <aside className="col-span-12 md:col-span-4 lg:col-span-3">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 p-3">
                  <h2 className={`text-base font-semibold text-emerald-700 dark:text-emerald-300 mb-2`}>Menu</h2>
                  {enLoading && enMenu.length === 0 ? (
                    <p className="text-gray-700 dark:text-gray-300">Loading...</p>
                  ) : (
                    <ul className={`space-y-2`}>
                      {enMenu.map((m) => (
                        <li key={m.url}>
                          <button
                            onClick={() => setSelectedEnMenu(m)}
                            className={`w-full text-sm px-3 py-2 rounded-md border ${selectedEnMenu?.url === m.url ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/50'} text-gray-900 dark:text-gray-100 text-left`}
                          >
                            {m.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </aside>

              <section className="col-span-12 md:col-span-8 lg:col-span-9">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 p-3">
                  <h3 className={`text-lg md:text-xl font-semibold text-emerald-700 dark:text-emerald-300 mb-2`}>{selectedEnMenu?.title ?? 'Select from menu'}</h3>
                  {enLoading && (
                    <p className="text-gray-700 dark:text-gray-300">Loading...</p>
                  )}
                  {!enLoading && enItems.length === 0 && (
                    <p className="text-gray-700 dark:text-gray-300">No items</p>
                  )}
                  {!enLoading && enItems.length > 0 && (
                    <div className="space-y-3">
                      {enItems.map((c, idx) => {
                        const itemKey = c.id ?? `${selectedEnMenu?.url}:${idx}`;
                        const audioUrl = c.audio || '';
                        const playingThis = currentAudio?.itemKey === itemKey || (audioUrl && currentAudio?.src === audioUrl);
                        return (
                          <article key={itemKey} className={`rounded-lg p-3 border ${playingThis ? 'border-emerald-400 dark:border-emerald-500' : 'border-gray-200 dark:border-gray-700'} bg-white/60 dark:bg-gray-800/50`}>
                            <p className={`text-gray-900 dark:text-gray-100 text-left`}>{c.text}</p>
                            <div className={`mt-2 flex items-center justify-between`}>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {c.repeat ? (
                                  <span>{`Repeat: ${c.repeat}`}</span>
                                ) : (
                                  <span className="opacity-70">—</span>
                                )}
                                {c.source ? (
                                  <span className={`ml-3 opacity-80`}>{`Source: ${c.source}`}</span>
                                ) : null}
                              </div>
                              {audioUrl ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => playAudio(audioUrl, `${selectedEnMenu?.title ?? ''}`, itemKey)}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${playingThis && isPlaying ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                                  >
                                    <span>{(playingThis && isPlaying) ? 'Pause' : 'Play'}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                      <path d="M7 6v12l10-6-10-6z" />
                                    </svg>
                                  </button>
                                  {playingThis && (
                                    <button
                                      onClick={stopAudio}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm"
                                    >
                                      Stop
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">No audio</span>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
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