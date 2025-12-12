import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { productApi, sellerApi } from '../../services/api';

// Categories and Subcategories
const CATEGORIES = ['Male', 'Female', 'Wedding Rings', 'Other'];

const SUBCATEGORIES: { [key: string]: string[] } = {
  'Male': ['Chains', 'Rings', 'Earrings and Pendants'],
  'Female': ['Chains', 'Rings', 'Earrings and Pendants'],
  'Wedding Rings': ['Wedding Anniversary', 'Engagement', 'Marriage'],
  'Other': ['Perfumes', 'Watches', 'Other'],
};

export default function ProductFormScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { authToken } = useAppStore();

  const isEditMode = !!productId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Male',
    subcategory: 'Chains',
    base_price: '',
    gold_weight_grams: '',
    gold_karat: '18k',
    stock_quantity: '1',
  });

  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEditMode);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && authToken && productId) {
      fetchProduct();
    }
  }, [isEditMode, productId, authToken]);

  const fetchProduct = async () => {
    if (!authToken || !productId) return;

    try {
      setLoadingProduct(true);
      const response = await sellerApi.getProducts(authToken, {});
      const product = response.data?.find((p: any) => String(p.id) === productId);

      if (product) {
        setOriginalStatus(product.status);
        setFormData({
          name: product.name || '',
          description: product.description || '',
          category: product.category || 'Male',
          subcategory: product.subcategory || SUBCATEGORIES[product.category || 'Male'][0],
          base_price: product.base_price?.toString() || '',
          gold_weight_grams: product.gold_weight_grams?.toString() || '',
          gold_karat: product.gold_karat || '18k',
          stock_quantity: product.stock_quantity?.toString() || '1',
        });
      } else {
        Alert.alert('Erro', 'Produto não encontrado');
        router.back();
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      Alert.alert('Erro', error.message || 'Falha ao carregar produto');
      router.back();
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome do produto é obrigatório');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Erro', 'Descrição é obrigatória');
      return false;
    }
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      Alert.alert('Erro', 'Preço base deve ser maior que zero');
      return false;
    }
    if (!formData.gold_weight_grams || parseFloat(formData.gold_weight_grams) <= 0) {
      Alert.alert('Erro', 'Peso do ouro deve ser maior que zero');
      return false;
    }
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      Alert.alert('Erro', 'Quantidade em estoque inválida');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!authToken) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return;
    }

    // If editing an approved product, warn user
    if (isEditMode && originalStatus === 'approved') {
      Alert.alert(
        'Atenção',
        'Ao editar um produto aprovado, ele será enviado novamente para aprovação. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => submitForm() },
        ]
      );
      return;
    }

    await submitForm();
  };

  const submitForm = async () => {
    setLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        base_price: parseFloat(formData.base_price),
        gold_weight_grams: parseFloat(formData.gold_weight_grams),
        gold_karat: formData.gold_karat,
        stock_quantity: parseInt(formData.stock_quantity),
      };

      if (isEditMode && productId) {
        const response = await productApi.updateProduct(authToken!, parseInt(productId), productData);

        const message = response.requires_approval
          ? 'Produto atualizado! Como houve alterações, ele foi enviado para re-aprovação.'
          : 'Produto atualizado com sucesso!';

        Alert.alert('Sucesso!', message, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await productApi.createProduct(authToken!, productData);

        Alert.alert(
          'Sucesso!',
          'Produto criado com sucesso! Aguardando aprovação do administrador.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      Alert.alert('Erro', error.message || 'Falha ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Carregando produto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Editar Produto' : 'Adicionar Produto'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Status Badge for Edit Mode */}
        {isEditMode && originalStatus && (
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    originalStatus === 'approved'
                      ? '#dcfce7'
                      : originalStatus === 'pending'
                      ? '#fef3c7'
                      : '#fef2f2',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      originalStatus === 'approved'
                        ? '#16a34a'
                        : originalStatus === 'pending'
                        ? '#ca8a04'
                        : '#dc2626',
                  },
                ]}
              >
                {originalStatus === 'approved'
                  ? 'Aprovado'
                  : originalStatus === 'pending'
                  ? 'Pendente'
                  : 'Rejeitado'}
              </Text>
            </View>
          </View>
        )}

        {/* Product Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Nome do Produto <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Anel de Ouro 18k"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            editable={!loading}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Descrição <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva o produto em detalhes"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Category */}
        <View style={[styles.inputGroup, { zIndex: 2000 }]}>
          <Text style={styles.label}>
            Categoria <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.selectContainer}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              disabled={loading}
            >
              <Text style={styles.selectText}>{formData.category}</Text>
              <Ionicons
                name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
            {categoryDropdownOpen && (
              <View style={styles.dropdownList}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('category', cat);
                      handleInputChange('subcategory', SUBCATEGORIES[cat][0]);
                      setCategoryDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{cat}</Text>
                    {formData.category === cat && (
                      <Ionicons name="checkmark" size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Subcategory */}
        <View style={[styles.inputGroup, { zIndex: 1000 }]}>
          <Text style={styles.label}>Subcategoria</Text>
          <View style={styles.selectContainer}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setSubcategoryDropdownOpen(!subcategoryDropdownOpen)}
              disabled={loading}
            >
              <Text style={styles.selectText}>{formData.subcategory}</Text>
              <Ionicons
                name={subcategoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
            {subcategoryDropdownOpen && (
              <View style={styles.dropdownList}>
                {SUBCATEGORIES[formData.category]?.map((subcat) => (
                  <TouchableOpacity
                    key={subcat}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('subcategory', subcat);
                      setSubcategoryDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{subcat}</Text>
                    {formData.subcategory === subcat && (
                      <Ionicons name="checkmark" size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Preço Base (R$) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 1500.00"
            value={formData.base_price}
            onChangeText={(value) => handleInputChange('base_price', value)}
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>

        {/* Gold Weight */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Peso do Ouro (gramas) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 5.5"
            value={formData.gold_weight_grams}
            onChangeText={(value) => handleInputChange('gold_weight_grams', value)}
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>

        {/* Gold Karat */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Quilate do Ouro <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.radioGroup}>
            {['18k', '22k', '24k'].map((karat) => (
              <TouchableOpacity
                key={karat}
                style={[
                  styles.radioButton,
                  formData.gold_karat === karat && styles.radioButtonActive,
                ]}
                onPress={() => handleInputChange('gold_karat', karat)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.gold_karat === karat && styles.radioTextActive,
                  ]}
                >
                  {karat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stock Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Quantidade em Estoque <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 10"
            value={formData.stock_quantity}
            onChangeText={(value) => handleInputChange('stock_quantity', value)}
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2563eb" />
          <Text style={styles.infoText}>
            {isEditMode && originalStatus === 'approved'
              ? 'Ao editar um produto aprovado, ele será enviado novamente para aprovação do administrador.'
              : 'Seu produto será enviado para aprovação do administrador antes de ficar visível aos compradores.'}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Salvar Alterações' : 'Criar Produto'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  statusContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  radioButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  radioTextActive: {
    color: '#2563eb',
  },
  selectContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdownList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#111827',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    marginLeft: 8,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
