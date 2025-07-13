import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {useProductStore} from '../../store/productStore';
import {useAuthStore} from '../../store/authStore';

const StockManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const {products, updateStock} = useProductStore();
  const {user} = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const userStoreId = user?.storeId;
  const storeProducts = products.filter(p => p.storeId === userStoreId);

  const filteredProducts = storeProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openStockModal = (product: any, action: 'add' | 'remove') => {
    setSelectedProduct(product);
    setStockAction(action);
    setQuantity('');
    setReason('');
    setModalVisible(true);
  };

  const handleStockUpdate = () => {
    if (!quantity || isNaN(Number(quantity))) {
      Alert.alert('Erreur', 'Veuillez entrer une quantité valide');
      return;
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      Alert.alert('Erreur', 'La quantité doit être positive');
      return;
    }

    if (stockAction === 'remove' && qty > selectedProduct.currentStock) {
      Alert.alert('Erreur', 'Quantité insuffisante en stock');
      return;
    }

    const actionText = stockAction === 'add' ? 'Ajouter' : 'Retirer';
    const newStock = stockAction === 'add' 
      ? selectedProduct.currentStock + qty 
      : selectedProduct.currentStock - qty;

    Alert.alert(
      `Confirmer l'action`,
      `${actionText} ${qty} unités de "${selectedProduct.name}" ?\n\nStock actuel: ${selectedProduct.currentStock}\nNouveau stock: ${newStock}\n\nRaison: ${reason || 'Non spécifiée'}`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Confirmer',
          onPress: () => {
            const finalQty = stockAction === 'add' ? qty : -qty;
            updateStock(selectedProduct.id, finalQty);
            setModalVisible(false);
            Alert.alert('Succès', 'Stock mis à jour avec succès');
          },
        },
      ],
    );
  };

  const StockModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {stockAction === 'add' ? 'Ajouter au stock' : 'Retirer du stock'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{selectedProduct?.name}</Text>
              <Text style={styles.currentStock}>
                Stock actuel: {selectedProduct?.currentStock} unités
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantité</Text>
              <TextInput
                style={styles.quantityInput}
                placeholder="Entrez la quantité"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Raison (optionnel)</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Ex: Réapprovisionnement, Inventaire, etc."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelModalButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                stockAction === 'remove' && styles.removeButton,
              ]}
              onPress={handleStockUpdate}>
              <Text style={styles.confirmButtonText}>
                {stockAction === 'add' ? 'Ajouter' : 'Retirer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Gestion du Stock</Text>
        <View style={styles.placeholder} />
      </View>

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
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.productsList}>
          {filteredProducts.map(product => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockText}>{product.currentStock}</Text>
                  <Text style={styles.stockLabel}>unités</Text>
                </View>
              </View>

              <View style={styles.stockDetails}>
                <View style={styles.stockDetailItem}>
                  <Text style={styles.stockDetailLabel}>Seuil min</Text>
                  <Text style={styles.stockDetailValue}>{product.minStockAlert}</Text>
                </View>
                <View style={styles.stockDetailItem}>
                  <Text style={styles.stockDetailLabel}>Prix unitaire</Text>
                  <Text style={styles.stockDetailValue}>
                    {product.unitSalePrice.toLocaleString()} FBU
                  </Text>
                </View>
              </View>

              {product.currentStock <= product.minStockAlert && (
                <View style={styles.lowStockWarning}>
                  <Icon name="warning" size={16} color="#EF4444" />
                  <Text style={styles.lowStockText}>Stock faible</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => openStockModal(product, 'add')}>
                  <Icon name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => openStockModal(product, 'remove')}>
                  <Icon name="remove" size={20} color="#FFFFFF" />
                  <Text style={styles.removeButtonText}>Retirer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="inventory" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Essayez un autre terme de recherche'
                : 'Ajoutez des produits pour gérer le stock'}
            </Text>
          </View>
        )}
      </ScrollView>

      <StockModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  productsList: {
    gap: 12,
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  stockBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  stockText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  stockLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  stockDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stockDetailItem: {
    alignItems: 'center',
  },
  stockDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  stockDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  lowStockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  lowStockText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  productInfo: {
    marginBottom: 20,
  },
  currentStock: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  reasonInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default StockManagementScreen;