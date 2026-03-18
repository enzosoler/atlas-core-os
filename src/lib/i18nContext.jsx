import React, { createContext, useState, useEffect } from 'react';
import { translations } from '@/lib/i18n';

export const I18nContext = createContext();

/**
 * I18nContext — gerenciar idioma global + preferência persistida
 * PT-BR ou EN-US apenas
 */
export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    // 1. Check localStorage
    const saved = localStorage.getItem('atlas_locale');
    if (saved && ['pt-BR', 'en-US'].includes(saved)) return saved;
    
    // 2. Browser language
    const browserLang = navigator.language || 'en-US';
    if (browserLang.startsWith('pt')) return 'pt-BR';
    if (browserLang.startsWith('en')) return 'en-US';
    
    // 3. Default to en-US
    return 'en-US';
  });

  // Persist locale
  useEffect(() => {
    localStorage.setItem('atlas_locale', locale);
  }, [locale]);

  const t = (key) => {
    const parts = key.split('.');
    let value = translations[locale];
    for (const part of parts) {
      value = value?.[part];
    }
    return value || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}