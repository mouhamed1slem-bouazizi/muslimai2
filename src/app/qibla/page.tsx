'use client';

import React, { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import { useApp } from '@/app/providers';
import { logger } from '@/lib/logger';
import { getCurrentPosition, calculateDistance, formatCoordinates, isValidCoordinates } from '@/lib/location';
import { fetchQiblaDirection, fetchQiblaCompass, degreesToCompass } from '@/lib/aladhan-qibla-api';

// Kaaba coordinates (Masjid al-Haram)
const KAABA = { lat: 21.422487, lng: 39.826206 };

declare global {
  interface Window { google: any }
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is undefined'));
      return;
    }
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    const scriptId = 'google-maps-js';
    if (document.getElementById(scriptId)) {
      // Already loading
      const check = () => {
        if (window.google && window.google.maps) resolve();
        else setTimeout(check, 300);
      };
      check();
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}

export default function QiblaPage() {
  const { language, theme, location: appLocation } = useApp();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [qiblaDeg, setQiblaDeg] = useState<number | null>(null);
  const [compassText, setCompassText] = useState<string>('');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const orientationHandlerRef = useRef<any>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [liveCompassEnabled, setLiveCompassEnabled] = useState<boolean>(false);
  const [compassPermissionError, setCompassPermissionError] = useState<string>('');

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    // Initialize center from app location or fallback to Mecca
    const initialCenter = appLocation
      ? { lat: appLocation.latitude, lng: appLocation.longitude }
      : { lat: KAABA.lat, lng: KAABA.lng };
    setCenter(initialCenter);
  }, [appLocation]);

  useEffect(() => {
    // Load Google Maps and init map
    if (!apiKey) {
      setError(language === 'ar' ? 'لم يتم ضبط مفتاح خرائط جوجل' : 'Google Maps API key is missing');
      return;
    }
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!mapRef.current) return;
        const m = new window.google.maps.Map(mapRef.current, {
          center: center || KAABA,
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        setMap(m);

        const mk = new window.google.maps.Marker({
          position: center || KAABA,
          map: m,
          draggable: true,
          title: 'Selected Location',
        });
        setMarker(mk);

        // Marker drag updates
        mk.addListener('dragend', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          handleLocationChange(lat, lng);
        });

        // Map click updates
        m.addListener('click', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          handleLocationChange(lat, lng);
        });

        if (center) {
          m.setCenter(center);
          mk.setPosition(center);
          fetchAndUpdateQibla(center.lat, center.lng);
        }
      })
      .catch((err) => {
        logger.warn('Google Maps load error:', err);
        setError(language === 'ar' ? 'فشل تحميل خرائط جوجل' : 'Failed to load Google Maps');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, center?.lat, center?.lng, language]);

  const handleLocationChange = (lat: number, lng: number) => {
    if (!isValidCoordinates(lat, lng)) return;
    const newCenter = { lat, lng };
    setCenter(newCenter);
    if (map) map.setCenter(newCenter);
    if (marker) marker.setPosition(newCenter);
    fetchAndUpdateQibla(lat, lng);
  };

  const useMyLocation = async () => {
    try {
      setLoading(true);
      const pos = await getCurrentPosition();
      handleLocationChange(pos.latitude, pos.longitude);
    } catch (err) {
      logger.warn('Geolocation error:', err);
      setError(language === 'ar' ? 'تعذر الحصول على الموقع' : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndUpdateQibla = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setError('');

      const [dirRes, compRes] = await Promise.all([
        fetchQiblaDirection(lat, lng),
        fetchQiblaCompass(lat, lng),
      ]);

      if (dirRes.success && typeof dirRes.direction === 'number') {
        setQiblaDeg(dirRes.direction);
        setDistanceKm(calculateDistance(lat, lng, KAABA.lat, KAABA.lng));
      }
      if (compRes.success && compRes.compass) {
        setCompassText(compRes.compass);
      } else if (dirRes.success && typeof dirRes.direction === 'number') {
        setCompassText(degreesToCompass(dirRes.direction));
      } else {
        setCompassText('');
      }
    } catch (err) {
      logger.warn('Qibla fetch error:', err);
      setError(language === 'ar' ? 'حدث خطأ أثناء جلب اتجاه القبلة' : 'Error fetching Qibla direction');
    } finally {
      setLoading(false);
    }
  };

  // Live compass via device orientation
  const getHeadingFromEvent = (e: any): number | null => {
    try {
      if (typeof e.webkitCompassHeading === 'number') {
        // iOS Safari
        return e.webkitCompassHeading as number;
      }
      const alpha = typeof e.alpha === 'number' ? e.alpha : null;
      if (alpha != null) {
        let heading = 360 - alpha; // normalize to compass heading
        const angle = (screen.orientation && typeof screen.orientation.angle === 'number')
          ? screen.orientation.angle
          : (typeof (window as any).orientation === 'number' ? (window as any).orientation : 0);
        heading = (heading + (angle || 0) + 360) % 360;
        return heading;
      }
      return null;
    } catch {
      return null;
    }
  };

  const startLiveCompass = async () => {
    setCompassPermissionError('');
    try {
      const D = (window as any).DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function') {
        const resp = await D.requestPermission();
        if (resp !== 'granted') {
          setCompassPermissionError(language === 'ar' ? 'مطلوب إذن للوصول إلى المستشعرات' : 'Permission required to access sensors');
          return;
        }
      }
      const handler = (e: any) => {
        const heading = getHeadingFromEvent(e);
        if (typeof heading === 'number') setDeviceHeading(heading);
      };
      orientationHandlerRef.current = handler;
      window.addEventListener('deviceorientation', handler, true);
      setLiveCompassEnabled(true);
    } catch (err) {
      logger.warn('Device orientation setup error:', err);
      setCompassPermissionError(language === 'ar' ? 'تعذر تفعيل البوصلة' : 'Failed to enable live compass');
    }
  };

  const stopLiveCompass = () => {
    if (orientationHandlerRef.current) {
      window.removeEventListener('deviceorientation', orientationHandlerRef.current, true);
      orientationHandlerRef.current = null;
    }
    setLiveCompassEnabled(false);
  };

  useEffect(() => {
    return () => {
      // Cleanup listener if enabled
      try { stopLiveCompass(); } catch (_) {}
    };
  }, []);

  const arrowRotation = qiblaDeg != null
    ? (liveCompassEnabled && deviceHeading != null
        ? (qiblaDeg - deviceHeading + 360) % 360
        : qiblaDeg)
    : 0;

  const titleText = language === 'ar' ? 'اتجاه القبلة' : 'Qibla Direction';
  const subtitleText = language === 'ar' ? 'اختر موقعك على الخريطة أو استخدم موقعك الحالي' : 'Pick a location on the map or use your current location';

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-amiri">{titleText}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{subtitleText}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Map */}
          <div className={`${theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-white/20'} rounded-2xl shadow-2xl p-3 border lg:col-span-2`}>
            <div ref={mapRef} style={{ width: '100%', height: '420px', borderRadius: '12px' }} />
            <div className="mt-3 flex gap-2">
              <button
                onClick={useMyLocation}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                disabled={loading}
              >
                {language === 'ar' ? 'استخدم موقعي' : 'Use My Location'}
              </button>
              <button
                onClick={() => handleLocationChange(KAABA.lat, KAABA.lng)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                disabled={loading}
              >
                {language === 'ar' ? 'مكة المكرمة' : 'Mecca'}
              </button>
            </div>
          </div>

          {/* Info / Compass */}
          <div className={`${theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-white/20'} rounded-2xl shadow-2xl p-6 border`}>
            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'الإحداثيات المختارة' : 'Selected Coordinates'}
              </div>
              <div className="text-lg font-mono text-gray-900 dark:text-white">
                {center ? formatCoordinates(center.lat, center.lng, 5) : (language === 'ar' ? 'غير محدد' : 'Not set')}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'اتجاه القبلة' : 'Qibla Bearing'}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {qiblaDeg != null ? `${qiblaDeg.toFixed(2)}° (${compassText || (language === 'ar' ? 'غير متاح' : 'N/A')})` : (language === 'ar' ? 'غير متاح' : 'N/A')}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'المسافة إلى الكعبة' : 'Distance to Kaaba'}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {distanceKm != null ? `${distanceKm.toFixed(2)} km` : (language === 'ar' ? 'غير متاح' : 'N/A')}
              </div>
            </div>

            {/* Live Compass toggle */}
            <div className="mb-4">
              <button
                onClick={liveCompassEnabled ? stopLiveCompass : startLiveCompass}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                {liveCompassEnabled
                  ? (language === 'ar' ? 'أوقف البوصلة الحية' : 'Disable Live Compass')
                  : (language === 'ar' ? 'فعّل البوصلة الحية' : 'Enable Live Compass')}
              </button>
              {liveCompassEnabled && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {language === 'ar'
                    ? `اتجاه جهازك: ${Math.round(deviceHeading ?? 0)}°`
                    : `Device heading: ${Math.round(deviceHeading ?? 0)}°`}
                </div>
              )}
              {compassPermissionError && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">{compassPermissionError}</div>
              )}
            </div>

            {/* Compass UI */}
            <div className="flex items-center justify-center">
              <div className="relative w-56 h-56 rounded-full border-4 border-emerald-500 dark:border-emerald-400 flex items-center justify-center">
                {/* Cardinal directions */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs text-gray-700 dark:text-gray-300">N</div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-700 dark:text-gray-300">S</div>
                <div className="absolute top-1/2 -translate-y-1/2 left-1 text-xs text-gray-700 dark:text-gray-300">W</div>
                <div className="absolute top-1/2 -translate-y-1/2 right-1 text-xs text-gray-700 dark:text-gray-300">E</div>
                {/* Arrow */}
                <div className="absolute w-0 h-0 border-l-8 border-r-8 border-b-[64px] border-l-transparent border-r-transparent border-b-red-600" style={{ transform: `rotate(${arrowRotation}deg)` }} />
              </div>
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}