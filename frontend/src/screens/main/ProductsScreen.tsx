import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MockIcon from '../../components/ui/MockIcon';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import Header from '../../components/ui/Header';
import AnimatedCard from '../../components/ui/AnimatedCard';
import AnimatedCard from '../../components/ui/AnimatedCard';
import {useProductStore} from '../../store/productStore';
import {useAuthStore} from '../../store/authStore';

const ProductsScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user} = useAuthStore();
  const {products, getLowStockProducts} = useProductStore();
  const [searchQuery, setSearchQuery] = useState('');

  const userStoreId = user?.storeId;
  const storeProducts = products.filter(p => p.storeId === userStoreId);
  const lowStockProducts = getLowStockProducts(userStoreId);

  const filteredProducts = storeProducts.filter(
    product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t('products.title')}
        subtitle={`${storeProducts.length} ${t('navigation.products')} • ${lowStockProducts.length} ${t('products.alerts')}`}
        title={t('products.title')}
        subtitle={`${storeProducts.length} ${t('navigation.products')} • ${lowStockProducts.length} ${t('products.alerts')}`}
        showNotifications={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MockIcon name="search" size={20} color="#6B7280" />
            <MockIcon name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('products.searchPlaceholder')}
              placeholder={t('products.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddProduct' as never)}>
            <MockIcon name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('StockManagement' as never)}>
            <MockIcon name="inventory" size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>Gérer Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MockIcon name="trending-up" size={20} color="#10B981" />
            <Text style={styles.actionButtonText}>Rapports</Text>
          </TouchableOpacity>
        </View>

        {lowStockProducts.length > 0 && (
          <AnimatedCard style={styles.alertCard} animationType="slideUp">
          <AnimatedCard style={styles.alertCard} animationType="slideUp">
            <View style={styles.alertHeader}>
              <MockIcon name="warning" size={20} color="#EF4444" />
              <Text style={styles.alertTitle}>{t('products.lowStockAlert')}</Text>
              <MockIcon name="warning" size={20} color="#EF4444" />
              <Text style={styles.alertTitle}>{t('products.lowStockAlert')}</Text>
            </View>
            <Text style={styles.alertSubtitle}>
              {lowStockProducts.length} {t('products.lowStockProducts')}
              {lowStockProducts.length} {t('products.lowStockProducts')}
            </Text>
          </AnimatedCard>
          </AnimatedCard>
        )}

        <View style={styles.productsGrid}>
          {filteredProducts.map((product, index) => (
            <AnimatedCard 
              key={product.id} 
              style={styles.productCard}
              delay={index * 100}
              animationType="slideUp"
            >
          {filteredProducts.map((product, index) => (
            <AnimatedCard 
              key={product.id} 
              style={styles.productCard}
              delay={index * 100}
              animationType="slideUp"
            >
              <View style={styles.productHeader}>
                <View style={styles.productIcon}>
                  <MockIcon name="inventory" size={24} color="#2563EB" />
                  <MockIcon name="inventory" size={24} color="#2563EB" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                </View>
              </View>

              <View style={styles.stockInfo}>
                <View style={styles.stockItem}>
                  <Text style={styles.stockLabel}>{t('products.currentStock')}</Text>
                  <Text style={styles.stockLabel}>{t('products.currentStock')}</Text>
                  <Text
                    style={[
                      styles.stockValue,
                      product.currentStock <= product.minStockAlert &&
                        styles.stockLow,
                    ]}>
                    {product.currentStock}
                  </Text>
                </View>
                <View style={styles.stockItem}>
                  <Text style={styles.stockLabel}>{t('products.minThreshold')}</Text>
                  <Text style={styles.stockLabel}>{t('products.minThreshold')}</Text>
                  <Text style={styles.stockValue}>{product.minStockAlert}</Text>
                </View>
              </View>

              <View style={styles.priceInfo}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>{t('products.unitPrice')}</Text>
                  <Text style={styles.priceLabel}>{t('products.unitPrice')}</Text>
                  <Text style={styles.priceValue}>
                    {product.unitSalePrice.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>{t('products.packagePrice')}</Text>
                  <Text style={styles.priceLabel}>{t('products.packagePrice')}</Text>
                  <Text style={styles.priceValue}>
                    {product.packageSalePrice.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.packageInfo}>
                <Text style={styles.packageText}>
                  {product.unitsPerPackage} {t('products.unitsPerPackage')}
                  {product.unitsPerPackage} {t('products.unitsPerPackage')}
                </Text>
              </View>

              {product.currentStock <= product.minStockAlert && (
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockText}>{t('products.lowStock')}</Text>
                  <Text style={styles.lowStockText}>{t('products.lowStock')}</Text>
                </View>
              )}
            </AnimatedCard>
            </AnimatedCard>
          ))}
        </View>

        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <MockIcon name="inventory" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{t('products.noProductsFound')}</Text>
            <MockIcon name="inventory" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{t('products.noProductsFound')}</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? t('products.tryDifferentSearch')
                : t('products.addFirstProducts')}
                ? t('products.tryDifferentSearch')
                : t('products.addFirstProducts')}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => navigation.navigate('AddProduct' as never)}>
                <MockIcon name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addFirstButtonText}>Ajouter un produit</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#7F1D1D',
  },
  productsGrid: {
    gap: 16,
  },
  productCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  productCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stockItem: {
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  stockValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  stockLow: {
    color: '#EF4444',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 2,
  },
  packageInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  packageText: {
    fontSize: 12,
    color: '#6B7280',
  },
  lowStockBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  lowStockText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
    gap: 8,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProductsScreen;