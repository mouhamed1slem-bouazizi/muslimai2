'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/Header';
import { useApp } from '../providers';
import {
  EDITION_OPTIONS,
  fetchHadithEdition,
  fetchHadithInfo,
  filterByQuery,
  filterBySection,
  getSections,
  paginateHadiths,
  type HadithEdition,
  type HadithLang,
  type HadithItem,
} from '@/lib/hadith-api';

export default function HadithPage() {
  const { language, theme } = useApp();
  const initialLang: HadithLang = language === 'ar' ? 'ar' : 'en';
  const [lang, setLang] = useState<HadithLang>(initialLang);
  const [edition, setEdition] = useState<HadithEdition>('bukhari');
  const [query, setQuery] = useState('');
  const [sectionId, setSectionId] = useState<string>('');
  const [hadiths, setHadiths] = useState<HadithItem[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string; first?: number; last?: number }[]>([]);
  const [bookName, setBookName] = useState<string>('');
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);
  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('hadith_lang') as HadithLang | null;
      const savedEdition = localStorage.getItem('hadith_edition') as HadithEdition | null;
      const savedPage = parseInt(localStorage.getItem('hadith_page') || '0', 10);
      if (savedLang === 'ar' || savedLang === 'en') setLang(savedLang);
      if (savedEdition && EDITION_OPTIONS.find((e) => e.id === savedEdition)) setEdition(savedEdition);
      if (!Number.isNaN(savedPage)) setPageIndex(Math.max(0, savedPage));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('hadith_lang', lang);
      localStorage.setItem('hadith_edition', edition);
      localStorage.setItem('hadith_page', String(pageIndex));
    } catch {}
  }, [lang, edition, pageIndex]);

  useEffect(() => {
    fetchHadithInfo().catch(() => {});
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-amiri">{title}{bookName ? ` — ${bookName}` : ''}</h1>
        </div>

        <div className={`rounded-2xl shadow-2xl p-4 md:p-6 border ${calmCard}`}>
          <div ref={headerRef} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex gap-2">
              <select
                aria-label={isArabic ? 'اللغة' : 'Language'}
                value={lang}
                onChange={(e) => setLang(e.target.value as HadithLang)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </select>
              <select
                aria-label={isArabic ? 'المجموعة' : 'Edition'}
                value={edition}
                onChange={(e) => setEdition(e.target.value as HadithEdition)}
                className="border rounded px-2 py-1 text-sm"
              >
                {EDITION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <input
                aria-label={isArabic ? 'بحث' : 'Search'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isArabic ? 'ابحث في نص الحديث' : 'Search hadith text'}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <select
                aria-label={isArabic ? 'القسم' : 'Section'}
                value={sectionId}
                onChange={(e) => { setSectionId(e.target.value); setPageIndex(0); scrollToTop(); }}
                className="border rounded px-2 py-1 text-sm"
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
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                disabled={pageIndex === 0}
              >
                {isArabic ? 'السابق' : 'Previous'}
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {isArabic ? 'صفحة' : 'Page'} {pageIndex + 1} / {pages.length || 1}
              </span>
              <button
                onClick={() => { if (pageIndex < (pages.length - 1)) { setPageIndex(pageIndex + 1); scrollToTop(); } }}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                disabled={pageIndex >= (pages.length - 1)}
              >
                {isArabic ? 'التالي' : 'Next'}
              </button>
              <select
                aria-label={isArabic ? 'لكل صفحة' : 'Per page'}
                value={perPage}
                onChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPageIndex(0); }}
                className="border rounded px-2 py-1 text-sm"
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
                  <p className={isArabic ? 'text-xl leading-9' : 'text-base leading-7'}>{h.text}</p>
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
    </div>
  );
}