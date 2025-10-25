'use client';

import React from 'react';
import Header from '@/components/Header';
import { useApp } from '../providers';

export default function AdhkarPage() {
  const { language, theme } = useApp();
  const title = language === 'ar' ? 'الأذكار' : 'Adhkar';
  const subtitle = language === 'ar' ? 'صفحة الموارد — قيد الإعداد' : 'Resources page — coming soon';

  const calmCard = theme === 'dark'
    ? 'bg-gray-800/80 border-gray-700'
    : 'bg-white/85 border-white/30';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 font-amiri text-center">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{subtitle}</p>
        <div className={`rounded-2xl shadow-2xl p-6 border ${calmCard} text-center`}>
          <p className="text-gray-700 dark:text-gray-300">{language === 'ar' ? 'سيتم إضافة المحتوى قريبًا' : 'Content will be added soon.'}</p>
        </div>
      </main>
    </div>
  );
}