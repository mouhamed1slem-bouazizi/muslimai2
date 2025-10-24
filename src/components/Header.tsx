'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/providers';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Globe,
  Clock,
  Calendar,
  Compass,
  BookOpen,
  Volume2,
  MessageCircle,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import SyncStatus from './SyncStatus';
import { logger } from '@/lib/logger';

const Header = () => {
  const { language, setLanguage, theme, setTheme } = useApp();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      icon: Clock, 
      label: language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times', 
      href: '/prayer-times' 
    },
    { 
      icon: Calendar, 
      label: language === 'ar' ? 'التقويم الإسلامي' : 'Islamic Calendar', 
      href: '/islamic-calendar' 
    },
    { 
      icon: Compass, 
      label: language === 'ar' ? 'اتجاه القبلة' : 'Qibla Direction', 
      href: '/qibla' 
    },
    { 
      icon: BookOpen, 
      label: language === 'ar' ? 'القرآن والموارد' : 'Quran & Resources', 
      href: '/resources' 
    },
    { 
      icon: Volume2, 
      label: language === 'ar' ? 'الصوتيات' : 'Audio', 
      href: '/audio' 
    },
    { 
      icon: MessageCircle, 
      label: language === 'ar' ? 'الذكاء الاصطناعي' : 'AI Assistant', 
      href: '/ai-chat' 
    },
  ];

  return (
    <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-emerald-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse hover:opacity-80 transition-opacity duration-200">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-amiri">
              {language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 rtl:space-x-reverse text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {/* Sync Status */}
            {user && <SyncStatus />}
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 rtl:space-x-reverse p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle language"
            >
              <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'ar' ? 'EN' : 'عر'}
              </span>
            </button>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  )}
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.displayName || 'Profile'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors duration-200"
                  title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                >
                  <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200"
                >
                  {language === 'ar' ? 'دخول' : 'Login'}
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  {language === 'ar' ? 'تسجيل' : 'Sign Up'}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;