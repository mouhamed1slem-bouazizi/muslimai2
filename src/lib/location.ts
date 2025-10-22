export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  accuracy?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

/**
 * Get current position using browser's geolocation API
 */
export const getCurrentPosition = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser'
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = 'Unknown error occurred';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        
        reject({
          code: error.code,
          message,
        });
      },
      options
    );
  });
};

/**
 * Get city and country from coordinates using reverse geocoding
 */
export const reverseGeocode = async (
  latitude: number, 
  longitude: number
): Promise<{ city: string; country: string }> => {
  try {
    // Using BigDataCloud's free reverse geocoding API
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }
    
    const data = await response.json();
    
    return {
      city: data.city || data.locality || data.principalSubdivision || 'Unknown City',
      country: data.countryName || 'Unknown Country',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    
    // Fallback: try alternative API
    try {
      const fallbackResponse = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&limit=1&no_annotations=1`
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const result = fallbackData.results[0];
        
        if (result) {
          return {
            city: result.components.city || result.components.town || result.components.village || 'Unknown City',
            country: result.components.country || 'Unknown Country',
          };
        }
      }
    } catch (fallbackError) {
      console.error('Fallback geocoding error:', fallbackError);
    }
    
    // Final fallback
    return {
      city: 'Unknown City',
      country: 'Unknown Country',
    };
  }
};

/**
 * Get complete location data (coordinates + address)
 */
export const getCompleteLocation = async (): Promise<LocationData> => {
  try {
    const position = await getCurrentPosition();
    const address = await reverseGeocode(position.latitude, position.longitude);
    
    return {
      ...position,
      ...address,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (latitude: number, longitude: number): boolean => {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (
  latitude: number,
  longitude: number,
  precision: number = 4
): string => {
  const lat = latitude.toFixed(precision);
  const lon = longitude.toFixed(precision);
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'W';
  
  return `${Math.abs(parseFloat(lat))}°${latDir}, ${Math.abs(parseFloat(lon))}°${lonDir}`;
};

/**
 * Get user's timezone based on coordinates
 */
export const getTimezone = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    // Using browser's Intl API as primary method
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone;
  } catch (error) {
    console.error('Timezone detection error:', error);
    return 'UTC';
  }
};