import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {useProductStore} from '../../store/productStore';
import {useAuthStore} from '../../store/authStore';

const AddProductScreen: React.FC = () => {
  const navigation = useNavigation();
  const {addProduct} = useProductStore();
  const {user} = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    barcode: '',
    unitsPerPackage: '',
    currentStock: '',
    packagePurchasePrice: '',
    unitSalePrice: '',
    packageSalePrice: '',
    minStockAlert: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const validateForm = () => {
    const required = ['name', 'category', 'unitsPerPackage', 'packagePurchasePrice', 'unitSalePrice'];
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        Alert.alert('Erreur', `Le champ ${field} est requis`);
        return false;
      }
    }

    const numericFields = ['unitsPerPackage', 'currentStock', 'packagePurchasePrice', 'unitSalePrice', 'minStockAlert'];
    for (const field of numericFields) {
      const value = formData[field as keyof typeof formData];
      if (value && isNaN(Number(value))) {
        Alert.alert('Erreur', `Le champ ${field} doit être un nombre`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const unitsPerPackage = Number(formData.unitsPerPackage);
    const packagePurchasePrice = Number(formData.packagePurchasePrice);
    const unitSalePrice = Number(formData.unitSalePrice);

    // Calculer automatiquement le prix de vente du paquet si non fourni
    const packageSalePrice = formData.packageSalePrice 
      ? Number(formData.packageSalePrice)
      : unitSalePrice * unitsPerPackage;

    Alert.alert(
      'Confirmer l\'ajout',
      `Ajouter le produit "${formData.name}" ?\n\nStock initial: ${formData.currentStock || 0} unités\nPrix unitaire: ${unitSalePrice} FBU`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Ajouter',
          onPress: async () => {
            setIsLoading(true);
            try {
              addProduct({
                name: formData.name,
                description: formData.description,
                category: formData.category,
                barcode: formData.barcode,
                unitsPerPackage,
                currentStock: Number(formData.currentStock) || 0,
                packagePurchasePrice,
                unitSalePrice,
                packageSalePrice,
                minStockAlert: Number(formData.minStockAlert) || 5,
                storeId: user?.storeId || '',
              });

              Alert.alert('Succès', 'Produit ajouté avec succès', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de l\'ajout du produit');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const InputField = ({
    label,
    field,
    placeholder,
    keyboardType = 'default',
    multiline = false,
  }: {
    label: string;
    field: keyof typeof formData;
    placeholder: string;
    keyboardType?: 'default' | 'numeric' | 'email-address';
    multiline?: boolean;
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        placeholder={placeholder}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Nouveau Produit</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <InputField
            label="Nom du produit *"
            field="name"
            placeholder="Ex: Écouteurs Bluetooth"
          />

          <InputField
            label="Description"
            field="description"
            placeholder="Description du produit"
            multiline
          />

          <InputField
            label="Catégorie *"
            field="category"
            placeholder="Ex: Électronique"
          />

          <InputField
            label="Code-barres"
            field="barcode"
            placeholder="Code-barres du produit"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Unités par paquet *"
                field="unitsPerPackage"
                placeholder="Ex: 12"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Stock initial"
                field="currentStock"
                placeholder="Ex: 50"
                keyboardType="numeric"
              />
            </View>
          </View>

          <InputField
            label="Prix d'achat paquet *"
            field="packagePurchasePrice"
            placeholder="Ex: 60000"
            keyboardType="numeric"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Prix vente unité *"
                field="unitSalePrice"
                placeholder="Ex: 6000"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Prix vente paquet"
                field="packageSalePrice"
                placeholder="Auto-calculé"
                keyboardType="numeric"
              />
            </View>
          </View>

          <InputField
            label="Seuil d'alerte stock"
            field="minStockAlert"
            placeholder="Ex: 5"
            keyboardType="numeric"
          />

          <View style={styles.infoBox}>
            <Icon name="info" size={20} color="#2563EB" />
            <Text style={styles.infoText}>
              Les champs marqués d'un * sont obligatoires. Le prix de vente du paquet sera calculé automatiquement si non spécifié.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="save" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AddProductScreen;