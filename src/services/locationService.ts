import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { create } from 'zustand';

// Google Maps API Key from the AstroParihar project
export const GOOGLE_MAPS_API_KEY = 'AIzaSyA-CXsyKpvFtpidpOkhOiIQGfXFO3O5lKA';

const STORAGE_LOCATION_KEY = 'astroparihar_customer_location';

export interface CustomerLocation {
  city: string;
  state?: string;
  country?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  source: 'gps' | 'ip' | 'cached' | 'default';
  updatedAt: number;
}

export const DEFAULT_LOCATION: CustomerLocation = {
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  formattedAddress: 'Mumbai, Maharashtra, India',
  latitude: 19.076,
  longitude: 72.8777,
  source: 'default',
  updatedAt: Date.now(),
};

/**
 * Parses Google Geocoding API address components into a clean city name
 */
export function extractCityFromGoogleGeocode(results: any[]): {
  city: string;
  state?: string;
  country?: string;
  formattedAddress?: string;
} {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return { city: 'Mumbai', state: 'Maharashtra', country: 'India' };
  }

  let city = '';
  let state = '';
  let country = '';

  for (const r of results) {
    for (const comp of r.address_components || []) {
      const types: string[] = comp.types || [];
      if (!city && (types.includes('locality') || types.includes('postal_town'))) {
        city = comp.long_name;
      }
      if (!state && types.includes('administrative_area_level_1')) {
        state = comp.long_name;
      }
      if (!country && types.includes('country')) {
        country = comp.long_name;
      }
    }
  }

  // Secondary fallback: administrative_area_level_2 or sublocality if locality not present
  if (!city) {
    for (const r of results) {
      for (const comp of r.address_components || []) {
        const types: string[] = comp.types || [];
        if (types.includes('administrative_area_level_2') || types.includes('sublocality_level_1')) {
          city = comp.long_name;
          break;
        }
      }
      if (city) break;
    }
  }

  return {
    city: city || 'Mumbai',
    state,
    country,
    formattedAddress: results[0]?.formatted_address || `${city || 'Mumbai'}, India`,
  };
}

/**
 * Reverse-geocode GPS coordinates to real city name using Google Maps API
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<CustomerLocation> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const data = await res.json();
    if (data.status === 'OK' && Array.isArray(data.results)) {
      const parsed = extractCityFromGoogleGeocode(data.results);
      return {
        city: parsed.city,
        state: parsed.state,
        country: parsed.country,
        formattedAddress: parsed.formattedAddress,
        latitude: lat,
        longitude: lng,
        source: 'gps',
        updatedAt: Date.now(),
      };
    }
  } catch (err) {
    console.warn('Google reverse geocode failed, falling back:', err);
  }

  return {
    city: 'Mumbai',
    latitude: lat,
    longitude: lng,
    source: 'gps',
    updatedAt: Date.now(),
  };
}

/**
 * Fallback to IP-based location if device GPS is denied or unavailable
 */
export async function fetchIpLocation(): Promise<CustomerLocation | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.city) {
        return {
          city: data.city,
          state: data.region,
          country: data.country_name,
          formattedAddress: `${data.city}, ${data.region || ''}, ${data.country_name || ''}`.replace(/,\s*,/g, ','),
          latitude: data.latitude,
          longitude: data.longitude,
          source: 'ip',
          updatedAt: Date.now(),
        };
      }
    }
  } catch (_e) {
    // Ignore IP network failure
  }
  return null;
}

interface LocationStoreState {
  location: CustomerLocation;
  isLoading: boolean;
  isPermissionGranted: boolean;
  error: string | null;
  loadCached: () => Promise<void>;
  detectLocation: (force?: boolean) => Promise<CustomerLocation>;
  setLocationManually: (city: string) => Promise<void>;
}

export const useLocationStore = create<LocationStoreState>((set, get) => ({
  location: DEFAULT_LOCATION,
  isLoading: false,
  isPermissionGranted: false,
  error: null,

  loadCached: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_LOCATION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CustomerLocation;
        set({ location: parsed });
      }
    } catch {}
  },

  detectLocation: async (force = false) => {
    const current = get().location;
    // If we have a fresh GPS location from less than 15 minutes ago and not forced, reuse it
    if (!force && current.source === 'gps' && Date.now() - current.updatedAt < 15 * 60 * 1000) {
      return current;
    }

    set({ isLoading: true, error: null });

    try {
      // 1. Check or request foreground permissions
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        perm = await Location.requestForegroundPermissionsAsync();
      }

      const granted = perm.status === 'granted';
      set({ isPermissionGranted: granted });

      if (granted) {
        // 2. Fetch high/balanced GPS position
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 3. Reverse geocode via Google Maps API
        const loc = await reverseGeocodeCoords(lat, lng);
        set({ location: loc, isLoading: false });

        try {
          await AsyncStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(loc));
        } catch {}

        return loc;
      }
    } catch (gpsError: any) {
      console.warn('GPS location fetch failed:', gpsError?.message);
    }

    // 4. Fallback to IP geolocation if GPS was denied or failed
    try {
      const ipLoc = await fetchIpLocation();
      if (ipLoc) {
        set({ location: ipLoc, isLoading: false });
        try {
          await AsyncStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(ipLoc));
        } catch {}
        return ipLoc;
      }
    } catch {}

    // 5. Keep current or default
    set({ isLoading: false });
    return get().location;
  },

  setLocationManually: async (city: string) => {
    const loc: CustomerLocation = {
      city: city.trim(),
      formattedAddress: city.trim(),
      source: 'cached',
      updatedAt: Date.now(),
    };
    set({ location: loc });
    try {
      await AsyncStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(loc));
    } catch {}
  },
}));
