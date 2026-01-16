import { memo, useCallback } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import styles from '../../styles/game.module.css';

export const LanguageSwitcher = memo(function LanguageSwitcher() {
  const { locale, setLanguage } = useLanguage();

  const handleToggle = useCallback(() => {
    setLanguage(locale === 'ja' ? 'en' : 'ja');
  }, [locale, setLanguage]);

  const label = locale === 'ja' ? 'JP' : 'EN';

  return (
    <button
      type="button"
      className={styles.languageSwitcher}
      onClick={handleToggle}
      aria-label={`Switch language to ${locale === 'ja' ? 'English' : 'Japanese'}`}
    >
      {label}
    </button>
  );
});
