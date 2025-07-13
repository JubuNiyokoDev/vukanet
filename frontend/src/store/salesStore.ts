import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  sellerId: string;
  sellerName: string;
  storeId: string;
  clientName?: string;
  isDebt: boolean;
  debtAmount?: number;
  createdAt: string;
}

interface SalesState {
  sales: Sale[];
  isLoading: boolean;
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => void;
  getSalesByStore: (storeId: string) => Sale[];
  getSalesByDate: (date: string, storeId?: string) => Sale[];
  getTotalSales: (storeId?: string) => number;
  getTotalDebts: (storeId?: string) => number;
  getTopSellingProducts: (
    storeId?: string,
  ) => {productName: string; quantity: number}[];
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      sales: [
        {
          id: '1',
          productId: '1',
          productName: 'Écouteurs Bluetooth',
          quantity: 2,
          unitPrice: 6000,
          totalAmount: 12000,
          sellerId: '1',
          sellerName: 'Administrateur',
          storeId: 'store1',
          clientName: 'Marie Dubois',
          isDebt: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          productId: '2',
          productName: 'Chargeur USB-C',
          quantity: 1,
          unitPrice: 2500,
          totalAmount: 2500,
          sellerId: '1',
          sellerName: 'Administrateur',
          storeId: 'store1',
          isDebt: true,
          debtAmount: 2500,
          clientName: 'Pierre Martin',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          productId: '4',
          productName: 'Souris sans fil',
          quantity: 3,
          unitPrice: 4500,
          totalAmount: 13500,
          sellerId: '1',
          sellerName: 'Administrateur',
          storeId: 'store1',
          clientName: 'Jean Dupont',
          isDebt: false,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: '4',
          productId: '3',
          productName: 'Câble HDMI',
          quantity: 2,
          unitPrice: 3000,
          totalAmount: 6000,
          sellerId: '1',
          sellerName: 'Administrateur',
          storeId: 'store1',
          isDebt: true,
          debtAmount: 6000,
          clientName: 'Sophie Laurent',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
        },
      ],
      isLoading: false,

      addSale: sale => {
        const newSale: Sale = {
          ...sale,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          sales: [...state.sales, newSale],
        }));
      },

      getSalesByStore: storeId => {
        return get().sales.filter(sale => sale.storeId === storeId);
      },

      getSalesByDate: (date, storeId) => {
        const sales = storeId
          ? get().sales.filter(sale => sale.storeId === storeId)
          : get().sales;
        return sales.filter(sale => sale.createdAt.startsWith(date));
      },

      getTotalSales: storeId => {
        const sales = storeId
          ? get().sales.filter(sale => sale.storeId === storeId)
          : get().sales;
        return sales.reduce((total, sale) => total + sale.totalAmount, 0);
      },

      getTotalDebts: storeId => {
        const sales = storeId
          ? get().sales.filter(sale => sale.storeId === storeId)
          : get().sales;
        return sales
          .filter(sale => sale.isDebt)
          .reduce((total, sale) => total + (sale.debtAmount || 0), 0);
      },

      getTopSellingProducts: storeId => {
        const sales = storeId
          ? get().sales.filter(sale => sale.storeId === storeId)
          : get().sales;

        const productSales = sales.reduce((acc, sale) => {
          const existing = acc.find(p => p.productName === sale.productName);
          if (existing) {
            existing.quantity += sale.quantity;
          } else {
            acc.push({productName: sale.productName, quantity: sale.quantity});
          }
          return acc;
        }, [] as {productName: string; quantity: number}[]);

        return productSales
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
      },
    }),
    {
      name: 'sales-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);