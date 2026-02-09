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
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DocumentPicker from 'react-native-document-picker';
import { useAppStore } from '../../store/useAppStore';
import { productApi, sellerApi, uploadApi } from '../../services/api';

// Categories and Subcategories (value = English for API, label = Portuguese for display)
const CATEGORIES = [
  { label: 'Masculino', value: 'Male' },
  { label: 'Feminino', value: 'Female' },
  { label: 'Alianças', value: 'Wedding Rings' },
  { label: 'Outros', value: 'Other' },
];

const SUBCATEGORIES: { [key: string]: { label: string; value: string }[] } = {
  'Male': [
    { label: 'Correntes', value: 'Chains' },
    { label: 'Anéis', value: 'Rings' },
    { label: 'Brincos e Pingentes', value: 'Earrings and Pendants' },
  ],
  'Female': [
    { label: 'Correntes', value: 'Chains' },
    { label: 'Anéis', value: 'Rings' },
    { label: 'Brincos e Pingentes', value: 'Earrings and Pendants' },
  ],
  'Wedding Rings': [
    { label: 'Bodas', value: 'Wedding Anniversary' },
    { label: 'Noivado', value: 'Engagement' },
    { label: 'Casamento', value: 'Marriage' },
  ],
  'Other': [
    { label: 'Perfumes', value: 'Perfumes' },
    { label: 'Relógios', value: 'Watches' },
    { label: 'Outros', value: 'Other' },
  ],
};

const FILLING_OPTIONS = [
  { label: 'Maciço', value: 'Solid' },
  { label: 'Oco', value: 'Hollow' },
  { label: 'Defesa', value: 'Defense' },
];
const GEMSTONE_OPTIONS = [
  { label: 'Sintética', value: 'Synthetic' },
  { label: 'Natural', value: 'Natural' },
  { label: 'Sem Pedras', value: 'Without Stones' },
];

// Helper to get display label from value
const getCategoryLabel = (value: string) => CATEGORIES.find(c => c.value === value)?.label || value;
const getSubcategoryLabel = (catValue: string, subValue: string) =>
  SUBCATEGORIES[catValue]?.find(s => s.value === subValue)?.label || subValue;
const getFillingLabel = (value: string) => FILLING_OPTIONS.find(o => o.value === value)?.label || value;
const getGemstoneLabel = (value: string) => GEMSTONE_OPTIONS.find(o => o.value === value)?.label || value;
const MATERIAL_OPTIONS = [
  { label: 'Ouro 18K', value: 'Ouro 18K', karat: '18k' },
  { label: 'Ouro 10K', value: 'Ouro 10K', karat: '10k' },
  { label: 'Outros', value: 'Outros', karat: null },
];

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
    filling: '',
    is_gemstone: '',
    material: 'Ouro 18K',
    base_price: '',
    gold_weight_grams: '',
    gold_karat: '18k',
    stock_quantity: '1',
  });

  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [model3dUrl, setModel3dUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEditMode);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false);
  const [fillingDropdownOpen, setFillingDropdownOpen] = useState(false);
  const [gemstoneDropdownOpen, setGemstoneDropdownOpen] = useState(false);
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);
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
          subcategory: product.subcategory || SUBCATEGORIES[product.category || 'Male'][0].value,
          filling: product.filling || '',
          is_gemstone: product.is_gemstone || '',
          material: product.material || 'Ouro 18K',
          base_price: product.base_price?.toString() || '',
          gold_weight_grams: product.gold_weight_grams?.toString() || '',
          gold_karat: product.gold_karat || '18k',
          stock_quantity: product.stock_quantity?.toString() || '1',
        });
        setImages(product.images ? JSON.parse(product.images) : []);

        // Load video URL if exists
        if (product.videos) {
          const videosArray = typeof product.videos === 'string' ? JSON.parse(product.videos) : product.videos;
          setVideoUrl(videosArray[0] || '');
        }

        setModel3dUrl(product.model_3d_url || '');
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

  const pickFile = async (fileType: 'image' | 'video' | '3d_model') => {
    // Use DocumentPicker for 3D models
    if (fileType === '3d_model') {
      await pick3DModel();
      return;
    }

    // Use ImagePicker for images and videos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria');
      return;
    }

    const options: any = {
      quality: 0.8,
      allowsMultipleSelection: false,
    };

    // Set mediaTypes for video to show all media (images + videos) in picker
    if (fileType === 'video') {
      options.mediaTypes = ImagePicker.MediaTypeOptions.All;
    }

    const result = await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0]) {
      await uploadFile(result.assets[0], fileType);
    }
  };

  const pick3DModel = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });

      const file = result[0];

      const fileData = {
        uri: Platform.OS === 'ios' ? file.fileCopyUri || file.uri : file.fileCopyUri || file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name,
      };

      await uploadFile(fileData, '3d_model');
    } catch (error: any) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled the picker
        return;
      }
      Alert.alert('Erro', error.message || 'Falha ao selecionar arquivo 3D');
    }
  };

  const uploadFile = async (asset: any, type: 'image' | 'video' | '3d_model') => {
    if (!authToken) return;

    setUploading(true);
    try {
      const file = {
        uri: asset.uri,
        type: asset.mimeType || 'application/octet-stream',
        name: asset.name || `file.${asset.uri.split('.').pop()}`,
      };

      const response = await uploadApi.uploadFile(authToken, file, type);

      if (type === 'image') {
        setImages((prev) => [...prev, response.url]);
      } else if (type === 'video') {
        setVideoUrl(response.url);
      } else if (type === '3d_model') {
        setModel3dUrl(response.url);
      }

      Alert.alert('Sucesso', 'Arquivo enviado!');
    } catch (error: any) {
      Alert.alert('Erro ao enviar', error.message || 'Falha ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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

    // Only validate gold fields for gold products
    const isGoldProduct = formData.material === 'Ouro 18K' || formData.material === 'Ouro 10K';
    if (isGoldProduct) {
      if (!formData.gold_weight_grams || parseFloat(formData.gold_weight_grams) <= 0) {
        Alert.alert('Erro', 'Peso do ouro é obrigatório para produtos de ouro');
        return false;
      }
      if (!formData.gold_karat) {
        Alert.alert('Erro', 'Quilate do ouro é obrigatório para produtos de ouro');
        return false;
      }
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
      const isGoldProduct = formData.material === 'Ouro 18K' || formData.material === 'Ouro 10K';

      const productData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        filling: formData.filling || undefined,
        is_gemstone: formData.is_gemstone || undefined,
        material: formData.material,
        base_price: parseFloat(formData.base_price),
        stock_quantity: parseInt(formData.stock_quantity),
        images: JSON.stringify(images),
        videos: videoUrl ? JSON.stringify([videoUrl]) : undefined,
        model_3d_url: model3dUrl || undefined,
      };

      // Only include gold fields for gold products
      if (isGoldProduct) {
        productData.gold_weight_grams = parseFloat(formData.gold_weight_grams);
        productData.gold_karat = formData.gold_karat;
      }

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
              <Text style={styles.selectText}>{getCategoryLabel(formData.category)}</Text>
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
                    key={cat.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('category', cat.value);
                      handleInputChange('subcategory', SUBCATEGORIES[cat.value][0].value);
                      setCategoryDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{cat.label}</Text>
                    {formData.category === cat.value && (
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
              <Text style={styles.selectText}>{getSubcategoryLabel(formData.category, formData.subcategory)}</Text>
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
                    key={subcat.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('subcategory', subcat.value);
                      setSubcategoryDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{subcat.label}</Text>
                    {formData.subcategory === subcat.value && (
                      <Ionicons name="checkmark" size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Filling (Optional) */}
        <View style={[styles.inputGroup, { zIndex: 999 }]}>
          <Text style={styles.label}>Preenchimento (Opcional)</Text>
          <View style={styles.selectContainer}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setFillingDropdownOpen(!fillingDropdownOpen)}
              disabled={loading}
            >
              <Text style={[styles.selectText, !formData.filling && styles.placeholderText]}>
                {formData.filling ? getFillingLabel(formData.filling) : 'Selecione...'}
              </Text>
              <Ionicons
                name={fillingDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
            {fillingDropdownOpen && (
              <View style={styles.dropdownList}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    handleInputChange('filling', '');
                    setFillingDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, styles.placeholderText]}>Nenhum</Text>
                  {!formData.filling && (
                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
                {FILLING_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('filling', option.value);
                      setFillingDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                    {formData.filling === option.value && (
                      <Ionicons name="checkmark" size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Gemstone (Optional) */}
        <View style={[styles.inputGroup, { zIndex: 998 }]}>
          <Text style={styles.label}>Tipo de Pedra (Opcional)</Text>
          <View style={styles.selectContainer}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setGemstoneDropdownOpen(!gemstoneDropdownOpen)}
              disabled={loading}
            >
              <Text style={[styles.selectText, !formData.is_gemstone && styles.placeholderText]}>
                {formData.is_gemstone ? getGemstoneLabel(formData.is_gemstone) : 'Selecione...'}
              </Text>
              <Ionicons
                name={gemstoneDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
            {gemstoneDropdownOpen && (
              <View style={styles.dropdownList}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    handleInputChange('is_gemstone', '');
                    setGemstoneDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, styles.placeholderText]}>Nenhum</Text>
                  {!formData.is_gemstone && (
                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
                {GEMSTONE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('is_gemstone', option.value);
                      setGemstoneDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                    {formData.is_gemstone === option.value && (
                      <Ionicons name="checkmark" size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Material */}
        <View style={[styles.inputGroup, { zIndex: 997 }]}>
          <Text style={styles.label}>
            Material <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.selectContainer}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setMaterialDropdownOpen(!materialDropdownOpen)}
              disabled={loading}
            >
              <Text style={styles.selectText}>{formData.material}</Text>
              <Ionicons
                name={materialDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
            {materialDropdownOpen && (
              <View style={styles.dropdownList}>
                {MATERIAL_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('material', option.value);
                      if (option.karat) {
                        handleInputChange('gold_karat', option.karat);
                      }
                      setMaterialDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                    {formData.material === option.value && (
                      <Ionicons name="checkmark" size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Gold Weight - Only for gold products */}
        {(formData.material === 'Ouro 18K' || formData.material === 'Ouro 10K') && (
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
        )}

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

        {/* Images Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Imagens do Produto</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickFile('image')}
            disabled={uploading || loading}
          >
            <Ionicons name="image-outline" size={20} color="#2563eb" />
            <Text style={styles.uploadButtonText}>Adicionar Imagem</Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <View style={styles.imageGrid}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.imageThumbnail} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Video Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vídeo do Produto (Opcional)</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickFile('video')}
            disabled={uploading || loading}
          >
            <Ionicons name="videocam-outline" size={20} color="#2563eb" />
            <Text style={styles.uploadButtonText}>
              {videoUrl ? 'Alterar Vídeo' : 'Adicionar Vídeo'}
            </Text>
          </TouchableOpacity>
          {videoUrl && (
            <View style={styles.fileTag}>
              <Ionicons name="videocam" size={16} color="#16a34a" />
              <Text style={styles.fileTagText}>Vídeo adicionado</Text>
              <TouchableOpacity onPress={() => setVideoUrl('')}>
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3D Model Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Modelo 3D (Opcional)</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickFile('3d_model')}
            disabled={uploading || loading}
          >
            <Ionicons name="cube-outline" size={20} color="#2563eb" />
            <Text style={styles.uploadButtonText}>
              {model3dUrl ? 'Alterar Modelo 3D' : 'Adicionar Modelo 3D'}
            </Text>
          </TouchableOpacity>
          {model3dUrl && (
            <View style={styles.fileTag}>
              <Ionicons name="cube" size={16} color="#16a34a" />
              <Text style={styles.fileTagText}>Modelo 3D adicionado</Text>
              <TouchableOpacity onPress={() => setModel3dUrl('')}>
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
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
  placeholderText: {
    color: '#9ca3af',
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  uploadButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  fileTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  fileTagText: {
    flex: 1,
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
});
