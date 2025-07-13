import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from 'react-i18next';
import Header from '../../components/ui/Header';
import StatCard from '../../components/ui/StatCard';
import AnimatedCard from '../../components/ui/AnimatedCard';
import {useAuthStore} from '../../store/authStore';
import {useProductStore} from '../../store/productStore';
import {useSalesStore} from '../../store/salesStore';

const DashboardScreen: React.FC = () => {
  const {t} = useTranslation();
  const {user} = useAuthStore();
  const {products, getLowStockProducts} = useProductStore();
  const {sales, getTotalSales, getTotalDebts} = useSalesStore();

  const userStoreId = user?.storeId;
  const storeProducts = products.filter(p => p.storeId === userStoreId);
  const lowStockProducts = getLowStockProducts(userStoreId);
  const totalSales = getTotalSales(userStoreId);
  const totalDebts = getTotalDebts(userStoreId);

  // Calcul du capital en stock
  const stockCapital = storeProducts.reduce((total, product) => {
    return (
      total +
      (product.currentStock * product.packagePurchasePrice) /
        product.unitsPerPackage
    );
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
        <Header
          title={`${t('dashboard.hello')}, ${user?.name || 'Utilisateur'}`}
          subtitle={user?.storeName || t('profile.store')}
          showNotifications={true}
        />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              title={t('dashboard.dailySales')}
              value={`${totalSales.toLocaleString()} FCFA`}
              iconName="attach-money"
              color="#10B981"
              subtitle={t('dashboard.totalEncashed')}
            />
            <StatCard
              title={t('dashboard.stockCapital')}
              value={`${stockCapital.toLocaleString()} FCFA`}
              iconName="inventory"
              color="#2563EB"
              subtitle={t('dashboard.inventoryValue')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title={t('dashboard.debts')}
              value={`${totalDebts.toLocaleString()} FCFA`}
              iconName="trending-up"
              color="#F59E0B"
              subtitle={t('dashboard.toRecover')}
            />
            <StatCard
              title={t('dashboard.stockAlerts')}
              value={lowStockProducts.length.toString()}
              iconName="warning"
              color="#EF4444"
              subtitle={t('dashboard.lowProducts')}
            />
          </View>
        </View>

        <AnimatedCard style={styles.alertsCard} delay={200} animationType="slideUp">
          <Text style={styles.alertsTitle}>{t('dashboard.stockAlertsTitle')}</Text>
          {lowStockProducts.length > 0 ? (
            lowStockProducts.map(product => (
              <View key={product.id} style={styles.alertItem}>
                <View style={styles.alertContent}>
                  <Text style={styles.alertProductName}>{product.name}</Text>
                  <Text style={styles.alertStock}>
                    Stock: {product.currentStock} / {product.minStockAlert}
                  </Text>
                </View>
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>{t('dashboard.lowStock')}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noAlerts}>{t('dashboard.noAlerts')}</Text>
          )}
        </AnimatedCard>

        <AnimatedCard style={styles.quickStatsCard} delay={400} animationType="scale">
          <Text style={styles.quickStatsTitle}>{t('dashboard.quickOverview')}</Text>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{storeProducts.length}</Text>
              <Text style={styles.quickStatLabel}>{t('dashboard.products')}</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{sales.length}</Text>
              <Text style={styles.quickStatLabel}>{t('dashboard.sales')}</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>
                {Math.round(
                  ((totalSales - stockCapital) / stockCapital) * 100,
                ) || 0}
                %
              </Text>
              <Text style={styles.quickStatLabel}>{t('dashboard.margin')}</Text>
            </View>
          </View>
        </AnimatedCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 10,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  alertsCard: {
    marginBottom: 20,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  alertContent: {
    flex: 1,
  },
  alertProductName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  alertStock: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  alertBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D97706',
  },
  noAlerts: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  quickStatsCard: {
    marginBottom: 20,
  },
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  quickStatLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
});

export default DashboardScreen;