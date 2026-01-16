import { useCallback } from 'react';
import { getLocale, setLocale, locales, baseLocale } from '../paraglide/runtime.js';

export type Locale = (typeof locales)[number];

interface UseLanguageReturn {
  locale: Locale;
  locales: readonly Locale[];
  baseLocale: Locale;
  setLanguage: (locale: Locale) => void;
}

/**
 * Hook to get and set the current locale.
 *
 * Note: setLanguage triggers a page reload to ensure all components
 * render with the new locale. This is intentional because:
 * 1. Language switching is an infrequent user action
 * 2. Paraglide uses a global variable for locale state
 * 3. Page reload guarantees all components (including combat log) use new locale
 */
export function useLanguage(): UseLanguageReturn {
  const locale = getLocale() as Locale;

  const setLanguage = useCallback((newLocale: Locale) => {
    setLocale(newLocale, { reload: true });
  }, []);

  return {
    locale,
    locales: locales as readonly Locale[],
    baseLocale: baseLocale as Locale,
    setLanguage,
  };
}
