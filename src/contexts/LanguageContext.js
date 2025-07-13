import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getKiswahiliTranslation, isKiswahiliMode } from '../localization/kiswahili';

// Create Language Context
const LanguageContext = createContext();

// Language Provider Component
export const LanguageProvider = ({ children }) => {
  const userState = useSelector((state) => state.user || {});
  const user = userState.user || null;
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isKiswahili, setIsKiswahili] = useState(false);

  // Update language based on user level
  useEffect(() => {
    if (user && user.level) {
      const kiswahiliMode = isKiswahiliMode(user.level);
      setIsKiswahili(kiswahiliMode);
      setCurrentLanguage(kiswahiliMode ? 'sw' : 'en');
    } else {
      // Default to English when no user is logged in
      setIsKiswahili(false);
      setCurrentLanguage('en');
    }
  }, [user]);

  // Translation function
  const t = (key, fallback = key) => {
    if (isKiswahili) {
      return getKiswahiliTranslation(key, fallback);
    }
    return fallback;
  };

  // Get subject name based on language
  const getSubjectName = (subject) => {
    if (isKiswahili) {
      return getKiswahiliTranslation(`subjects.${subject}`, subject);
    }
    return subject;
  };

  // Get class name based on language
  const getClassName = (classNumber) => {
    if (isKiswahili) {
      return getKiswahiliTranslation(`classes.${classNumber}`, `Darasa la ${classNumber}`);
    }
    return `Class ${classNumber}`;
  };

  // Format numbers in Kiswahili if needed
  const formatNumber = (number) => {
    if (isKiswahili && number <= 10) {
      return getKiswahiliTranslation(`numbers.${number}`, number.toString());
    }
    return number.toString();
  };

  // Get page title in appropriate language
  const getPageTitle = (englishTitle) => {
    if (isKiswahili) {
      const titleMap = {
        'Home': 'Nyumbani',
        'Dashboard': 'Dashibodi',
        'Hub': 'Kituo',
        'Quiz': 'Mtihani',
        'Quizzes': 'Mitihani',
        'Video Lessons': 'Masomo ya Video',
        'Study Materials': 'Vifaa vya Kusoma',
        'Ranking': 'Orodha ya Ushindi',
        'Profile': 'Wasifu',
        'Forum': 'Jukwaa',
        'Subscription': 'Uanachama',
        'Settings': 'Mipangilio'
      };
      return titleMap[englishTitle] || englishTitle;
    }
    return englishTitle;
  };

  // Get button text in appropriate language
  const getButtonText = (buttonKey) => {
    if (isKiswahili) {
      return getKiswahiliTranslation(`buttons.${buttonKey}`, buttonKey);
    }
    return buttonKey;
  };

  // Get status message in appropriate language
  const getStatusMessage = (statusKey) => {
    if (isKiswahili) {
      return getKiswahiliTranslation(`status.${statusKey}`, statusKey);
    }
    return statusKey;
  };

  // Get validation message in appropriate language
  const getValidationMessage = (validationKey) => {
    if (isKiswahili) {
      return getKiswahiliTranslation(`validation.${validationKey}`, validationKey);
    }
    return validationKey;
  };

  const value = {
    currentLanguage,
    isKiswahili,
    t,
    getSubjectName,
    getClassName,
    formatNumber,
    getPageTitle,
    getButtonText,
    getStatusMessage,
    getValidationMessage,
    setCurrentLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
