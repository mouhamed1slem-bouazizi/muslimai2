"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import { useApp } from "../providers";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchQuran,
  getQuranIndexes,
  getPageContent,
  getMetadata,
  type LanguageCode,
  type QuranData,
  type QuranIndexes,
} from "@/lib/quran-api";
import { ChevronLeft, ChevronRight, Loader2, Bookmark, Filter, Info, Play, Pause } from "lucide-react";

const LS_LAST_PAGE = (lang: LanguageCode) => `quran_last_page_${lang}`;
const TOTAL_PAGES = 604;
const SAVE_DEBOUNCE_MS = 1200; // debounce saving to avoid rapid writes

export default function QuranPage() {
  const { language, theme } = useApp();
  const { user, userProfile, updateUserProfile } = useAuth();
  const lang = (language === "ar" ? "ar" : "en") as LanguageCode;

  // Track last saved pages per language to avoid duplicate writes
  const lastSavedRef = useRef<{ ar?: number; en?: number }>({});
  const updateProfileRef = useRef(updateUserProfile);
  const quotaBlockedRef = useRef(false);

  // Keep a stable reference to updateUserProfile to avoid effect re-runs on provider render
  useEffect(() => {
    updateProfileRef.current = updateUserProfile;
  }, [updateUserProfile]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QuranData | null>(null);
  const [indexes, setIndexes] = useState<QuranIndexes | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [metadata, setMetadata] = useState<{ surahs: Array<{ number: number; nameAr: string; nameEn: string; translation: string }>; totalPages: number; totalJuz: number; totalManzil: number } | null>(null);

  // Filters
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [selectedManzil, setSelectedManzil] = useState<number | null>(null);
  const [selectedRuku, setSelectedRuku] = useState<number | null>(null);
  const [selectedHizbQuarter, setSelectedHizbQuarter] = useState<number | null>(null);
  const [selectedSajdaPage, setSelectedSajdaPage] = useState<number | null>(null);

  // Initial page from profile or localStorage
  useEffect(() => {
    const saved = (() => {
      if (lang === "ar") return userProfile?.quranProgress?.lastPage_ar;
      return userProfile?.quranProgress?.lastPage_en;
    })();
    if (saved && saved >= 1 && saved <= TOTAL_PAGES) {
      setCurrentPage(saved);
    } else {
      try {
        const lsVal = Number(localStorage.getItem(LS_LAST_PAGE(lang)) || "1");
        if (lsVal >= 1 && lsVal <= TOTAL_PAGES) setCurrentPage(lsVal);
      } catch {}
    }
  }, [lang, userProfile]);

  // Load data and build indexes
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchQuran(lang), getQuranIndexes(lang), getMetadata(lang)])
      .then(([d, idx, meta]) => {
        if (!mounted) return;
        setData(d);
        setIndexes(idx);
        setMetadata(meta);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message || String(e));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [lang]);

  // Keep ref in sync when profile changes (no writes here)
  useEffect(() => {
    lastSavedRef.current.ar = userProfile?.quranProgress?.lastPage_ar;
    lastSavedRef.current.en = userProfile?.quranProgress?.lastPage_en;
  }, [userProfile]);

  // Persist page progress with debounce and loop guard
  useEffect(() => {
    // Always update local storage for resume even if offline
    try {
      localStorage.setItem(LS_LAST_PAGE(lang), String(currentPage));
    } catch {}

    if (!user) return; // only save for authenticated users
    if (quotaBlockedRef.current) return; // stop attempts if quota exceeded

    // Skip if we already saved this exact page for the current language
    const alreadySaved = lang === "ar" ? lastSavedRef.current.ar : lastSavedRef.current.en;
    if (alreadySaved === currentPage) return;

    const timer = window.setTimeout(async () => {
      try {
        const prev = userProfile?.quranProgress || {};
        const progress = {
          ...prev,
          [lang === "ar" ? "lastPage_ar" : "lastPage_en"]: currentPage,
          lastUpdated: new Date(),
        };
        await updateProfileRef.current({ quranProgress: progress });
        // Remember last saved to prevent duplicate writes
        if (lang === "ar") {
          lastSavedRef.current.ar = currentPage;
        } else {
          lastSavedRef.current.en = currentPage;
        }
      } catch (e) {
        // Errors are handled in AuthContext; keep UI smooth
        const msg = String((e as any)?.message || e);
        if (msg.includes("Quota exceeded") || msg.includes("resource-exhausted")) {
          quotaBlockedRef.current = true;
        }
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [currentPage, lang, user]);

  const pageContent = useMemo(() => (indexes ? getPageContent(indexes, currentPage) : { page: currentPage, entries: [] }), [indexes, currentPage]);

  // Group ayahs by surah to render headers similar to classic mushaf view
  const groupedBySurah = useMemo(() => {
    const groups: Array<{ surahNumber: number; surahNameAr: string; surahNameEn: string; ayahs: typeof pageContent.entries }>
      = [];
    let current: { surahNumber: number; surahNameAr: string; surahNameEn: string; ayahs: typeof pageContent.entries } | null = null;
    for (const e of pageContent.entries) {
      if (!current || current.surahNumber !== e.surahNumber) {
        current = {
          surahNumber: e.surahNumber,
          surahNameAr: e.surahNameAr,
          surahNameEn: e.surahNameEn,
          ayahs: [],
        };
        groups.push(current);
      }
      current.ayahs.push(e);
    }
    return groups;
  }, [pageContent]);

  const BISMILLAH = "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ";
  const [infoOpenSurah, setInfoOpenSurah] = useState<number | null>(null);

  const calmCard = theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/85 border-white/30";
  const heading = lang === "ar" ? "القرآن الكريم" : "Holy Quran";
  const subtitle = lang === "ar" ? "عرض صفحة بصفحة مع عوامل تصفية" : "Page-by-page view with filters";

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_PAGES, Math.floor(p)));
    setCurrentPage(clamped);
  };

  const handleSurahSelect = (n: number) => {
    setSelectedSurah(n);
    if (!indexes) return;
    const fp = indexes.surahFirstPage.get(n);
    if (fp) goToPage(fp);
  };
  const handleJuzSelect = (j: number) => {
    setSelectedJuz(j);
    if (!indexes) return;
    const fp = indexes.juzFirstPage.get(j);
    if (fp) goToPage(fp);
  };
  const handleManzilSelect = (m: number) => {
    setSelectedManzil(m);
    if (!indexes) return;
    const fp = indexes.manzilFirstPage.get(m);
    if (fp) goToPage(fp);
  };
  const handleRukuSelect = (r: number) => {
    setSelectedRuku(r);
    if (!indexes) return;
    const fp = indexes.rukuFirstPage.get(r);
    if (fp) goToPage(fp);
  };
  const handleHizbSelect = (h: number) => {
    setSelectedHizbQuarter(h);
    if (!indexes) return;
    const fp = indexes.hizbQuarterFirstPage.get(h);
    if (fp) goToPage(fp);
  };
  const handleSajdaSelect = (p: number) => {
    setSelectedSajdaPage(p);
    goToPage(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-amiri">{heading}</h1>
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>

        {/* Controls */}
        <div className={`rounded-2xl shadow-2xl p-4 border ${calmCard} mb-6`}>
          <div className="flex flex-wrap items-end gap-3">
            {/* Surah */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 dark:text-gray-400">{lang === 'ar' ? 'السورة' : 'Surah'}</label>
              <select
                className="min-w-[220px] px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                value={selectedSurah ?? ''}
                onChange={(e) => handleSurahSelect(Number(e.target.value))}
              >
                <option value="">{lang === 'ar' ? 'اختر سورة' : 'Select Surah'}</option>
                {metadata?.surahs.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {lang === 'ar' ? s.nameAr : s.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Juz */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 dark:text-gray-400">Juz</label>
              <select
                className="min-w-[140px] px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                value={selectedJuz ?? ''}
                onChange={(e) => handleJuzSelect(Number(e.target.value))}
              >
                <option value="">{lang === 'ar' ? 'اختر جزء' : 'Select Juz'}</option>
                {Array.from({ length: metadata?.totalJuz || 30 }, (_, i) => i + 1).map((j) => (
                  <option key={j} value={j}>Juz {j}</option>
                ))}
              </select>
            </div>

            {/* Manzil */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 dark:text-gray-400">Manzil</label>
              <select
                className="min-w-[140px] px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                value={selectedManzil ?? ''}
                onChange={(e) => handleManzilSelect(Number(e.target.value))}
              >
                <option value="">{lang === 'ar' ? 'اختر منزل' : 'Select Manzil'}</option>
                {Array.from({ length: metadata?.totalManzil || 7 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>Manzil {m}</option>
                ))}
              </select>
            </div>

            {/* Ruku */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 dark:text-gray-400">Ruku</label>
              <input
                type="number"
                min={1}
                className="w-28 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                value={selectedRuku ?? ''}
                onChange={(e) => handleRukuSelect(Number(e.target.value))}
                placeholder="#"
              />
            </div>

            {/* Hizb Quarter */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 dark:text-gray-400">Hizb Quarter</label>
              <input
                type="number"
                min={1}
                className="w-32 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                value={selectedHizbQuarter ?? ''}
                onChange={(e) => handleHizbSelect(Number(e.target.value))}
                placeholder="#"
              />
            </div>

            {/* Sajda Pages */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 dark:text-gray-400">{lang === 'ar' ? 'صفحات السجدة' : 'Sajda Pages'}</label>
              <select
                className="min-w-[160px] px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                value={selectedSajdaPage ?? ''}
                onChange={(e) => handleSajdaSelect(Number(e.target.value))}
              >
                <option value="">{lang === 'ar' ? 'اختر صفحة' : 'Select Page'}</option>
                {indexes && Array.from(indexes.sajdaPages).sort((a, b) => a - b).map((p) => (
                  <option key={p} value={p}>Page {p}</option>
                ))}
              </select>
            </div>

            {/* Go to Page */}
            <div className="flex items-end gap-2 ms-auto">
              <label className="text-xs text-gray-600 dark:text-gray-400">{lang === 'ar' ? 'الصفحة' : 'Page'}</label>
              <input
                type="number"
                min={1}
                max={TOTAL_PAGES}
                value={currentPage}
                onChange={(e) => goToPage(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Reading Card */}
        <div className={`rounded-2xl shadow-2xl border ${calmCard}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{lang === 'ar' ? 'عرض الصفحة' : 'Page View'}</span>
            </div>
            <div className="flex items-center gap-3">
              {userProfile?.quranProgress && (
                <button
                  onClick={() => {
                    const qp = userProfile?.quranProgress;
                    const p = lang === 'ar' ? qp?.lastPage_ar : qp?.lastPage_en;
                    if (typeof p === 'number' && p > 0) goToPage(p);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  <Bookmark className="w-4 h-4" />
                  {lang === 'ar' ? 'متابعة القراءة' : 'Resume Reading'}
                </button>
              )}
              <div className="text-sm text-gray-700 dark:text-gray-300">{lang === 'ar' ? 'الصفحة' : 'Page'} {currentPage} / {TOTAL_PAGES}</div>
            </div>
          </div>

          {/* Page content */}
          <div className="px-6 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600 dark:text-red-400">{error}</div>
            ) : (
              <div className="space-y-10">
                {groupedBySurah.length === 0 && (
                  <div className="text-center text-gray-600 dark:text-gray-400">{lang === 'ar' ? 'لا توجد آيات لهذه الصفحة' : 'No ayahs for this page'}</div>
                )}

                {groupedBySurah.map((group, idx) => (
                  <div key={`surah-${group.surahNumber}`} className="px-2">
                    {/* Surah header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInfoOpenSurah(infoOpenSurah === group.surahNumber ? null : group.surahNumber)}
                          className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
                        >
                          <Info className="w-4 h-4" /> {lang === 'ar' ? 'معلومات السورة' : 'Surah Info'}
                        </button>
                      </div>
                      <div className="text-center flex-1">
                    <h2 className="font-amiri text-3xl md:text-4xl text-white">{lang === 'ar' ? group.surahNameAr : `Surah ${group.surahNameEn}`}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Audio button placeholder */}
                        <button
                          type="button"
                          className="flex items-center gap-1 text-sm text-teal-300 hover:text-teal-200"
                          onClick={() => {
                            // Navigate to Audio page for full player
                            window.location.href = '/audio';
                          }}
                        >
                          <Play className="w-4 h-4" /> {lang === 'ar' ? 'تشغيل الصوت' : 'Play Audio'}
                        </button>
                      </div>
                    </div>

                    {/* Surah info collapsible */}
                    {infoOpenSurah === group.surahNumber && (
                      <div className={`mb-4 mx-auto max-w-2xl rounded-xl border ${calmCard} px-4 py-3 text-sm text-gray-700 dark:text-gray-300`}> 
                        {data && (
                          (() => {
                            const meta = data.surahs.find(s => s.number === group.surahNumber);
                            return meta ? (
                              <div className="flex flex-wrap items-center justify-center gap-4">
                                <div>{lang === 'ar' ? `عدد الآيات: ${meta.ayahs.length}` : `Ayahs: ${meta.ayahs.length}`}</div>
                                <div>{lang === 'ar' ? `ترجمة الاسم: ${meta.englishNameTranslation}` : `Translation: ${meta.englishNameTranslation}`}</div>
                                <div>{lang === 'ar' ? `مكان النزول: ${meta.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}` : `Revelation: ${meta.revelationType}`}</div>
                              </div>
                            ) : null;
                          })()
                        )}
                      </div>
                    )}

                    {/* Bismillah — show ONLY on the first page and first surah block */}
                    {pageContent.page === 1 && idx === 0 && (
                      <div className="text-center mb-6" id="bismillah-first-page">
                        <div className="font-amiri text-2xl md:text-3xl text-emerald-300">{BISMILLAH}</div>
                      </div>
                    )}

                    {/* Ayahs block */}
                    <div className="text-center space-y-6">
                      {group.ayahs.map((e, idx) => (
                        <div key={`${group.surahNumber}-${e.ayah.number}-${idx}`} className="mx-auto max-w-3xl">
                          <div className={`${lang === 'ar' ? 'font-amiri text-3xl leading-loose' : 'font-serif text-2xl leading-relaxed'} text-white`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                            {e.ayah.text}
                            <span className="inline-flex items-center justify-center align-middle ms-3 translate-y-1 rounded-full border border-teal-400 text-teal-300 w-8 h-8 text-sm">
                              {e.ayah.numberInSurah}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Page number footer */}
                <div className="mt-10 text-center text-gray-400">{pageContent.page}</div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => { goToPage(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage <= 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              {lang === 'ar' ? 'الصفحة السابقة' : 'Previous Page'}
            </button>
            <button
              onClick={() => { goToPage(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage >= TOTAL_PAGES}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {lang === 'ar' ? 'الصفحة التالية' : 'Next Page'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}