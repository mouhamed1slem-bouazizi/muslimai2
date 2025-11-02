'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/app/providers';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { logger } from '@/lib/logger';

interface HeaderProps {
  compactTitle?: string;
  showCompactTitle?: boolean;
  transparent?: boolean;
  collapseProgress?: number; // 0 → large title visible, 1 → compact title fully shown
}
const Header: React.FC<HeaderProps> = ({ compactTitle, showCompactTitle = false, transparent = false, collapseProgress = 0 }) => {
  const { language, setLanguage, theme, setTheme } = useApp();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
   const [resourcesOpen, setResourcesOpen] = useState(false);
   const closeResourcesTimer = useRef<number | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logger.warn('Logout error:', error as Error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const menuItems = [
    { 
      icon: () => <span className="w-5 h-5 text-lg">⏰</span>, 
      label: language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times', 
      href: '/prayer-times' 
    },
    { 
      icon: () => <span className="w-5 h-5 text-lg">📅</span>, 
      label: language === 'ar' ? 'التقويم الإسلامي' : 'Islamic Calendar', 
      href: '/islamic-calendar' 
    },
    { 
      icon: () => <span className="w-5 h-5 text-lg">🧭</span>, 
      label: language === 'ar' ? 'اتجاه القبلة' : 'Qibla Direction', 
      href: '/qibla' 
    },
    { 
      icon: () => <span className="w-5 h-5 text-lg">📖</span>, 
      label: language === 'ar' ? 'القرآن والموارد' : 'Quran & Resources', 
      children: [
        { label: language === 'ar' ? 'أسماء الله الحسنى' : 'Asma al Husna', href: '/asma-al-husna' },
        { label: language === 'ar' ? 'القرآن' : 'Quran', href: '/quran' },
        { label: language === 'ar' ? 'التفسير' : 'Tafsir', href: '/tafsir' },
        { label: language === 'ar' ? 'الحديث' : 'Hadith', href: '/hadith' },
        { label: language === 'ar' ? 'الأذكار' : 'Adhkar', href: '/adhkar' },
      ],
    },
    { 
      icon: () => <span className="w-5 h-5 text-lg">🔊</span>, 
      label: language === 'ar' ? 'الصوتيات' : 'Audio', 
      href: '/audio' 
    },
    { 
      icon: () => <span className="w-5 h-5 text-lg">💬</span>, 
      label: language === 'ar' ? 'الذكاء الاصطناعي' : 'AI Assistant', 
      href: '/ai-chat' 
    },
  ];

  const openResources = () => {
    if (closeResourcesTimer.current) {
      clearTimeout(closeResourcesTimer.current);
      closeResourcesTimer.current = null;
    }
    setResourcesOpen(true);
  };

  const scheduleCloseResources = () => {
    if (closeResourcesTimer.current) {
      clearTimeout(closeResourcesTimer.current);
    }
    closeResourcesTimer.current = window.setTimeout(() => {
      setResourcesOpen(false);
    }, 200);
  };

  const progress = Math.min(Math.max(collapseProgress ?? (showCompactTitle ? 1 : 0), 0), 1);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${transparent ? 'bg-transparent' : 'bg-white/80 dark:bg-gray-900/80'} backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-200`}
      style={transparent ? {
        backgroundColor: theme === 'dark'
          ? `rgba(17, 24, 39, ${progress * 0.5})` // dark:bg-gray-900 with progressive alpha
          : `rgba(255, 255, 255, ${progress * 0.82})`, // light:bg-white with progressive alpha
      } : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse group">
            <div className="relative">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300 group-hover:scale-105">
                <span className="w-5 h-5 lg:w-6 lg:h-6 text-white">⏰</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 to-cyan-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-all duration-300"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl lg:text-2xl font-bold gradient-text font-inter">
                {language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">
                {language === 'ar' ? 'تطبيق إسلامي شامل' : 'Islamic Companion'}
              </p>
            </div>
          </Link>

          {/* Mobile compact center title (iOS large-title collapse) */}
          <div className="flex-1 lg:hidden flex items-center justify-center">
            <span
              className="text-base font-semibold text-gray-900 dark:text-white transition-all duration-200 will-change-transform will-change-opacity"
              style={{
                opacity: progress,
                transform: `translateY(${(1 - progress) * 6}px)`,
              }}
            >
              {compactTitle}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <NavigationMenu>
              <NavigationMenuList className="space-x-1">
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/prayer-times" className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all duration-200 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                      <span className="w-4 h-4 mr-2">⏰</span>
                      {language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/islamic-calendar" className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
                      <span className="w-4 h-4 mr-2">📅</span>
                      {language === 'ar' ? 'التقويم الإسلامي' : 'Islamic Calendar'}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/qibla" className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
                      <span className="w-4 h-4 mr-2">🧭</span>
                      {language === 'ar' ? 'اتجاه القبلة' : 'Qibla Direction'}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
                    <span className="w-4 h-4 mr-2">📚</span>
                    {language === 'ar' ? 'القرآن والموارد' : 'Quran & Resources'}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-[400px] lg:w-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl">
                      <div className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 p-6 no-underline outline-none focus:shadow-md hover:bg-gradient-to-br hover:from-emerald-500/20 hover:to-teal-600/20 transition-all duration-200"
                            href="/asma-al-husna"
                          >
                            <span className="h-6 w-6 text-emerald-600 dark:text-emerald-400">📚</span>
                            <div className="mb-2 mt-4 text-lg font-medium text-gray-900 dark:text-white">
                              {language === 'ar' ? 'أسماء الله الحسنى' : 'Asma al Husna'}
                            </div>
                            <p className="text-sm leading-tight text-gray-600 dark:text-gray-400">
                              {language === 'ar' ? 'الأسماء الحسنى لله تعالى' : 'The beautiful names of Allah'}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </div>
                      <div className="grid gap-2">
                        <NavigationMenuLink asChild>
                          <Link
                            className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-800/80 focus:bg-gray-100 focus:text-gray-900"
                            href="/quran"
                          >
                            <div className="text-sm font-medium leading-none text-gray-900 dark:text-white">
                              {language === 'ar' ? 'القرآن' : 'Quran'}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-gray-600 dark:text-gray-400">
                              {language === 'ar' ? 'اقرأ واستمع للقرآن الكريم' : 'Read and listen to the Holy Quran'}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-800/80 focus:bg-gray-100 focus:text-gray-900"
                            href="/tafsir"
                          >
                            <div className="text-sm font-medium leading-none text-gray-900 dark:text-white">
                              {language === 'ar' ? 'التفسير' : 'Tafsir'}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-gray-600 dark:text-gray-400">
                              {language === 'ar' ? 'تفسير القرآن الكريم' : 'Quran interpretation'}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-800/80 focus:bg-gray-100 focus:text-gray-900"
                            href="/hadith"
                          >
                            <div className="text-sm font-medium leading-none text-gray-900 dark:text-white">
                              {language === 'ar' ? 'الحديث' : 'Hadith'}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-gray-600 dark:text-gray-400">
                              {language === 'ar' ? 'أحاديث نبوية شريفة' : 'Prophetic traditions'}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-800/80 focus:bg-gray-100 focus:text-gray-900"
                            href="/adhkar"
                          >
                            <div className="text-sm font-medium leading-none text-gray-900 dark:text-white">
                              {language === 'ar' ? 'الأذكار' : 'Adhkar'}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-gray-600 dark:text-gray-400">
                              {language === 'ar' ? 'أذكار الصباح والمساء' : 'Morning and evening remembrance'}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/audio" className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
                      <span className="w-4 h-4 mr-2">🔊</span>
                      {language === 'ar' ? 'الصوتيات' : 'Audio'}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/ai-chat" className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
                      <span className="w-4 h-4 mr-2">💬</span>
                      {language === 'ar' ? 'الذكاء الاصطناعي' : 'AI Assistant'}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/donate" className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
                        <span className="w-4 h-4 mr-2">❤️</span>
                        {language === 'ar' ? 'المفضلة' : 'Favorites'}
                      </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 border-0 transition-all duration-200 hover:scale-105"
            >
              {theme === 'dark' ? (
                <span className="h-4 w-4">☀️</span>
              ) : (
                <span className="h-4 w-4">🌙</span>
              )}
            </Button>

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="hidden sm:flex h-10 px-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 border-0 transition-all duration-200 hover:scale-105 items-center space-x-2"
            >
              <span className="h-4 w-4 text-gray-700 dark:text-gray-300 text-sm">🌐</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'ar' ? 'EN' : 'عربي'}
              </span>
            </Button>

            {/* User Menu */}
            {user ? (
              <div className="hidden lg:flex items-center space-x-3">
                <Link href="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all duration-200 hover:scale-105 cursor-pointer">
                  <span className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.email?.split('@')[0]}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-10 px-3 rounded-xl bg-red-100/80 dark:bg-red-900/20 hover:bg-red-200/80 dark:hover:bg-red-900/40 border-0 transition-all duration-200 hover:scale-105 text-red-600 dark:text-red-400"
                >
                  <span className="h-4 w-4 mr-2">🚪</span>
                  {language === 'ar' ? 'خروج' : 'Logout'}
                </Button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-10 px-4 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 border-0 transition-all duration-200 hover:scale-105"
                >
                  <Link href="/auth/login">
                    <span className="h-4 w-4 mr-2">👤</span>
                    {language === 'ar' ? 'دخول' : 'Login'}
                  </Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 transition-all duration-200 hover:scale-105 shadow-lg shadow-emerald-500/25"
                >
                  <Link href="/auth/signup">
                    {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 w-10 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 border-0 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <span className="h-5 w-5 text-gray-700 dark:text-white">☰</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-full sm:w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-0 transition-colors duration-300"
              >
                <div className="flex flex-col h-full">
                  <SheetHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <SheetTitle className="text-left text-xl font-bold text-gray-900 dark:text-gray-100">
                      {language === 'ar' ? 'القائمة' : 'Menu'}
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* User Section */}
                    {user ? (
                      <Link href="/profile" className="flex items-center space-x-3 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.email?.split('@')[0]}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? 'مستخدم مسجل' : 'Registered User'}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          asChild
                          className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 transition-all duration-200 shadow-lg shadow-emerald-500/25"
                        >
                          <Link href="/auth/signup">
                            <span className="w-5 h-5 mr-2">👤</span>
                            {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                          className="w-full h-12 rounded-2xl bg-transparent border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition-all duration-200"
                        >
                          <Link href="/auth/login">
                            {language === 'ar' ? 'دخول' : 'Login'}
                          </Link>
                        </Button>
                      </div>
                    )}

                    {/* Navigation Links */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                        {language === 'ar' ? 'التنقل' : 'Navigation'}
                      </h3>
                      
                      <Link
                        href="/prayer-times"
                        className="flex items-center space-x-3 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <span className="text-xl">⏰</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? 'أوقات الصلاة اليومية' : 'Daily prayer schedule'}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/islamic-calendar"
                        className="flex items-center space-x-3 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <span className="text-xl">📅</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {language === 'ar' ? 'التقويم الإسلامي' : 'Islamic Calendar'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? 'التواريخ الهجرية' : 'Hijri dates'}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/qibla"
                        className="flex items-center space-x-3 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <span className="text-xl">🧭</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {language === 'ar' ? 'اتجاه القبلة' : 'Qibla Direction'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? 'اتجاه الكعبة المشرفة' : 'Direction to Kaaba'}
                          </p>
                        </div>
                      </Link>

                      {/* Quran & Resources Dropdown */}
                      <div className="space-y-2">
                        <button
                          onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                              <span className="text-xl">📚</span>
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {language === 'ar' ? 'القرآن والموارد' : 'Quran & Resources'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {language === 'ar' ? 'الموارد الإسلامية' : 'Islamic resources'}
                              </p>
                            </div>
                          </div>
                          <span className={`w-5 h-5 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-transform duration-200 ${mobileDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        
                        {mobileDropdownOpen && (
                          <div className="ml-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <Link
                              href="/asma-al-husna"
                              className="flex items-center space-x-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">📖</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {language === 'ar' ? 'أسماء الله الحسنى' : 'Asma al Husna'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {language === 'ar' ? 'الأسماء الحسنى' : 'Beautiful names'}
                                </p>
                              </div>
                            </Link>

                            <Link
                              href="/quran"
                              className="flex items-center space-x-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-base">📖</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {language === 'ar' ? 'القرآن الكريم' : 'Quran'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {language === 'ar' ? 'القراءة والاستماع' : 'Read and listen'}
                                </p>
                              </div>
                            </Link>

                            <Link
                              href="/tafsir"
                              className="flex items-center space-x-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-base">📜</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {language === 'ar' ? 'التفسير' : 'Tafsir'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {language === 'ar' ? 'تفسير القرآن' : 'Quran interpretation'}
                                </p>
                              </div>
                            </Link>

                            <Link
                              href="/hadith"
                              className="flex items-center space-x-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                                <span className="text-base">🗣️</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {language === 'ar' ? 'الحديث الشريف' : 'Hadith'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {language === 'ar' ? 'أحاديث نبوية' : 'Prophetic traditions'}
                                </p>
                              </div>
                            </Link>

                            <Link
                              href="/adhkar"
                              className="flex items-center space-x-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
                                <span className="text-base">📿</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {language === 'ar' ? 'الأذكار' : 'Adhkar'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {language === 'ar' ? 'أذكار يومية' : 'Daily remembrance'}
                                </p>
                              </div>
                            </Link>
                          </div>
                        )}
                      </div>

                      <Link
                        href="/audio"
                        className="flex items-center space-x-3 p-4 rounded-2xl bg-gray-100/80 dark:bg-gray-800/30 transition-all duration-200 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <span className="text-xl">🔊</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {language === 'ar' ? 'الصوتيات' : 'Audio'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? 'تسجيلات صوتية' : 'Audio recordings'}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/ai-chat"
                        className="flex items-center space-x-3 p-4 rounded-2xl bg-gray-100/80 dark:bg-gray-800/30 transition-all duration-200 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <span className="text-xl">💬</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? 'اسأل أي سؤال إسلامي' : 'Ask Islamic questions'}
                          </p>
                        </div>
                      </Link>
                    </div>

                    {/* Settings */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                        {language === 'ar' ? 'الإعدادات' : 'Settings'}
                      </h3>
                      
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-100/80 dark:bg-gray-800/40">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                            {theme === 'dark' ? (
                              <span className="text-xl">☀️</span>
                            ) : (
                              <span className="text-xl">🌙</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {language === 'ar' ? 'المظهر' : 'Theme'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {theme === 'dark' 
                                ? (language === 'ar' ? 'مظلم' : 'Dark') 
                                : (language === 'ar' ? 'فاتح' : 'Light')
                              }
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleTheme}
                          className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700 border-0 text-gray-700 dark:text-gray-300"
                        >
                          {theme === 'dark' ? (
                            <span className="h-4 w-4 text-sm">☀️</span>
                          ) : (
                            <span className="h-4 w-4 text-sm">🌙</span>
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-100/80 dark:bg-gray-800/40">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🌍</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {language === 'ar' ? 'اللغة' : 'Language'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {language === 'ar' ? 'العربية' : 'English'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleLanguage}
                          className="h-10 px-3 rounded-xl bg-gray-200 dark:bg-gray-700 border-0 text-gray-700 dark:text-gray-300"
                        >
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {language === 'ar' ? 'EN' : 'عربي'}
                          </span>
                        </Button>
                      </div>
                    </div>

                    {/* Support */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                        {language === 'ar' ? 'الدعم' : 'Support'}
                      </h3>
                      
                      <Link
                        href="/donate"
                        className="flex items-center space-x-3 p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 to-red-600/10 border border-pink-200/20 dark:border-pink-800/20 hover:from-pink-500/20 hover:to-red-600/20 transition-all duration-200 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <span className="text-xl">❤️</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {language === 'ar' ? 'تبرع' : 'Donate'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? 'ادعم التطبيق' : 'Support the app'}
                          </p>
                        </div>
                      </Link>
                    </div>

                    {user && (
                      <div className="pt-4 border-t border-gray-200/20 dark:border-gray-800/20">
                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className="w-full h-12 rounded-2xl bg-red-100/80 dark:bg-red-900/20 hover:bg-red-200/80 dark:hover:bg-red-900/40 border-0 transition-all duration-200 text-red-600 dark:text-red-400"
                        >
                          <span className="w-5 h-5 mr-2">🚪</span>
                          {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;