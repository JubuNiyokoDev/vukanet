import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  darkMode: boolean;
  notifications: boolean;
  autoBackup: boolean;
  offlineMode: boolean;
  biometricAuth: boolean;
  autoSync: boolean;
  language: string;
  toggleDarkMode: () => void;
  toggleNotifications: () => void;
  toggleAutoBackup: () => void;
  toggleOfflineMode: () => void;
  toggleBiometricAuth: () => void;
  toggleAutoSync: () => void;
  setLanguage: (language: string) => void;
  updateSetting: (key: string, value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      notifications: true,
      autoBackup: true,
      offlineMode: true,
      biometricAuth: false,
      autoSync: true,
      language: 'fr',

      toggleDarkMode: () => {
        set(state => ({darkMode: !state.darkMode}));
      },

      toggleNotifications: () => {
        set(state => ({notifications: !state.notifications}));
      },

      toggleAutoBackup: () => {
        set(state => ({autoBackup: !state.autoBackup}));
      },

      toggleOfflineMode: () => {
        set(state => ({offlineMode: !state.offlineMode}));
      },

      toggleBiometricAuth: () => {
        set(state => ({biometricAuth: !state.biometricAuth}));
      },

      toggleAutoSync: () => {
        set(state => ({autoSync: !state.autoSync}));
      },

      setLanguage: (language: string) => {
        set({language});
      },

      updateSetting: (key: string, value: boolean) => {
        set(state => ({...state, [key]: value}));
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);