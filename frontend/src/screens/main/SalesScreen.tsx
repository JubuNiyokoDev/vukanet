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
import {format} from 'date-fns';
import {fr} from 'date-fns/locale';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import {useSalesStore} from '../../store/salesStore';
import {useAuthStore} from '../../store/authStore';

const SalesScreen: React.FC = () => {
  const {user} = useAuthStore();
  const {sales, getSalesByStore, getTotalSales} = useSalesStore();
  const [searchQuery, setSearchQuery] = useState('');

  const userStoreId = user?.storeId;
  const storeSales = getSalesByStore(userStoreId || '');
  const totalSales = getTotalSales(userStoreId);

  const filteredSales = storeSales.filter(
    sale =>
      sale.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.sellerName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Ventes"
        subtitle={`${storeSales.length} ventes • ${totalSales.toLocaleString()} FCFA`}
        showNotifications={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une vente..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Icon name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{storeSales.length}</Text>
              <Text style={styles.statLabel}>Ventes totales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {totalSales.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Chiffre d'affaires</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {storeSales.filter(s => s.isDebt).length}
              </Text>
              <Text style={styles.statLabel}>Créances</Text>
            </View>
          </View>
        </Card>

        <View style={styles.salesList}>
          {filteredSales.map(sale => (
            <Card key={sale.id} style={styles.saleCard}>
              <View style={styles.saleHeader}>
                <View style={styles.saleIcon}>
                  <Icon name="shopping-cart" size={20} color="#2563EB" />
                </View>
                <View style={styles.saleInfo}>
                  <Text style={styles.saleProduct}>{sale.productName}</Text>
                  <Text style={styles.saleAmount}>
                    {sale.totalAmount.toLocaleString()} FCFA
                  </Text>
                </View>
                {sale.isDebt && (
                  <View style={styles.debtBadge}>
                    <Text style={styles.debtText}>Créance</Text>
                  </View>
                )}
              </View>

              <View style={styles.saleDetails}>
                <View style={styles.saleDetailItem}>
                  <Text style={styles.saleDetailLabel}>Quantité</Text>
                  <Text style={styles.saleDetailValue}>{sale.quantity}</Text>
                </View>
                <View style={styles.saleDetailItem}>
                  <Text style={styles.saleDetailLabel}>Prix unitaire</Text>
                  <Text style={styles.saleDetailValue}>
                    {sale.unitPrice.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.saleFooter}>
                <View style={styles.saleClient}>
                  <Icon name="person" size={16} color="#6B7280" />
                  <Text style={styles.saleClientName}>
                    {sale.clientName || 'Client anonyme'}
                  </Text>
                </View>
                <View style={styles.saleDate}>
                  <Icon name="event" size={16} color="#6B7280" />
                  <Text style={styles.saleDateText}>
                    {format(new Date(sale.createdAt), 'dd MMM yyyy', {
                      locale: fr,
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.saleSeller}>
                <Text style={styles.saleSellerText}>
                  Vendeur: {sale.sellerName}
                </Text>
              </View>
            </Card>
          ))}
        </View>

        {filteredSales.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="shopping-cart" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucune vente trouvée</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Essayez un autre terme de recherche'
                : 'Commencez par enregistrer vos premières ventes'}
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
  statsCard: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  salesList: {
    gap: 12,
  },
  saleCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  saleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 2,
  },
  debtBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  debtText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D97706',
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  saleDetailItem: {
    alignItems: 'center',
  },
  saleDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  saleDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saleClient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saleClientName: {
    fontSize: 14,
    color: '#6B7280',
  },
  saleDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saleDateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  saleSeller: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saleSellerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
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

export default SalesScreen;