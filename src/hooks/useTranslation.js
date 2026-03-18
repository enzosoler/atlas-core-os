import { useState, useCallback } from 'react';
import { t, getLanguage, setLanguage, supportedLanguages } from '@/lib/i18n';

export const useTranslation = () => {
  const [language, setLang] = useState(getLanguage());

  const changeLanguage = useCallback((newLang) => {
    if (supportedLanguages.includes(newLang)) {
      setLanguage(newLang);
      setLang(newLang);
      // Trigger re-render by updating document
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLang }));
    }
  }, []);

  const translate = useCallback((key) => t(key, language), [language]);

  return {
    t: translate,
    language,
    setLanguage: changeLanguage,
    supportedLanguages,
  };
};