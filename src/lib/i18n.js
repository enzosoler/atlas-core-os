import ptBR from './translations/pt-BR.json';
import enUS from './translations/en-US.json';

export const translations = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

export const DEFAULT_LANGUAGE = 'pt-BR';

export const getLanguage = () => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  return localStorage.getItem('language') || DEFAULT_LANGUAGE;
};

export const setLanguage = (lang) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
  }
};

export const t = (key, lang = getLanguage()) => {
  const keys = key.split('.');
  let value = translations[lang] || translations[DEFAULT_LANGUAGE];
  
  for (const k of keys) {
    value = value?.[k];
    if (!value) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return value;
};

export const supportedLanguages = ['pt-BR', 'en-US'];