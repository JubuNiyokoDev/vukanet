import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useProductStore} from '../../store/productStore';
import {useSalesStore} from '../../store/salesStore';
import {useAuthStore} from '../../store/authStore';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

const QuickSaleScreen: React.FC = () => {
  const {user} = useAuthStore();
  const {products, updateStock} = useProductStore();
  const {addSale} = useSalesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'mobile' | 'card'
  >('cash');
  const [isDebt, setIsDebt] = useState(false);

  const userStoreId = user?.storeId;
  const storeProducts = products.filter(p => p.storeId === userStoreId);

  const filteredProducts = storeProducts.filter(
    product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.currentStock) {
        setCart(
          cart.map(item =>
            item.productId === product.id
              ? {...item, quantity: item.quantity + 1}
              : item,
          ),
        );
      } else {
        Alert.alert('Stock insuffisant', 'Quantité en stock dépassée');
      }
    } else {
      if (product.currentStock > 0) {
        setCart([
          ...cart,
          {
            productId: product.id,
            name: product.name,
            price: product.unitSalePrice,
            quantity: 1,
            stock: product.currentStock,
          },
        ]);
      } else {
        Alert.alert('Rupture de stock', "Ce produit n'est plus en stock");
      }
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(
      cart
        .map(item => {
          if (item.productId === productId) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) {
              return null;
            }
            if (newQuantity > item.stock) {
              Alert.alert('Stock insuffisant', 'Quantité en stock dépassée');
              return item;
            }
            return {...item, quantity: newQuantity};
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const processSale = () => {
    if (cart.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des produits au panier');
      return;
    }

    Alert.alert(
      'Confirmer la vente',
      `Total: ${getTotalAmount().toLocaleString()} FCFA\nArticles: ${getTotalItems()}\nClient: ${
        clientName || 'Anonyme'
      }`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Confirmer',
          onPress: () => {
            // Traiter chaque article du panier
            cart.forEach(item => {
              addSale({
                productId: item.productId,
                productName: item.name,
                quantity: item.quantity,
                unitPrice: item.price,
                totalAmount: item.price * item.quantity,
                sellerId: user?.id || '',
                sellerName: user?.name || '',
                storeId: userStoreId || '',
                clientName: clientName || undefined,
                isDebt,
                debtAmount: isDebt ? item.price * item.quantity : undefined,
              });

              // Mettre à jour le stock
              updateStock(item.productId, -item.quantity);
            });

            // Réinitialiser le panier
            setCart([]);
            setClientName('');
            setIsDebt(false);

            Alert.alert('Succès', 'Vente enregistrée avec succès');
          },
        },
      ],
    );
  };

  const clearCart = () => {
    Alert.alert('Vider le panier', 'Êtes-vous sûr de vouloir vider le panier ?', [
      {text: 'Annuler', style: 'cancel'},
      {text: 'Vider', onPress: () => setCart([])},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitle}>
            <Icon name="flash-on" size={28} color="#FFFFFF" />
            <Text style={styles.title}>Vente Rapide</Text>
          </View>
          <Text style={styles.subtitle}>Processus de vente optimisé</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Barre de recherche */}
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

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Liste des produits */}
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Produits disponibles</Text>
            <View style={styles.productsList}>
              {filteredProducts.map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => addToCart(product)}>
                  <View style={styles.productInfo}>
                    <View style={styles.productIcon}>
                      <Icon name="inventory" size={20} color="#667eea" />
                    </View>
                    <View style={styles.productDetails}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productCategory}>
                        {product.category}
                      </Text>
                      <Text style={styles.productPrice}>
                        {product.unitSalePrice.toLocaleString()} FCFA
                      </Text>
                    </View>
                    <View style={styles.productStock}>
                      <Text style={styles.stockText}>
                        Stock: {product.currentStock}
                      </Text>
                      <View style={styles.addButton}>
                        <Icon name="add" size={16} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Panier */}
          <View style={styles.cartSection}>
            <View style={styles.cartHeader}>
              <Text style={styles.sectionTitle}>
                Panier ({getTotalItems()} articles)
              </Text>
              {cart.length > 0 && (
                <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
                  <Icon name="delete" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.cartList}>
              {cart.map(item => (
                <View key={item.productId} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>
                      {item.price.toLocaleString()} FCFA
                    </Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.productId, -1)}>
                      <Icon name="remove" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.productId, 1)}>
                      <Icon name="add" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.productId)}>
                    <Icon name="delete" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Informations client et paiement */}
            {cart.length > 0 && (
              <View style={styles.checkoutSection}>
                <View style={styles.clientSection}>
                  <View style={styles.inputContainer}>
                    <Icon name="person" size={18} color="#6B7280" />
                    <TextInput
                      style={styles.clientInput}
                      placeholder="Nom du client (optionnel)"
                      value={clientName}
                      onChangeText={setClientName}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.paymentSection}>
                  <Text style={styles.paymentTitle}>Mode de paiement</Text>
                  <View style={styles.paymentMethods}>
                    <TouchableOpacity
                      style={[
                        styles.paymentMethod,
                        paymentMethod === 'cash' && styles.paymentMethodActive,
                      ]}
                      onPress={() => setPaymentMethod('cash')}>
                      <Icon
                        name="attach-money"
                        size={20}
                        color={paymentMethod === 'cash' ? '#FFFFFF' : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentMethod === 'cash' &&
                            styles.paymentMethodTextActive,
                        ]}>
                        Espèces
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.paymentMethod,
                        paymentMethod === 'mobile' &&
                          styles.paymentMethodActive,
                      ]}
                      onPress={() => setPaymentMethod('mobile')}>
                      <Icon
                        name="smartphone"
                        size={20}
                        color={
                          paymentMethod === 'mobile' ? '#FFFFFF' : '#6B7280'
                        }
                      />
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentMethod === 'mobile' &&
                            styles.paymentMethodTextActive,
                        ]}>
                        Mobile Money
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.paymentMethod,
                        paymentMethod === 'card' && styles.paymentMethodActive,
                      ]}
                      onPress={() => setPaymentMethod('card')}>
                      <Icon
                        name="credit-card"
                        size={20}
                        color={paymentMethod === 'card' ? '#FFFFFF' : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentMethod === 'card' &&
                            styles.paymentMethodTextActive,
                        ]}>
                        Carte
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.debtToggle}
                  onPress={() => setIsDebt(!isDebt)}>
                  <View style={[styles.checkbox, isDebt && styles.checkboxActive]}>
                    {isDebt && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.debtText}>Vente à crédit</Text>
                </TouchableOpacity>

                <View style={styles.totalSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>
                      {getTotalAmount().toLocaleString()} FCFA
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={processSale}>
                  <Icon name="shopping-cart" size={20} color="#FFFFFF" />
                  <Text style={styles.checkoutButtonText}>
                    Finaliser la vente
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    marginVertical: 16,
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
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  scrollContent: {
    flex: 1,
  },
  productsSection: {
    marginBottom: 20,
  },
  cartSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  productsList: {
    gap: 8,
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
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
    marginTop: 4,
  },
  productStock: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    padding: 8,
  },
  cartList: {
    gap: 8,
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  checkoutSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientSection: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  clientInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    paddingVertical: 12,
    marginLeft: 8,
  },
  paymentSection: {
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethod: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  paymentMethodActive: {
    backgroundColor: '#667eea',
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },
  paymentMethodTextActive: {
    color: '#FFFFFF',
  },
  debtToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  debtText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#667eea',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default QuickSaleScreen;