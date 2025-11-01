'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { useApp } from '../providers';
import { fetchQuran, getMetadata, type LanguageCode, type Ayah } from '@/lib/quran-api';
import { fetchTafsir, type TafsirVerse } from '@/lib/tafsir-api';

const LS_LAST_SURA = (lang: LanguageCode) => `tafsir_last_sura_${lang}`;

export default function TafsirPage() {
  const { language, theme } = useApp();
  const lang = (language === 'ar' ? 'ar' : 'en') as LanguageCode;
  const title = language === 'ar' ? 'التفسير' : 'Tafsir';
  const subtitle = language === 'ar' ? 'تفسير مبسط لكل سورة' : 'Concise explanation per surah';

  const calmCard = theme === 'dark'
    ? 'bg-gray-800/80 border-gray-700'
    : 'bg-white/85 border-white/30';

  const [metadata, setMetadata] = useState<{ surahs: Array<{ number: number; nameAr: string; nameEn: string; translation: string }>; totalPages: number; totalJuz: number; totalManzil: number } | null>(null);
  const [currentSura, setCurrentSura] = useState<number>(1);
  const [verses, setVerses] = useState<TafsirVerse[]>([]);
  const [surahAyahs, setSurahAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial surah from localStorage
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(LS_LAST_SURA(lang)) || '1');
      if (saved >= 1 && saved <= 114) setCurrentSura(saved);
    } catch {}
  }, [lang]);

  // Fetch metadata (surah names)
  useEffect(() => {
    let cancelled = false;
    getMetadata(lang).then((m) => {
      if (!cancelled) setMetadata(m);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [lang]);

  // Fetch tafsir verses when sura/lang changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTafsir(lang, currentSura)
      .then((v) => {
        if (!cancelled) setVerses(v);
      })
      .catch((e) => {
        if (!cancelled) setError(String((e as any)?.message || e) || 'Failed to load tafsir');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    try { localStorage.setItem(LS_LAST_SURA(lang), String(currentSura)); } catch {}
    return () => { cancelled = true; };
  }, [lang, currentSura]);

  // Fetch surah ayahs for currentSura and language
  useEffect(() => {
    let cancelled = false;
    fetchQuran(lang)
      .then((data) => {
        if (cancelled) return;
        const sura = data.surahs.find(s => s.number === currentSura);
        setSurahAyahs(sura ? sura.ayahs : []);
      })
      .catch(() => { /* best-effort; tafsir still shows */ })
    return () => { cancelled = true; };
  }, [lang, currentSura]);

  const surahOptions = useMemo(() => {
    return (metadata?.surahs || []).map(s => ({
      value: s.number,
      label: lang === 'ar' ? `${s.number}. ${s.nameAr}` : `${s.number}. ${s.nameEn}`,
      info: s.translation,
    }));
  }, [metadata, lang]);

  const goToSura = (n: number) => {
    if (n < 1 || n > 114) return;
    setCurrentSura(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-24">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 font-amiri">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className={`flex items-center gap-2 rounded-xl border ${calmCard} px-3 py-2`}>
            <label className="text-sm text-gray-600 dark:text-gray-400">{lang === 'ar' ? 'اختر سورة' : 'Select Surah'}</label>
            <select
              className="rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2"
              value={currentSura}
              onChange={(e) => goToSura(Number(e.target.value))}
            >
              {surahOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToSura(currentSura - 1)}
              disabled={currentSura <= 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="w-5 h-5 text-lg">◀️</span>
              {lang === 'ar' ? 'السورة السابقة' : 'Previous Surah'}
            </button>
            <button
              onClick={() => goToSura(currentSura + 1)}
              disabled={currentSura >= 114}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {lang === 'ar' ? 'السورة التالية' : 'Next Surah'}
              <span className="w-5 h-5 text-lg">▶️</span>
            </button>
          </div>
        </div>

        {/* Surah Info */}
        {metadata && (
          (() => {
            const suraMeta = metadata.surahs.find(s => s.number === currentSura);
            if (!suraMeta) return null;
            return (
              <div className={`mb-4 mx-auto max-w-2xl rounded-xl border ${calmCard} px-4 py-3 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-3 justify-center`}>
                <span className="w-4 h-4 text-emerald-600 text-lg">ℹ️</span>
                <span className="font-medium">
                  {lang === 'ar' ? `${suraMeta.number}. ${suraMeta.nameAr}` : `${suraMeta.number}. ${suraMeta.nameEn}`}
                </span>
                <span className="text-gray-500 dark:text-gray-400">{suraMeta.translation}</span>
              </div>
            );
          })()
        )}

        {/* Content */}
        <div className={`rounded-2xl shadow-2xl p-6 border ${calmCard}`}>
          {loading ? (
            <div className="flex items-center justify-center py:12 md:py-16">
              <span className="w-6 h-6 animate-spin text-emerald-600 text-xl inline-block">🔄</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400">{lang === 'ar' ? 'حدث خطأ أثناء التحميل' : 'An error occurred while loading'}</div>
          ) : (
            <div className="space-y-6" dir={dir}>
              {verses.map((v, idx) => {
                const ayah = surahAyahs.find(a => a.numberInSurah === v.ayah);
                return (
                  <div key={`${currentSura}-${v.ayah}-${idx}`} className="">
                    {/* Ayah label */}
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      {lang === 'ar' ? `آية ${v.ayah}` : `Ayah ${v.ayah}`}
                    </div>
                    {/* Ayah text */}
                    {ayah && (
                      <div className={`mb-2 text-xl ${lang === 'ar' ? 'font-amiri leading-relaxed' : 'leading-relaxed'}`}>
                        {ayah.text}
                      </div>
                    )}
                    {/* Tafsir text */}
                    <div className={`text-lg ${lang === 'ar' ? 'font-amiri' : ''} leading-relaxed`}>
                      {v.text}
                    </div>
                    {v.footnotes && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {v.footnotes}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Empty state */}
              {verses.length === 0 && (
                <div className="text-center text-gray-600 dark:text-gray-400">
                  {lang === 'ar' ? 'لا توجد بيانات متاحة لهذه السورة.' : 'No data available for this surah.'}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}