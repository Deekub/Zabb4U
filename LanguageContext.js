import React, { createContext, useState, useContext } from 'react';
import translations from './locales/translations'; // หรือ path ที่ถูกต้องไปยังไฟล์ภาษาของคุณ
import th from './locales/th';
import en from './locales/en';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('th'); // ภาษาเริ่มต้น
  const messages = {
    en: en,
    th: th,
  };

  const changeLanguage = (newLocale) => {
    setLocale(newLocale);
  };

  const translate = (key) => {
    return messages[locale][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);