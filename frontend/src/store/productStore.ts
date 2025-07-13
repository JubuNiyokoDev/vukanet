import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Product {
  id: string;
  name: string;
  unitsPerPackage: number;
  currentStock: number;
  packagePurchasePrice: number;
  unitSalePrice: number;
  packageSalePrice: number;
  minStockAlert: number;
  category: string;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductState {
  products: Product[];
  isLoading: boolean;
  addProduct: (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsByStore: (storeId: string) => Product[];
  getLowStockProducts: (storeId?: string) => Product[];
  updateStock: (id: string, quantity: number) => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [
        {
          id: '1',
          name: 'Écouteurs Bluetooth',
          unitsPerPackage: 12,
          currentStock: 3,
          packagePurchasePrice: 60000,
          unitSalePrice: 6000,
          packageSalePrice: 70000,
          minStockAlert: 5,
          category: 'Électronique',
          storeId: 'store1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Chargeur USB-C',
          unitsPerPackage: 20,
          currentStock: 15,
          packagePurchasePrice: 40000,
          unitSalePrice: 2500,
          packageSalePrice: 48000,
          minStockAlert: 10,
          category: 'Électronique',
          storeId: 'store1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Câble HDMI',
          unitsPerPackage: 10,
          currentStock: 2,
          packagePurchasePrice: 25000,
          unitSalePrice: 3000,
          packageSalePrice: 28000,
          minStockAlert: 5,
          category: 'Électronique',
          storeId: 'store1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Souris sans fil',
          unitsPerPackage: 8,
          currentStock: 12,
          packagePurchasePrice: 32000,
          unitSalePrice: 4500,
          packageSalePrice: 35000,
          minStockAlert: 6,
          category: 'Électronique',
          storeId: 'store1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '5',
          name: 'Clavier mécanique',
          unitsPerPackage: 5,
          currentStock: 1,
          packagePurchasePrice: 75000,
          unitSalePrice: 18000,
          packageSalePrice: 85000,
          minStockAlert: 3,
          category: 'Électronique',
          storeId: 'store1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      isLoading: false,

      addProduct: product => {
        const newProduct: Product = {
          ...product,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({
          products: [...state.products, newProduct],
        }));
      },

      updateProduct: (id, updates) => {
        set(state => ({
          products: state.products.map(product =>
            product.id === id
              ? {...product, ...updates, updatedAt: new Date().toISOString()}
              : product,
          ),
        }));
      },

      deleteProduct: id => {
        set(state => ({
          products: state.products.filter(product => product.id !== id),
        }));
      },

      getProductById: id => {
        return get().products.find(product => product.id === id);
      },

      getProductsByStore: storeId => {
        return get().products.filter(product => product.storeId === storeId);
      },

      getLowStockProducts: storeId => {
        const products = storeId
          ? get().products.filter(product => product.storeId === storeId)
          : get().products;
        return products.filter(
          product => product.currentStock <= product.minStockAlert,
        );
      },

      updateStock: (id, quantity) => {
        set(state => ({
          products: state.products.map(product =>
            product.id === id
              ? {
                  ...product,
                  currentStock: Math.max(0, product.currentStock + quantity),
                  updatedAt: new Date().toISOString(),
                }
              : product,
          ),
        }));
      },
    }),
    {
      name: 'product-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);