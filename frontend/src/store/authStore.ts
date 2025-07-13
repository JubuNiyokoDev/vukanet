import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'seller';
  storeId?: string;
  storeName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: {
        id: '1',
        email: 'admin@vukanet.com',
        name: 'Administrateur',
        role: 'admin',
        storeId: 'store1',
        storeName: 'Magasin Principal',
      },
      token: 'demo-token',
      isAuthenticated: true,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({isLoading: true});
        try {
          // Simulation d'un appel API
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Données simulées
          const userData: User = {
            id: '1',
            email,
            name: 'Administrateur',
            role: 'admin',
            storeId: 'store1',
            storeName: 'Magasin Principal',
          };

          const token = 'demo-jwt-token';

          set({
            user: userData,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({isLoading: false});
          throw error;
        }
      },

      logout: () => {
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
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);