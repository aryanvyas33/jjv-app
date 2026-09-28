import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';

const translations = { en, hi };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('jjv_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('jjv_language', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = (keyPath, replacements = {}) => {
    const keys = keyPath.split('.');
    let value = translations[lang];
    for (const k of keys) {
      if (!value || value[k] === undefined) {
        // Fallback to English
        let fallback = translations.en;
        for (const fk of keys) {
          if (!fallback || fallback[fk] === undefined) return keyPath;
          fallback = fallback[fk];
        }
        value = fallback;
        break;
      }
      value = value[k];
    }

    if (typeof value === 'string') {
      let result = value;
      for (const [k, v] of Object.entries(replacements)) {
        result = result.replace(`{${k}}`, v);
      }
      return result;
    }
    return value || keyPath;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
