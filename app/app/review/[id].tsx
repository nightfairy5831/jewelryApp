import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../../store/useAppStore';
import { API_CONFIG } from '../../config/api';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams();
  const { authToken } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) return null;

    const formData = new FormData();
    const file: any = {
      uri: imageUri,
      name: imageUri.split('/').pop() || 'image.jpg',
      type: 'image/jpeg',
    };

    formData.append('file', file);
    formData.append('type', 'image');

    const response = await fetch(`${API_CONFIG.BASE_URL}/upload/r2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return data.url;
    }

    throw new Error('Failed to upload image');
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Avaliação obrigatória', 'Por favor, selecione uma avaliação');
      return;
    }

    setSubmitting(true);
    try {
      // Upload image if selected
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage();
        setUploadedImageUrl(imageUrl);
      }

      // Submit review
      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          rating,
          description,
          image: imageUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso', 'Avaliação enviada com sucesso!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Erro', data.error || 'Falha ao enviar avaliação');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avaliar Produto</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Product Info */}
        {product && (
          <View style={styles.productSection}>
            <Image
              source={{ uri: product.images?.[0] || 'https://via.placeholder.com/100' }}
              style={styles.productImage}
              contentFit="cover"
            />
            <Text style={styles.productName}>{product.name}</Text>
          </View>
        )}

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avaliação *</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#fbbf24' : '#d1d5db'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adicionar Foto (Opcional)</Text>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.uploadedImage} contentFit="cover" />
            ) : (
              <View style={styles.imageButtonContent}>
                <Ionicons name="camera" size={32} color="#6b7280" />
                <Text style={styles.imageButtonText}>Adicionar Foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comentário (Opcional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Compartilhe sua experiência com este produto..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.characterCount}>{description.length}/1000</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Enviar Avaliação</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 8 },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  productSection: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: { width: 100, height: 100, borderRadius: 12, marginBottom: 12 },
  productName: { fontSize: 18, fontWeight: '600', color: '#111827', textAlign: 'center' },
  section: { backgroundColor: '#fff', padding: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  starButton: { padding: 4 },
  imageButton: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageButtonContent: { alignItems: 'center' },
  imageButtonText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  uploadedImage: { width: '100%', height: '100%' },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
  },
  characterCount: { fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 4 },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#000',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
