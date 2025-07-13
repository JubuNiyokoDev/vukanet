import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
    storeId?: string;
    language?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(data: {
    name?: string;
    language?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Products endpoints
  async getProducts(storeId: string, params?: {
    category?: string;
    lowStock?: boolean;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.lowStock) queryParams.append('lowStock', 'true');
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request(`/products/store/${storeId}${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getLowStockProducts(storeId: string) {
    return this.request(`/products/store/${storeId}/low-stock`);
  }

  async getProductCategories(storeId: string) {
    return this.request(`/products/store/${storeId}/categories`);
  }

  // Sales endpoints
  async getSales(storeId: string, params?: {
    startDate?: string;
    endDate?: string;
    productId?: string;
    sellerId?: string;
    isDebt?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.sellerId) queryParams.append('sellerId', params.sellerId);
    if (params?.isDebt !== undefined) queryParams.append('isDebt', params.isDebt.toString());

    const query = queryParams.toString();
    return this.request(`/sales/store/${storeId}${query ? `?${query}` : ''}`);
  }

  async getSale(id: string) {
    return this.request(`/sales/${id}`);
  }

  async createSale(saleData: any) {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async updateSale(id: string, saleData: any) {
    return this.request(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  }

  async getSalesStats(storeId: string, period: string = 'today') {
    return this.request(`/sales/store/${storeId}/stats?period=${period}`);
  }

  // Stock endpoints
  async getStockMovements(storeId: string, params?: {
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/stock/store/${storeId}${query ? `?${query}` : ''}`);
  }

  async createStockMovement(movementData: any) {
    return this.request('/stock', {
      method: 'POST',
      body: JSON.stringify(movementData),
    });
  }

  async getStockSummary(storeId: string, period: string = 'month') {
    return this.request(`/stock/store/${storeId}/summary?period=${period}`);
  }

  async bulkStockAdjustment(data: {
    storeId: string;
    adjustments: Array<{
      productId: string;
      newStock: number;
      reason?: string;
    }>;
  }) {
    return this.request('/stock/bulk-adjustment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Debts endpoints
  async getDebts(storeId: string, params?: {
    status?: string;
    clientName?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.clientName) queryParams.append('clientName', params.clientName);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return this.request(`/debts/store/${storeId}${query ? `?${query}` : ''}`);
  }

  async getDebt(id: string) {
    return this.request(`/debts/${id}`);
  }

  async addDebtPayment(debtId: string, paymentData: {
    amount: number;
    paymentType: string;
    notes?: string;
  }) {
    return this.request(`/debts/${debtId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async updateDebt(id: string, debtData: any) {
    return this.request(`/debts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(debtData),
    });
  }

  async getDebtStats(storeId: string, period: string = 'month') {
    return this.request(`/debts/store/${storeId}/stats?period=${period}`);
  }

  async getOverdueDebts(storeId: string) {
    return this.request(`/debts/store/${storeId}/overdue`);
  }

  // Statistics endpoints
  async getDashboardStats(storeId: string, period: string = 'today') {
    return this.request(`/stats/dashboard/${storeId}?period=${period}`);
  }

  async getSalesTrends(storeId: string, period: string = 'week', groupBy: string = 'day') {
    return this.request(`/stats/sales-trends/${storeId}?period=${period}&groupBy=${groupBy}`);
  }

  async getTopProducts(storeId: string, period: string = 'month', limit: number = 10) {
    return this.request(`/stats/top-products/${storeId}?period=${period}&limit=${limit}`);
  }

  async getSellerPerformance(storeId: string, period: string = 'month') {
    return this.request(`/stats/seller-performance/${storeId}?period=${period}`);
  }

  async getFinancialOverview(storeId: string, period: string = 'month') {
    return this.request(`/stats/financial/${storeId}?period=${period}`);
  }

  // Sync endpoints
  async pushSync(data: {
    items: Array<{
      action: string;
      tableName: string;
      recordId: string;
      data: any;
      timestamp: string;
    }>;
    lastSyncTimestamp?: string;
  }) {
    return this.request('/sync/push', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async pullSync(lastSyncTimestamp?: string) {
    return this.request('/sync/pull', {
      method: 'POST',
      body: JSON.stringify({ lastSyncTimestamp }),
    });
  }

  async getSyncStatus() {
    return this.request('/sync/status');
  }

  async retryFailedSync() {
    return this.request('/sync/retry', {
      method: 'POST',
    });
  }

  // Stores endpoints
  async getStores(params?: {
    search?: string;
    isActive?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    return this.request(`/stores${query ? `?${query}` : ''}`);
  }

  async getStore(id: string) {
    return this.request(`/stores/${id}`);
  }

  async createStore(storeData: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    description?: string;
  }) {
    return this.request('/stores', {
      method: 'POST',
      body: JSON.stringify(storeData),
    });
  }

  async updateStore(id: string, storeData: any) {
    return this.request(`/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(storeData),
    });
  }

  async deleteStore(id: string) {
    return this.request(`/stores/${id}`, {
      method: 'DELETE',
    });
  }

  async getStoreStats(id: string, period: string = 'month') {
    return this.request(`/stores/${id}/stats?period=${period}`);
  }

  // Users endpoints
  async getUsers(params?: {
    storeId?: string;
    role?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.storeId) queryParams.append('storeId', params.storeId);
    if (params?.role) queryParams.append('role', params.role);

    const query = queryParams.toString();
    return this.request(`/users${query ? `?${query}` : ''}`);
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData: {
    email: string;
    name: string;
    role: string;
    storeId?: string;
    language?: string;
  }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUsersByStore(storeId: string) {
    return this.request(`/users/store/${storeId}`);
  }
}

export const apiService = new ApiService();