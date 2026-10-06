import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';
import { Language } from '../types';

interface I18nContextType {
  language: Language;
  direction: 'ltr' | 'rtl';
  setLanguage: (lang: Language) => void;
  t: typeof translations.fr;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (dateStr: string) => string;
  formatDateTime: (dateStr: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('kriya_lang');
    return (saved === 'fr' || saved === 'ar' || saved === 'en') ? saved : 'fr';
  });

  const direction: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('kriya_lang', lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    if (direction === 'rtl') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [language, direction]);

  const currentTranslations = translations[language] || translations.fr;

  const formatCurrency = (amount: number, currency: string = 'MAD'): string => {
    const rounded = Math.round(amount * 100) / 100;
    const formattedNum = new Intl.NumberFormat(language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-MA' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);

    if (language === 'ar') {
      return `${formattedNum} ${currency === 'MAD' ? 'د.م.' : currency}`;
    }
    return `${formattedNum} ${currency}`;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat(language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-MA' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat(language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-MA' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        direction,
        setLanguage,
        t: currentTranslations,
        formatCurrency,
        formatDate,
        formatDateTime,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
