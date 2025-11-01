'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/app/providers';
import toast from 'react-hot-toast';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const { language, theme } = useApp();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signup(data.email, data.password, data.name);
      toast.success(language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
      router.push('/profile');
    } catch (error: any) {
      toast.error(
        language === 'ar' 
          ? 'فشل في إنشاء الحساب. حاول مرة أخرى' 
          : 'Failed to create account. Please try again'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      toast.success(language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
      router.push('/profile');
    } catch (error: any) {
      toast.error(
        language === 'ar' 
          ? 'فشل في إنشاء الحساب بجوجل' 
          : 'Google signup failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className={`w-full max-w-md ${
        theme === 'dark' 
          ? 'bg-gray-800/80 backdrop-blur-lg border border-gray-700' 
          : 'bg-white/80 backdrop-blur-lg border border-white/20'
      } rounded-2xl shadow-2xl p-8`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/" 
            className={`inline-flex items-center gap-2 mb-4 text-sm ${
              theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            } transition-colors`}
          >
                        <span className="w-4 h-4">⬅️</span>
            {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
          
          <h1 className={`text-3xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            {language === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
          </h1>
          
          <p className={`${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {language === 'ar' 
              ? 'انضم إلى مجتمع المسلمين' 
              : 'Join the Muslim community'
            }
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <div className="relative">
                            <span className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${'text-gray-400'}`}>👤</span>
              <input
                {...register('name')}
                type="text"
                className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${
                  errors.name 
                    ? 'border-red-500' 
                    : theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <div className="relative">
                            <span className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${'text-gray-400'}`}>✉️</span>
              <input
                {...register('email')}
                type="email"
                className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${
                  errors.email 
                    ? 'border-red-500' 
                    : theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {language === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
                            <span className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${'text-gray-400'}`}>🔒</span>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`w-full ${language === 'ar' ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 rounded-lg border ${
                  errors.password 
                    ? 'border-red-500' 
                    : theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 ${
                  theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                } transition-colors`}
              >
                                {showPassword ? <span className="w-5 h-5">👁️‍🗨️</span> : <span className="w-5 h-5">👁️</span>}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            </label>
            <div className="relative">
              <span className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${'text-gray-400'}`}>🔒</span>
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                className={`w-full ${language === 'ar' ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 rounded-lg border ${
                  errors.confirmPassword 
                    ? 'border-red-500' 
                    : theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Confirm your password'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 ${
                  theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                } transition-colors`}
              >
                                {showConfirmPassword ? <span className="w-5 h-5">👁️‍🗨️</span> : <span className="w-5 h-5">👁️</span>}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading 
              ? (language === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating account...') 
              : (language === 'ar' ? 'إنشاء حساب' : 'Create Account')
            }
          </button>

          {/* Divider */}
          <div className="relative">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${
                theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
              }`}>
                {language === 'ar' ? 'أو' : 'OR'}
              </span>
            </div>
          </div>

          {/* Google Signup */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-3 py-3 rounded-lg border ${
              theme === 'dark' 
                ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } font-semibold focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {language === 'ar' ? 'إنشاء حساب بجوجل' : 'Continue with Google'}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {language === 'ar' ? 'لديك حساب بالفعل؟' : "Already have an account?"}{' '}
            <Link 
              href="/auth/login" 
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}