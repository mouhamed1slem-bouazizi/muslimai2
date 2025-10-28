"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { ChevronLeft, ChevronRight, Loader2, Bookmark, Filter } from "lucide-react";

const LS_LAST_PAGE = (lang: LanguageCode) => `quran_last_page_${lang}`;
const TOTAL_PAGES = 604;

export default function QuranPage() {
  const { language, theme } = useApp();
  const { user, userProfile, updateUserProfile } = useAuth();
  const lang = (language === "ar" ? "ar" : "en") as LanguageCode;

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

  // Persist page progress
  useEffect(() => {
    try {
      localStorage.setItem(LS_LAST_PAGE(lang), String(currentPage));
    } catch {}
    const saveProgress = async () => {
      if (!user) return;
      try {
        const prev = userProfile?.quranProgress || {};
        const progress = {
          ...prev,
          [lang === "ar" ? "lastPage_ar" : "lastPage_en"]: currentPage,
          lastUpdated: new Date(),
        };
        await updateUserProfile({ quranProgress: progress });
      } catch (e) {
        // Errors are surfaced by AuthContext; keep UI smooth
      }
    };
    saveProgress();
  }, [currentPage, lang, user, userProfile, updateUserProfile]);

  const pageContent = useMemo(() => (indexes ? getPageContent(indexes, currentPage) : { page: currentPage, entries: [] }), [indexes, currentPage]);

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
                    const p = lang === 'ar' ? userProfile.quranProgress.lastPage_ar : userProfile.quranProgress.lastPage_en;
                    if (p) goToPage(p);
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
              <div className="space-y-4">
                {pageContent.entries.length === 0 && (
                  <div className="text-center text-gray-600 dark:text-gray-400">{lang === 'ar' ? 'لا توجد آيات لهذه الصفحة' : 'No ayahs for this page'}</div>
                )}
                {pageContent.entries.map((e, idx) => (
                  <div key={`${e.surahNumber}-${e.ayah.number}-${idx}`} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {lang === 'ar' ? `سورة ${e.surahNameAr}` : `Surah ${e.surahNameEn}`} — {lang === 'ar' ? `آية ${e.ayah.numberInSurah}` : `Ayah ${e.ayah.numberInSurah}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Juz {e.ayah.juz} • Manzil {e.ayah.manzil} • Ruku {e.ayah.ruku} • Hizb {e.ayah.hizbQuarter}
                      </div>
                    </div>
                    <div className={`${lang === 'ar' ? 'font-amiri text-2xl leading-relaxed' : 'font-serif text-lg'} text-gray-900 dark:text-white`}>{e.ayah.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              {lang === 'ar' ? 'الصفحة السابقة' : 'Previous Page'}
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
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