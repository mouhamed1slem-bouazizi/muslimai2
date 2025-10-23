'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Loader2, Check, X } from 'lucide-react';
import { useApp } from '@/app/providers';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentPosition, reverseGeocode, getCompleteLocation } from '@/lib/location';
import toast from 'react-hot-toast';

interface LocationSettingsProps {
  onLocationUpdate?: (location: { latitude: number; longitude: number; city: string; country: string }) => void;
}

export default function LocationSettings({ onLocationUpdate }: LocationSettingsProps) {
  const { language, theme } = useApp();
  const { user, userProfile, updateLocation } = useAuth();
  const [isDetecting, setIsDetecting] = useState(false);
  const [manualCity, setManualCity] = useState(userProfile?.city || '');
  const [manualCountry, setManualCountry] = useState(userProfile?.country || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  } | null>(null);

  useEffect(() => {
    if (userProfile?.latitude && userProfile?.longitude) {
      setCurrentLocation({
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
        city: userProfile.city || '',
        country: userProfile.country || ''
      });
    }
  }, [userProfile]);

  const handleGPSDetection = async () => {
    setIsDetecting(true);
    try {
      const location = await getCompleteLocation();
      if (location.city && location.country) {
        setCurrentLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
          country: location.country
        });
        setManualCity(location.city);
        setManualCountry(location.country);
      }
      
      toast.success(
        language === 'ar' 
          ? 'تم تحديد الموقع بنجاح' 
          : 'Location detected successfully'
      );
    } catch (error) {
      console.error('GPS detection failed:', error);
      toast.error(
        language === 'ar' 
          ? 'فشل في تحديد الموقع. تأكد من تفعيل خدمات الموقع' 
          : 'Failed to detect location. Please enable location services'
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const handleManualUpdate = async () => {
    if (!manualCity.trim() || !manualCountry.trim()) return;
    
    setIsUpdating(true);
    try {
      // Use the sync service through AuthContext
      await updateLocation(manualCity.trim(), manualCountry.trim());
      
      if (onLocationUpdate) {
        onLocationUpdate({
          latitude: 0, // Will be geocoded later if needed
          longitude: 0,
          city: manualCity.trim(),
          country: manualCountry.trim()
        });
      }

      // Success message is handled in AuthContext
    } catch (error) {
      console.error('Failed to save manual location:', error);
      // Error handling is now done in the AuthContext
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUseGPSLocation = async () => {
    if (!currentLocation) return;
    
    setIsUpdating(true);
    try {
      // Use the sync service through AuthContext
      await updateLocation(
        currentLocation.city,
        currentLocation.country,
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      if (onLocationUpdate) {
        onLocationUpdate(currentLocation);
      }

      // Success message is handled in AuthContext
    } catch (error) {
      console.error('Failed to save GPS location:', error);
      // Error handling is now done in the AuthContext
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`${
      theme === 'dark' 
        ? 'bg-gray-800/80 backdrop-blur-lg border border-gray-700' 
        : 'bg-white/80 backdrop-blur-lg border border-white/20'
    } rounded-2xl shadow-2xl p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <MapPin className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
        <h2 className={`text-xl font-semibold ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          {language === 'ar' ? 'إعدادات الموقع' : 'Location Settings'}
        </h2>
      </div>

      {/* Current Location Display */}
      {currentLocation && (
        <div className={`mb-6 p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Check className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`}>
              {language === 'ar' ? 'الموقع الحالي' : 'Current Location'}
            </span>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentLocation.city}, {currentLocation.country}
          </p>
          {currentLocation.latitude !== 0 && currentLocation.longitude !== 0 && (
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
            </p>
          )}
        </div>
      )}

      {/* GPS Detection */}
      <div className="mb-6">
        <h3 className={`text-lg font-medium mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          {language === 'ar' ? 'تحديد الموقع تلقائياً' : 'Automatic Location Detection'}
        </h3>
        <button
          onClick={handleGPSDetection}
          disabled={isDetecting}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
          } disabled:cursor-not-allowed`}
        >
          {isDetecting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          {isDetecting 
            ? (language === 'ar' ? 'جاري تحديد الموقع...' : 'Detecting Location...')
            : (language === 'ar' ? 'استخدام GPS' : 'Use GPS')
          }
        </button>
        
        {currentLocation && currentLocation.latitude !== 0 && (
          <button
            onClick={handleUseGPSLocation}
            disabled={isUpdating}
            className={`w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              theme === 'dark'
                ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600'
                : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400'
            } disabled:cursor-not-allowed`}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {language === 'ar' ? 'حفظ الموقع المحدد' : 'Save Detected Location'}
          </button>
        )}
      </div>

      {/* Manual Location Input */}
      <div>
        <h3 className={`text-lg font-medium mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          {language === 'ar' ? 'إدخال الموقع يدوياً' : 'Manual Location Entry'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {language === 'ar' ? 'المدينة' : 'City'}
            </label>
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل اسم المدينة' : 'Enter city name'}
              className={`w-full px-4 py-3 rounded-lg border transition-all ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {language === 'ar' ? 'الدولة' : 'Country'}
            </label>
            <input
              type="text"
              value={manualCountry}
              onChange={(e) => setManualCountry(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل اسم الدولة' : 'Enter country name'}
              className={`w-full px-4 py-3 rounded-lg border transition-all ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
          
          <button
            onClick={handleManualUpdate}
            disabled={isUpdating || !manualCity.trim() || !manualCountry.trim()}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              theme === 'dark'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-600'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-400'
            } disabled:cursor-not-allowed`}
          >
            {isUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {isUpdating 
              ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
              : (language === 'ar' ? 'حفظ الموقع' : 'Save Location')
            }
          </button>
        </div>
      </div>
    </div>
  );
}