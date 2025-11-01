'use client';

import React from 'react';
import Header from '@/components/Header';
import { useApp } from '@/app/providers';

export default function DonatePage() {
  const { language, theme } = useApp();

  const isArabic = language === 'ar';

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-20 lg:pt-24">
        <div className={`rounded-2xl p-8 border ${
          theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-emerald-200'
        } backdrop-blur-sm`}
        >
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white font-amiri">
            {isArabic ? 'التبرع' : 'Donate'}
          </h1>

          {/* Paragraph 1 - Applying new, improved Arabic/English text to the original P tag structure */}
          <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {isArabic
              ? 'في عالم تزداد فيه سرعة المعلومات، نسعى لضمان أن تبقى المعرفة الإسلامية الصحيحة متاحة بدقة وسهولة. مشروعنا الطموح: بناء أول ذكاء اصطناعي إسلامي موثوق، يعمل كمرجع شامل ودائم لملايين المسلمين.'
              : 'In a world where information speed is increasing, we strive to ensure that accurate Islamic knowledge remains available with precision and ease. Our ambitious project: Building the first trusted Islamic Artificial Intelligence, which serves as a comprehensive and permanent reference for millions of Muslims.'
            }
          </p>

          {/* Paragraph 2 - Applying the 'Sadaqah Jariyah' and conclusion text to the original P tag structure */}
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-6`}>
            {isArabic
              ? 'تبرعك ليس مجرد دعم مالي؛ بل هو استثمار في صدقة جارية لا ينقطع أجرها، يساهم في نشر العلم الشرعي، تطوير الأدوات، وخدمة الأمة حول العالم. بمقدار دعمكم، ينتشر أثرنا. جزاكم الله خيراً وبارك في رزقكم.'
              : 'Your donation is not just financial support; rather, it is an investment in an ongoing charity (Sadaqah Jāriyah) whose reward never ceases, contributing to spreading Sacred Knowledge, developing tools, and serving the Ummah worldwide. The greater your support, the wider our impact. May Allah reward you well and bless your sustenance.'
            }
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href="https://patreon.com/TechBreak?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-colors"
              aria-label={isArabic ? 'التبرع عبر Patreon (يفتح في نافذة جديدة)' : 'Donate via Patreon (opens in new tab)'}
            >
              {isArabic ? 'تبرع الآن عبر Patreon' : 'Donate Now on Patreon'}
            </a>
            <a
              href="/"
              className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} hover:underline`}
            >
              {isArabic ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home'}
            </a>
          </div>

          <div className={`mt-6 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {isArabic
              ? 'هذا الرابط سيفتح في متصفحك صفحة Patreon الخاصة بنا للتبرع. وفقًا لقواعد Apple، يجب أن تتم التبرعات عبر رابط خارجي في المتصفح.'
              : 'This link opens in your browser to our Patreon page to donate. Per Apple policy, donations must proceed via an external browser link.'
            }
          </div>
        </div>
      </main>
    </div>
  );
}