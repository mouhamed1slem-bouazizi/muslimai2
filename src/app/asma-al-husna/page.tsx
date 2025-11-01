'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useApp } from '../providers';

type AsmaItem = {
  number: number;
  name: string; // Arabic
  transliteration?: string;
  en?: { meaning?: string };
  ar?: { meaning?: string };
};

export default function AsmaAlHusnaPage() {
  const { language, theme } = useApp();
  const title = language === 'ar' ? 'أسماء الله الحسنى' : 'Asma al Husna';
  const subtitle = language === 'ar' ? 'تعرف على الأسماء الحسنى ومعانيها' : 'Explore the Beautiful Names of Allah';
  const calmCard = theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-white/30';

  const [featured, setFeatured] = useState<AsmaItem | null>(null);
  const [aiEn, setAiEn] = useState('');
  const [aiAr, setAiAr] = useState('');
  const [names, setNames] = useState<AsmaItem[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(true);

  useEffect(() => {
    const KEY = 'asmaDailyNumber.v1';
    const now = Date.now();
    const saved = typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;
    let num: number | null = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.num && parsed.ts && now - parsed.ts < 24 * 60 * 60 * 1000) {
          num = parsed.num as number;
        }
      } catch {}
    }
    if (!num) {
      num = Math.floor(Math.random() * 99) + 1;
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEY, JSON.stringify({ num, ts: now }));
      }
    }

    const fetchFeatured = async () => {
      try {
        const res = await fetch(`https://api.aladhan.com/v1/asmaAlHusna/${num}`, { cache: 'no-store' });
        const json = await res.json();
        const payload = json?.data;
        const d: AsmaItem = Array.isArray(payload) ? payload[0] : payload;
        setFeatured(d || null);
      } catch (e) {
        setFeatured(null);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch('https://api.aladhan.com/v1/asmaAlHusna', { cache: 'no-store' });
        const json = await res.json();
        const arr: AsmaItem[] = json?.data || [];
        setNames(arr);
      } catch (e) {
        setNames([]);
      } finally {
        setLoadingGrid(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (!featured) return;
    const nameAr = featured.name || '';
    const nameEn = featured.transliteration || nameAr || '';
    const enPrompt = `Explain the meaning, context, and virtues of the Name of Allah \"${nameEn}\" (Arabic: ${nameAr}). Keep it concise (80-120 words). Output in English.`;
    const arPrompt = `اشرح معنى وسياق وفضائل اسم الله \"${nameEn}\" (العربية: ${nameAr}) باختصار (٨٠-١٢٠ كلمة). باللغة العربية.`;
    setAiEn('');
    setAiAr('');
    const fetchAI = async () => {
      try {
        if (language === 'ar') {
          const arRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(arPrompt)}`, { cache: 'no-store' });
          setAiAr(await arRes.text());
        } else {
          const enRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(enPrompt)}`, { cache: 'no-store' });
          setAiEn(await enRes.text());
        }
      } catch {}
    };
    fetchAI();
  }, [featured, language]);

  const meaningFrom = (item: AsmaItem | null) => {
    if (!item) return '';
    return language === 'ar'
      ? (item.ar?.meaning || item.en?.meaning || '')
      : (item.en?.meaning || item.ar?.meaning || '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-24">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 font-amiri text-center">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{subtitle}</p>

        {/* Featured Name Card */}
        <section className={`rounded-2xl shadow-2xl p-6 border ${calmCard} mb-10 relative overflow-hidden`}> 
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.08),transparent_50%)]" />
          <div className="relative">
            {loadingFeatured ? (
              <div className="animate-pulse h-28 bg-gray-200/50 dark:bg-gray-700/30 rounded-xl" />
            ) : featured ? (
              <div className="grid md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-1 text-center md:text-left rtl:text-right">
                  <div className="text-4xl md:text-5xl font-amiri text-emerald-700 dark:text-emerald-300">{featured.name}</div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{featured.transliteration || ''}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">#{featured.number}</div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{meaningFrom(featured)}</p>
                  {language !== 'ar' && aiEn && (
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Insight (EN)</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{aiEn}</p>
                    </div>
                  )}
                  {language === 'ar' && aiAr && (
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">شرح (AR)</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-amiri">{aiAr}</p>
                    </div>
                  )}
                  {((language === 'en' && !aiEn) || (language === 'ar' && !aiAr)) && (
                    <p className="text-gray-500 dark:text-gray-500 text-sm">Loading commentary…</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">Unable to load featured name.</p>
            )}
          </div>
        </section>

        {/* All Names Grid */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-amiri text-center">{language === 'ar' ? 'كل الأسماء الحسنى' : 'All Beautiful Names'}</h2>
          {loadingGrid ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-200/50 dark:bg-gray-700/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {names.map((n) => (
                <div key={n.number} className="rounded-xl border bg-white/70 dark:bg-gray-800/70 border-emerald-100 dark:border-gray-700 p-4 shadow hover:shadow-md transition-shadow">
                  <div className="text-2xl font-amiri text-emerald-700 dark:text-emerald-300 text-center">{n.name}</div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 text-center">{n.transliteration || ''}</div>
                  <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-500 text-center">#{n.number}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}