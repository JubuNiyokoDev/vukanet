import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import fr from './locales/fr.json';
import en from './locales/en.json';
import rn from './locales/rn.json';
import sw from './locales/sw.json';

const resources = {
  fr: {translation: fr},
  en: {translation: en},
  rn: {translation: rn},
  sw: {translation: sw},
};

// Get device language
const getSupportedLanguage = (lang: string) => {
  switch (lang) {
    case 'en':
      return 'en';
    case 'sw':
      return 'sw';
    case 'rn':
      return 'rn';
    case 'fr':
    default:
      return 'fr';
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: getSupportedLanguage('fr'),
  fallbackLng: 'fr',

  interpolation: {
    escapeValue: false,
  },

  react: {
    useSuspense: false,
  },
});

// Load saved language preference
AsyncStorage.getItem('userLanguage').then(savedLanguage => {
  if (savedLanguage && resources[savedLanguage as keyof typeof resources]) {
    i18n.changeLanguage(savedLanguage);
  }
});

export default i18n;