import { useState, useEffect, useCallback } from 'react';
import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

export type SupportedLanguage = 'en' | 'ta' | 'hi' | 'mr';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  badge: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', badge: 'महाराष्ट्र' },
  { code: 'en', name: 'English', nativeName: 'English', badge: 'Global' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', badge: 'தமிழ்நாடு' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', badge: 'राष्ट्रीय' },
];

const dictionaries: Record<SupportedLanguage, any> = {
  en,
  ta,
  hi,
  mr,
};

export function useTranslation() {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('agrishield_preferred_lang');
    if (saved && (saved === 'en' || saved === 'ta' || saved === 'hi' || saved === 'mr')) {
      return saved as SupportedLanguage;
    }
    return 'mr'; // Maharashtra default
  });

  useEffect(() => {
    const handleLanguageEvent = (e: CustomEvent<{ language: SupportedLanguage }>) => {
      if (e.detail?.language) {
        setCurrentLanguageState(e.detail.language);
      }
    };

    window.addEventListener('agrishield:language_changed' as any, handleLanguageEvent);
    return () => {
      window.removeEventListener('agrishield:language_changed' as any, handleLanguageEvent);
    };
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    localStorage.setItem('agrishield_preferred_lang', lang);
    setCurrentLanguageState(lang);
    window.dispatchEvent(
      new CustomEvent('agrishield:language_changed', { detail: { language: lang } })
    );
  }, []);

  const t = useCallback(
    (keyPath: string): string => {
      const keys = keyPath.split('.');
      let current: any = dictionaries[currentLanguage];

      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          // Fallback to English
          let fallback: any = dictionaries['en'];
          for (const fbKey of keys) {
            if (fallback && typeof fallback === 'object' && fbKey in fallback) {
              fallback = fallback[fbKey];
            } else {
              return keyPath;
            }
          }
          return typeof fallback === 'string' ? fallback : keyPath;
        }
      }

      return typeof current === 'string' ? current : keyPath;
    },
    [currentLanguage]
  );

  return {
    t,
    currentLanguage,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
