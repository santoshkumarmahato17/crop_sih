/**
 * Google Maps JavaScript API Loader & Agricultural GIS Utilities.
 * Uses provided Google Cloud API Key with resilient singleton loading.
 */

export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAY8sFSqTvHJBcj0xLVuSxJCeRnGoF8P2c';

export interface AgroRegionPreset {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  zoom: number;
  primaryCrops: string;
}

export const AGRO_REGION_PRESETS: AgroRegionPreset[] = [
  {
    id: 'dindori',
    name: 'Dindori Valley Tomato & Vineyard Fields',
    state: 'Maharashtra',
    lat: 20.2185,
    lng: 73.842,
    zoom: 17,
    primaryCrops: 'Tomato, Grapes, Onions',
  },
  {
    id: 'punjab_cropland',
    name: 'Khanna Rural Wheat & Rice Fields',
    state: 'Punjab',
    lat: 30.718,
    lng: 76.192,
    zoom: 17,
    primaryCrops: 'Wheat, Basmati Paddy, Maize',
  },
  {
    id: 'pollachi_farms',
    name: 'Pollachi Rural Farmland & Crop Canopy',
    state: 'Tamil Nadu',
    lat: 10.742,
    lng: 77.015,
    zoom: 17,
    primaryCrops: 'Maize, Vegetables, Coconut',
  },
  {
    id: 'krishna_delta',
    name: 'Krishna Delta Rural Paddy & Cashew Basin',
    state: 'Andhra Pradesh',
    lat: 16.085,
    lng: 80.785,
    zoom: 17,
    primaryCrops: 'Rice Paddy, Cashew, Chilli',
  },
  {
    id: 'nira_sugarcane',
    name: 'Nira Basin Sugarcane & Cotton Farmlands',
    state: 'Maharashtra',
    lat: 18.065,
    lng: 74.455,
    zoom: 17,
    primaryCrops: 'Sugarcane, Bt Cotton, Soybean',
  },
];

let googleMapsPromise: Promise<any> | null = null;

/**
 * Dynamically loads the Google Maps JavaScript API SDK.
 * Resolves with `window.google.maps` once initialized.
 */
export function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  // If already loaded on window, resolve immediately
  if ((window as any).google && (window as any).google.maps) {
    return Promise.resolve((window as any).google.maps);
  }

  // Return existing singleton promise if in-flight
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existingScript = document.getElementById('google-maps-js-sdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if ((window as any).google?.maps) {
          resolve((window as any).google.maps);
        } else {
          reject(new Error('Google Maps script loaded but window.google.maps is undefined'));
        }
      });
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const callbackName = `__initGoogleMaps_${Date.now()}`;
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      if ((window as any).google?.maps) {
        resolve((window as any).google.maps);
      } else {
        reject(new Error('Google Maps callback invoked but window.google.maps is missing'));
      }
    };

    // Listen for auth failure callback dispatched by Google Maps
    (window as any).gm_authFailure = () => {
      console.warn('[Google Maps] Authentication failure or quota limit reached.');
      window.dispatchEvent(new CustomEvent('google-maps-auth-failure'));
    };

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_API_KEY
    )}&libraries=places,geometry,drawing&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = (err) => {
      googleMapsPromise = null;
      reject(err);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
