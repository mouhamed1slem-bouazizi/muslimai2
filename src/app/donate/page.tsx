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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className={`rounded-2xl p-8 border ${
          theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-emerald-200'
        } backdrop-blur-sm`}
        >
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white font-amiri">
            {isArabic ? 'التبرع' : 'Donate'}
          </h1>

          <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {isArabic
              ? 'نحن نعمل على بناء ذكاء اصطناعي إسلامي لخدمة المسلمين حول العالم، وتحسين هذا التطبيق ليكون أكثر فائدة وسهولة. تبرعكم يساعدنا في تطوير الميزات، تحسين الأداء، وتمويل البنية التحتية والبحث.'
              : 'We are building Islamic AI to serve Muslims worldwide and improving this app to be more helpful and accessible. Your donation helps us develop features, improve performance, and fund infrastructure and research.'
            }
          </p>

          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-6`}>
            {isArabic
              ? 'بدعمكم، نستطيع مواصلة بناء أدوات تعليمية وروحية نافعة، وتقديم تجربة سلسة للمستخدمين. جزاكم الله خيرًا على دعمكم للفريق ولمشروعنا.'
              : 'With your support, we can continue building beneficial educational and spiritual tools and deliver a smooth experience for users. JazakAllahu khayran for supporting our team and this project.'
            }
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href="#"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-colors"
            >
              {isArabic ? 'تبرع الآن' : 'Donate Now'}
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
              ? 'ملاحظة: سيتم إضافة رابط آمن للتبرع قريبًا. نشكركم على نيتكم الطيبة.'
              : 'Note: A secure donation link will be added soon. Thank you for your kind intention.'
            }
          </div>
        </div>
      </main>
    </div>
  );
}