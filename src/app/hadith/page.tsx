'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/Header';
import { useApp } from '../providers';
import {
  EDITION_OPTIONS,
  fetchHadithEdition,
  filterByQuery,
  filterBySection,
  getSections,
  paginateHadiths,
  downloadHadithEditionOffline,
  type HadithEdition,
  type HadithLang,
  type HadithItem,
} from '@/lib/hadith-api';

export default function HadithPage() {
  const { language, theme } = useApp();
  const initialLang: HadithLang = language === 'ar' ? 'ar' : 'en';
  const [lang, setLang] = useState<HadithLang>(initialLang);
  const [edition, setEdition] = useState<HadithEdition>('nawawi');
  const [query, setQuery] = useState('');
  const [sectionId, setSectionId] = useState<string>('');
  const [hadiths, setHadiths] = useState<HadithItem[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string; first?: number; last?: number }[]>([]);
  const [bookName, setBookName] = useState<string>('');
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  // Mobile compact header state (iOS large-title style)
  const [showCompactHeader, setShowCompactHeader] = useState(false);
  const [collapseProgress, setCollapseProgress] = useState(0);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  // Onboarding overlay and offline download state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [dlEdition, setDlEdition] = useState<HadithEdition>('nawawi');
  const [dlLang, setDlLang] = useState<HadithLang>(initialLang);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadError, setDownloadError] = useState<string>('');

  // Batch download modal state
  const [showBatch, setShowBatch] = useState<boolean>(false);
  const [batchLang, setBatchLang] = useState<HadithLang>(initialLang);
  const [selectedBatch, setSelectedBatch] = useState<HadithEdition[]>([]);
  const [batchRunning, setBatchRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<Record<string, number>>({});
  const [batchStatus, setBatchStatus] = useState<Record<string, 'idle' | 'downloading' | 'done' | 'error'>>({});
  const [batchErrors, setBatchErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('hadith_lang') as HadithLang | null;
      const savedEdition = localStorage.getItem('hadith_edition') as HadithEdition | null;
      const savedPage = parseInt(localStorage.getItem('hadith_page') || '0', 10);
      if (savedLang === 'ar' || savedLang === 'en') setLang(savedLang);
      if (savedEdition && EDITION_OPTIONS.find((e) => e.id === savedEdition)) setEdition(savedEdition);
      if (!Number.isNaN(savedPage)) setPageIndex(Math.max(0, savedPage));

      const onboarding = localStorage.getItem('hadith_onboarding_done');
      if (!onboarding) {
        setShowOnboarding(true);
        setDlLang(savedLang === 'ar' || savedLang === 'en' ? savedLang : initialLang);
        setDlEdition(savedEdition && EDITION_OPTIONS.find((e) => e.id === savedEdition) ? savedEdition : 'nawawi');
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('hadith_lang', lang);
      localStorage.setItem('hadith_edition', edition);
      localStorage.setItem('hadith_page', String(pageIndex));
    } catch {}
  }, [lang, edition, pageIndex]);

  // Remove heavy info.json prefetch to speed up first render

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const data = await fetchHadithEdition(lang, edition);
        if (cancelled) return;
        const secs = getSections(data.metadata);
        setSections(secs);
        setBookName(data.metadata?.name || '');
        setHadiths(data.hadiths || []);
        setPageIndex(0);
        setSectionId('');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [lang, edition]);

  const filtered = useMemo(() => {
    const section = sections.find((s) => s.id === sectionId);
    const bySection = filterBySection(hadiths, section?.first, section?.last);
    const byQuery = filterByQuery(bySection, query);
    return byQuery;
  }, [hadiths, sections, sectionId, query]);

  const pages = useMemo(() => paginateHadiths(filtered, perPage), [filtered, perPage]);
  const currentPage = pages[pageIndex] || [];

  function scrollToTop() {
    if (typeof window === 'undefined') return;
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }

  const calmCard = theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/85 border-white/30';
  const isArabic = lang === 'ar';
  const title = isArabic ? 'الحديث' : 'Hadith';

  // Large title collapse behavior (mirror Prayer Times)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = titleRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShowCompactHeader(!entry.isIntersecting);
      },
      { rootMargin: '-56px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(el);

    const headerHeight = 64; // matches Header height
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
    let raf = 0;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const titleTop = rect.top + window.scrollY;
      const start = titleTop - headerHeight;
      const end = start + 60;
      const progress = clamp((window.scrollY - start) / (end - start), 0, 1);
      setCollapseProgress(progress);
      setShowCompactHeader(progress > 0.02);
    };

    const onScroll = () => { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    const onResize = () => { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(update);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  async function startOfflineDownload() {
    if (downloading) return;
    setDownloadError('');
    setDownloading(true);
    setDownloadProgress(0);
    try {
      const data = await downloadHadithEditionOffline(dlLang, dlEdition, (received, total) => {
        const pct = total > 0 ? received / total : (received ? 0.5 : 0);
        setDownloadProgress(Math.min(1, pct));
      });
      try { localStorage.setItem('hadith_onboarding_done', 'offline'); } catch {}
      setShowOnboarding(false);
      setLang(dlLang);
      setEdition(dlEdition);
      const secs = getSections(data.metadata);
      setSections(secs);
      setBookName(data.metadata?.name || '');
      setHadiths(data.hadiths || []);
      setPageIndex(0);
      setSectionId('');
    } catch (e: any) {
      setDownloadError(e?.message || String(e));
    } finally {
      setDownloading(false);
    }
  }

  function toggleBatchEdition(eid: HadithEdition) {
    setSelectedBatch((prev) => (prev.includes(eid) ? prev.filter((x) => x !== eid) : [...prev, eid]));
  }

  function selectAllBatch() {
    setSelectedBatch(EDITION_OPTIONS.map((o) => o.id));
  }

  function clearBatchSelection() {
    setSelectedBatch([]);
  }

  async function startBatchDownloads() {
    if (batchRunning || selectedBatch.length === 0) return;
    setBatchErrors({});
    setBatchRunning(true);
    const statusInit: Record<string, 'idle' | 'downloading' | 'done' | 'error'> = {};
    const progressInit: Record<string, number> = {};
    selectedBatch.forEach((ed) => {
      statusInit[ed] = 'downloading';
      progressInit[ed] = 0;
    });
    setBatchStatus(statusInit);
    setBatchProgress(progressInit);
    const tasks = selectedBatch.map((ed) =>
      downloadHadithEditionOffline(batchLang, ed, (received, total) => {
        const pct = total > 0 ? received / total : (received ? 0.5 : 0);
        setBatchProgress((p) => ({ ...p, [ed]: Math.min(1, pct) }));
      })
        .then(() => {
          setBatchStatus((s) => ({ ...s, [ed]: 'done' }));
        })
        .catch((err) => {
          setBatchStatus((s) => ({ ...s, [ed]: 'error' }));
          setBatchErrors((e) => ({ ...e, [ed]: err?.message || String(err) }));
        })
    );
    await Promise.allSettled(tasks);
    setBatchRunning(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header compactTitle={`${title}${bookName ? ` — ${bookName}` : ''}`} showCompactTitle={showCompactHeader} transparent collapseProgress={collapseProgress} />
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`max-w-lg w-[92%] rounded-2xl p-6 border ${calmCard} backdrop-blur`}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isArabic ? 'تنزيل كتاب الحديث للاستخدام السريع دون اتصال' : 'Download hadith book for fast, offline use'}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {isArabic
                ? 'إذا قمت بتنزيل كتاب الحديث، سيتم حفظه في الذاكرة المحلية ويعمل بسرعة كبيرة حتى بدون اتصال. إذا رفضت، سيتم التحميل من الإنترنت وقد يكون بطيئًا وقد تواجه أخطاء.'
                : 'If you download a hadith book, it will be saved locally and load very fast, even offline. If you refuse, the page will use the internet and may be slow or error-prone.'}
            </p>
            <div className="flex gap-2 mb-3">
              <select
                aria-label={isArabic ? 'اللغة للتنزيل' : 'Download language'}
                value={dlLang}
                onChange={(e) => setDlLang(e.target.value as HadithLang)}
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </select>
              <select
                aria-label={isArabic ? 'كتاب الحديث' : 'Hadith book'}
                value={dlEdition}
                onChange={(e) => setDlEdition(e.target.value as HadithEdition)}
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                {EDITION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            {downloading && (
              <div className="mb-3">
                <div className="h-2 rounded bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded bg-emerald-500" style={{ width: `${Math.round(downloadProgress * 100)}%` }} />
                </div>
                <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                  {(isArabic ? 'جاري التنزيل: ' : 'Downloading: ') + `${Math.round(downloadProgress * 100)}%`}
                </div>
              </div>
            )}
            {downloadError && (
              <div className="text-xs text-red-600 mb-3">{downloadError}</div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { try { localStorage.setItem('hadith_onboarding_done', 'online'); } catch {}; setShowOnboarding(false); }}
                className="px-3 py-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {isArabic ? 'استخدام عبر الإنترنت الآن' : 'Use online now'}
              </button>
              <button
                onClick={startOfflineDownload}
                className="px-3 py-2 rounded text-sm bg-emerald-600 text-white disabled:opacity-50"
                disabled={downloading}
              >
                {isArabic ? 'تنزيل للاستخدام دون اتصال' : 'Download for offline'}
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-24">
        <div className="text-center mb-6">
          <h1
            ref={titleRef}
            className="text-5xl md:text-4xl font-bold text-gray-900 dark:text-white font-amiri transition-transform duration-200 origin-top"
            style={{
              transform: `translateY(${(-16 * collapseProgress).toFixed(2)}px) scale(${(1 - 0.12 * collapseProgress).toFixed(3)})`,
            }}
          >
            {title}{bookName ? ` — ${bookName}` : ''}
          </h1>
        </div>

        <div className={`rounded-2xl shadow-2xl p-4 md:p-6 border ${calmCard}`}>
          <div ref={headerRef} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex gap-2">
              <select
                aria-label={isArabic ? 'اللغة' : 'Language'}
                value={lang}
                onChange={(e) => setLang(e.target.value as HadithLang)}
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </select>
              <select
                aria-label={isArabic ? 'المجموعة' : 'Edition'}
                value={edition}
                onChange={(e) => setEdition(e.target.value as HadithEdition)}
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                {EDITION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => setShowBatch(true)}
                className="px-2 py-1 rounded text-sm border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {isArabic ? 'تنزيل كتب متعددة' : 'Download multiple'}
              </button>
            </div>
            <div className="flex-1">
              <input
                aria-label={isArabic ? 'بحث' : 'Search'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isArabic ? 'ابحث في نص الحديث' : 'Search hadith text'}
                className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <div>
              <select
                aria-label={isArabic ? 'القسم' : 'Section'}
                value={sectionId}
                onChange={(e) => { setSectionId(e.target.value); setPageIndex(0); scrollToTop(); }}
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                <option value="">{isArabic ? 'كل الأقسام' : 'All sections'}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {isArabic ? 'عدد النتائج' : 'Results'}: {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { if (pageIndex > 0) { setPageIndex(pageIndex - 1); scrollToTop(); } }}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={pageIndex === 0}
              >
                {isArabic ? 'السابق' : 'Previous'}
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {isArabic ? 'صفحة' : 'Page'} {pageIndex + 1} / {pages.length || 1}
              </span>
              <button
                onClick={() => { if (pageIndex < (pages.length - 1)) { setPageIndex(pageIndex + 1); scrollToTop(); } }}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={pageIndex >= (pages.length - 1)}
              >
                {isArabic ? 'التالي' : 'Next'}
              </button>
              <select
                aria-label={isArabic ? 'لكل صفحة' : 'Per page'}
                value={perPage}
                onChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPageIndex(0); }}
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n} / {isArabic ? 'صفحة' : 'page'}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-600 dark:text-gray-300 py-10">{isArabic ? 'جار التحميل...' : 'Loading...'}</div>
          ) : currentPage.length === 0 ? (
            <div className="text-center text-gray-600 dark:text-gray-300 py-10">{isArabic ? 'لا توجد نتائج' : 'No results'}</div>
          ) : (
            <ul className={isArabic ? 'rtl font-amiri' : 'ltr'}>
              {currentPage.map((h) => (
                <li key={(h.hadithnumber ?? 0) + '-' + (h.arabicnumber ?? '')} className="mb-6 border rounded p-4 bg-gray-50 dark:bg-gray-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {isArabic ? 'رقم الحديث' : 'Hadith'}: {h.hadithnumber ?? h.arabicnumber ?? '-'}
                    </div>
                    {h.reference?.book != null && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {isArabic ? 'الكتاب' : 'Book'}: {h.reference.book} · {isArabic ? 'المرجع' : 'Ref'}: {h.reference.hadith}
                      </div>
                    )}
                  </div>
                  <p className={`${isArabic ? 'text-xl leading-9' : 'text-base leading-7'} text-gray-900 dark:text-white`}>{h.text}</p>
                  {h.grades && h.grades.length > 0 && (
                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                      {(isArabic ? 'الدرجة' : 'Grades') + ': '}
                      {h.grades
                        .filter((g) => g.grade || g.name)
                        .map((g) => [g.name, g.grade].filter(Boolean).join(': '))
                        .join('; ')}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      {showBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`max-w-2xl w-[95%] rounded-2xl p-6 border ${calmCard} backdrop-blur`}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isArabic ? 'تنزيل عدة كتب حديث' : 'Download multiple hadith books'}
            </h2>
            <div className="flex gap-2 mb-3">
              <select
                aria-label={isArabic ? 'اللغة' : 'Language'}
                value={batchLang}
                onChange={(e) => setBatchLang(e.target.value as HadithLang)}
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </select>
              <button onClick={selectAllBatch} className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                {isArabic ? 'تحديد الكل' : 'Select all'}
              </button>
              <button onClick={clearBatchSelection} className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                {isArabic ? 'إلغاء التحديد' : 'Clear'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {EDITION_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedBatch.includes(opt.id)}
                    onChange={() => toggleBatchEdition(opt.id)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {selectedBatch.length > 0 && (
              <div className="space-y-2 mb-3">
                {selectedBatch.map((ed) => (
                  <div key={ed} className="text-xs text-gray-900 dark:text-gray-200">
                    <div className="flex items-center justify-between">
                      <span>{ed}</span>
                      <span>
                        {batchStatus[ed] === 'done'
                          ? (isArabic ? 'اكتمل' : 'Done')
                          : batchStatus[ed] === 'error'
                          ? (isArabic ? 'فشل' : 'Error')
                          : batchStatus[ed] === 'downloading'
                          ? (isArabic ? 'جاري التنزيل' : 'Downloading')
                          : ''}
                      </span>
                    </div>
                    <div className="h-2 rounded bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded bg-emerald-500"
                        style={{ width: `${Math.round((batchProgress[ed] || 0) * 100)}%` }}
                      />
                    </div>
                    {batchErrors[ed] && (
                      <div className="text-red-600 dark:text-red-400">{batchErrors[ed]}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBatch(false)} className="px-3 py-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
              <button
                onClick={startBatchDownloads}
                disabled={batchRunning || selectedBatch.length === 0}
                className="px-3 py-2 rounded text-sm bg-emerald-600 text-white disabled:opacity-50"
              >
                {isArabic ? 'بدء التنزيل' : 'Start downloads'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}