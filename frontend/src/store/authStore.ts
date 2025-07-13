import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {apiService} from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SELLER';
  storeId?: string;
  storeName?: string;
  language: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
    storeId?: string;
    language?: string;
  }) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  updateProfile: (data: {
    name?: string;
    language?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({isLoading: true});
        try {
          const response = await apiService.login(email, password);
          
          const userData: User = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
            storeId: response.user.storeId,
            storeName: response.user.storeName,
            language: response.user.language,
          };

          await AsyncStorage.setItem('authToken', response.token);

          set({
            user: userData,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({isLoading: false});
          throw error;
        }
      },

      register: async (userData) => {
        set({isLoading: true});
        try {
          const response = await apiService.register(userData);
          
          const user: User = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
            storeId: response.user.storeId,
            storeName: response.user.storeName,
            language: response.user.language,
          };

          await AsyncStorage.setItem('authToken', response.token);

          set({
            user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({isLoading: false});
          throw error;
        }
      },

      logout: async () => {
        await AsyncStorage.removeItem('authToken');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({user});
      },

      setToken: (token: string) => {
        set({token});
      },

      updateProfile: async (data) => {
        set({isLoading: true});
        try {
          const response = await apiService.updateProfile(data);
          
          const updatedUser: User = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
            storeId: response.user.storeId,
            storeName: response.user.store?.name,
            language: response.user.language,
          };

          set({
            user: updatedUser,
            isLoading: false,
          });
        } catch (error) {
          set({isLoading: false});
          throw error;
        }
      },

      forgotPassword: async (email: string) => {
        set({isLoading: true});
        try {
          await apiService.forgotPassword(email);
          set({isLoading: false});
        } catch (error) {
          set({isLoading: false});
          throw error;
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({isLoading: true});
        try {
          await apiService.resetPassword(token, password);
          set({isLoading: false});
        } catch (error) {
          set({isLoading: false});
          throw error;
        }
      },

      loadUserFromStorage: async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            set({token});
            const response = await apiService.getCurrentUser();
            
            const userData: User = {
              id: response.user.id,
              email: response.user.email,
              name: response.user.name,
              role: response.user.role,
              storeId: response.user.storeId,
              storeName: response.user.store?.name,
              language: response.user.language,
            };

            set({
              user: userData,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error('Failed to load user from storage:', error);
          await AsyncStorage.removeItem('authToken');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);