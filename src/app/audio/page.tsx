'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/Header';
import { useApp } from '@/app/providers';
import { logger } from '@/lib/logger';

interface RadioStation {
  id: number;
  name: string;
  url: string;
  img?: string;
}

const RADIO_API = 'https://data-rosy.vercel.app/radio.json';
const STORAGE_KEY = 'muslimai:lastRadioId';

export default function AudioPage() {
  const { language, theme } = useApp();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [current, setCurrent] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.9);
  const [muted, setMuted] = useState<boolean>(false);

  const titleText = language === 'ar' ? 'الصوتيات' : 'Audio';
  const subtitleText = language === 'ar' ? 'إذاعات 18 قارئ للقرآن الكريم' : '18 reciters and Quran radio';

  // Initialize audio element
  useEffect(() => {
    const el = new Audio();
    el.preload = 'none';
    el.crossOrigin = 'anonymous';
    el.volume = volume;
    el.muted = muted;
    el.addEventListener('playing', () => setIsPlaying(true));
    el.addEventListener('pause', () => setIsPlaying(false));
    el.addEventListener('ended', () => setIsPlaying(false));
    el.addEventListener('error', () => {
      setError(language === 'ar' ? 'حدث خطأ في تشغيل البث' : 'Error playing stream');
      setIsPlaying(false);
    });
    audioRef.current = el;
    return () => {
      try { el.pause(); } catch (_) {}
      audioRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch radio stations
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(RADIO_API, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch radio list');
        const data = await res.json();
        const list: RadioStation[] = Array.isArray(data?.radios) ? data.radios.slice(0, 18) : [];
        setStations(list);
        // Restore last selection
        const lastIdStr = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        const last = lastIdStr ? list.find(s => s.id === Number(lastIdStr)) : null;
        if (last) setCurrent(last);
      } catch (err) {
        logger.warn('Radio fetch error:', err);
        setError(language === 'ar' ? 'تعذر تحميل الإذاعات' : 'Failed to load radios');
        setStations([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [language]);

  // Update audio properties when state changes
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
  }, [volume, muted]);

  const playStation = async (station: RadioStation) => {
    try {
      setCurrent(station);
      setError('');
      const el = audioRef.current;
      if (!el) return;
      if (el.src !== station.url) {
        el.src = station.url;
      }
      await el.play();
      setIsPlaying(true);
      try { localStorage.setItem(STORAGE_KEY, String(station.id)); } catch (_) {}
    } catch (err) {
      logger.warn('Play error:', err);
      setError(language === 'ar' ? 'لا يمكن تشغيل البث تلقائيًا، اضغط تشغيل' : 'Autoplay blocked, tap Play');
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (el.paused) {
        await el.play();
        setIsPlaying(true);
      } else {
        el.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      logger.warn('Toggle play error:', err);
      setError(language === 'ar' ? 'تعذر تشغيل البث' : 'Playback error');
    }
  };

  const stopPlayback = () => {
    const el = audioRef.current;
    if (!el) return;
    try { el.pause(); el.currentTime = 0; } catch (_) {}
    setIsPlaying(false);
  };

  const calmCard = theme === 'dark'
    ? 'bg-gray-800/80 border-gray-700'
    : 'bg-white/85 border-white/30';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 font-amiri text-center">{titleText}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{subtitleText}</p>

        {/* Now Playing / Controls */}
        <div className={`rounded-2xl shadow-2xl p-6 border ${calmCard} mb-8`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden ring-1 ring-emerald-300/40">
                {current?.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.img} alt={current.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-100 dark:bg-gray-700" />
                )}
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{language === 'ar' ? 'الآن يُبَث' : 'Now Playing'}</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{current ? current.name : (language === 'ar' ? 'اختر إذاعة' : 'Select a station')}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayPause}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                disabled={!current}
              >
                {isPlaying ? (language === 'ar' ? 'إيقاف مؤقت' : 'Pause') : (language === 'ar' ? 'تشغيل' : 'Play')}
              </button>
              <button
                onClick={stopPlayback}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {language === 'ar' ? 'إيقاف' : 'Stop'}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'الصوت' : 'Vol'}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    if (v === 0) setMuted(true); else setMuted(false);
                  }}
                  className="w-28 accent-emerald-600"
                />
                <button
                  onClick={() => setMuted(m => !m)}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {muted ? (language === 'ar' ? 'غير صامت' : 'Unmute') : (language === 'ar' ? 'كتم' : 'Mute')}
                </button>
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
        </div>

        {/* Stations */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'إذاعات القراء' : 'Reciter Radios'}</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">{language === 'ar' ? 'جاري التحميل...' : 'Loading stations...'}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stations.map((s) => (
              <button
                key={s.id}
                onClick={() => playStation(s)}
                className={`group rounded-xl overflow-hidden border ${theme === 'dark' ? 'border-gray-700 bg-gray-800/60' : 'border-emerald-200 bg-white/80'} shadow hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                aria-label={language === 'ar' ? `تشغيل ${s.name}` : `Play ${s.name}`}
              >
                <div className="relative h-24">
                  {s.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 dark:bg-gray-700" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  {current?.id === s.id && (
                    <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-emerald-600 text-white">{language === 'ar' ? 'يعمل الآن' : 'Playing'}</div>
                  )}
                </div>
                <div className="p-3 text-sm text-gray-900 dark:text-white text-center truncate">{s.name}</div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}