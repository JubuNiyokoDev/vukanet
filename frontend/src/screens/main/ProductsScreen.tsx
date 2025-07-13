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
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import {useProductStore} from '../../store/productStore';
import {useAuthStore} from '../../store/authStore';

const ProductsScreen: React.FC = () => {
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
        title="Produits"
        subtitle={`${storeProducts.length} produits • ${lowStockProducts.length} alertes`}
        showNotifications={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Icon name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {lowStockProducts.length > 0 && (
          <Card style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Icon name="warning" size={20} color="#EF4444" />
              <Text style={styles.alertTitle}>Alertes de stock</Text>
            </View>
            <Text style={styles.alertSubtitle}>
              {lowStockProducts.length} produit(s) en stock faible
            </Text>
          </Card>
        )}

        <View style={styles.productsGrid}>
          {filteredProducts.map(product => (
            <Card key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.productIcon}>
                  <Icon name="inventory" size={24} color="#2563EB" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                </View>
              </View>

              <View style={styles.stockInfo}>
                <View style={styles.stockItem}>
                  <Text style={styles.stockLabel}>Stock actuel</Text>
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
                  <Text style={styles.stockLabel}>Seuil min</Text>
                  <Text style={styles.stockValue}>{product.minStockAlert}</Text>
                </View>
              </View>

              <View style={styles.priceInfo}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Prix unité</Text>
                  <Text style={styles.priceValue}>
                    {product.unitSalePrice.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Prix paquet</Text>
                  <Text style={styles.priceValue}>
                    {product.packageSalePrice.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.packageInfo}>
                <Text style={styles.packageText}>
                  {product.unitsPerPackage} unités par paquet
                </Text>
              </View>

              {product.currentStock <= product.minStockAlert && (
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockText}>Stock faible</Text>
                </View>
              )}
            </Card>
          ))}
        </View>

        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="inventory" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Essayez un autre terme de recherche'
                : 'Commencez par ajouter vos premiers produits'}
            </Text>
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
});

export default ProductsScreen;