import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useAppStore } from '../../store/useAppStore';
import { API_CONFIG } from '../../config/api';

export default function UploadScreen() {
  const { authToken } = useAppStore();
  const isAuthenticated = !!authToken;
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map(asset => asset.uri);
        setImages([...images, ...uris]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick images');
    }
  };

  const pickVideos = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map(asset => asset.uri);
        setVideos([...videos, ...uris]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick videos');
    }
  };

  const pick3DModels = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access media library');
        return;
      }

      // Pick any file type from media library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        // Filter for 3D model files (GLB, GLTF)
        const modelUris = result.assets
          .filter(asset => {
            const uri = asset.uri.toLowerCase();
            return uri.endsWith('.glb') || uri.endsWith('.gltf') || uri.endsWith('.obj');
          })
          .map(asset => asset.uri);

        if (modelUris.length === 0) {
          Alert.alert('No 3D Models', 'Please select GLB, GLTF, or OBJ files');
          return;
        }

        setModels([...models, ...modelUris]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick 3D models');
    }
  };

  const uploadFiles = async () => {
    if (!authToken || !isAuthenticated) {
      Alert.alert('Authentication Required', 'Please login to upload files');
      return;
    }

    if (images.length === 0 && videos.length === 0 && models.length === 0) {
      Alert.alert('No Files', 'Please select at least one file to upload');
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];

    try {
      // Upload images
      for (const imageUri of images) {
        const result = await uploadSingleFile(imageUri, 'image');
        if (result) uploaded.push(result);
      }

      // Upload videos
      for (const videoUri of videos) {
        const result = await uploadSingleFile(videoUri, 'video');
        if (result) uploaded.push(result);
      }

      // Upload 3D models
      for (const modelUri of models) {
        const result = await uploadSingleFile(modelUri, '3d_model');
        if (result) uploaded.push(result);
      }

      setUploadedUrls(uploaded);
      Alert.alert(
        'Upload Complete',
        `Successfully uploaded ${uploaded.length} files to Cloudflare R2`,
        [
          {
            text: 'OK',
            onPress: () => {
              setImages([]);
              setVideos([]);
              setModels([]);
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const uploadSingleFile = async (uri: string, type: 'image' | 'video' | '3d_model'): Promise<string | null> => {
    try {
      // Determine file extension and mime type
      const fileName = uri.split('/').pop() || 'file';
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      const mimeType = getMimeType(fileExtension, type);

      // Create form data
      const formData = new FormData();

      // Add file to form data
      const file: any = {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: fileName,
        type: mimeType,
      };

      formData.append('file', file);
      formData.append('type', type);

      // Upload to backend which will handle R2 upload
      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/r2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      console.error('Upload Error:', error);
      return null;
    }
  };

  const getMimeType = (extension: string, type: 'image' | 'video' | '3d_model'): string => {
    if (type === 'image') {
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'webp':
          return 'image/webp';
        default:
          return 'image/jpeg';
      }
    }

    if (type === 'video') {
      switch (extension) {
        case 'mp4':
          return 'video/mp4';
        case 'mov':
          return 'video/quicktime';
        case 'avi':
          return 'video/x-msvideo';
        case 'webm':
          return 'video/webm';
        default:
          return 'video/mp4';
      }
    }

    if (type === '3d_model') {
      switch (extension) {
        case 'glb':
          return 'model/gltf-binary';
        case 'gltf':
          return 'model/gltf+json';
        case 'obj':
          return 'model/obj';
        default:
          return 'model/gltf-binary';
      }
    }

    return 'application/octet-stream';
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const removeModel = (index: number) => {
    setModels(models.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload para Cloudflare R2</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Upload Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
            <Ionicons name="image" size={24} color="#fff" />
            <Text style={styles.uploadButtonText}>Selecionar Imagens</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton} onPress={pickVideos}>
            <Ionicons name="videocam" size={24} color="#fff" />
            <Text style={styles.uploadButtonText}>Selecionar Vídeos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton} onPress={pick3DModels}>
            <Ionicons name="cube" size={24} color="#fff" />
            <Text style={styles.uploadButtonText}>Selecionar Modelos 3D</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Images */}
        {images.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Imagens Selecionadas ({images.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((uri, index) => (
                <View key={index} style={styles.previewItem}>
                  <Image source={{ uri }} style={styles.previewImage} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#f00" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Selected Videos */}
        {videos.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Vídeos Selecionados ({videos.length})</Text>
            {videos.map((uri, index) => (
              <View key={index} style={styles.fileItem}>
                <Ionicons name="videocam" size={24} color="#666" />
                <Text style={styles.fileName} numberOfLines={1}>
                  {uri.split('/').pop()}
                </Text>
                <TouchableOpacity onPress={() => removeVideo(index)}>
                  <Ionicons name="close-circle" size={24} color="#f00" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Selected 3D Models */}
        {models.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Modelos 3D Selecionados ({models.length})</Text>
            {models.map((uri, index) => (
              <View key={index} style={styles.fileItem}>
                <Ionicons name="cube" size={24} color="#666" />
                <Text style={styles.fileName} numberOfLines={1}>
                  {uri.split('/').pop()}
                </Text>
                <TouchableOpacity onPress={() => removeModel(index)}>
                  <Ionicons name="close-circle" size={24} color="#f00" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Upload Progress */}
        {uploading && (
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Enviando arquivos...</Text>
            <ActivityIndicator size="large" color="#000" />
          </View>
        )}

        {/* Uploaded URLs */}
        {uploadedUrls.length > 0 && (
          <View style={styles.successSection}>
            <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
            <Text style={styles.successTitle}>Upload Concluído!</Text>
            <Text style={styles.successText}>{uploadedUrls.length} arquivos enviados</Text>
          </View>
        )}

        {/* Upload All Button */}
        {(images.length > 0 || videos.length > 0 || models.length > 0) && !uploading && (
          <TouchableOpacity
            style={styles.uploadAllButton}
            onPress={uploadFiles}
          >
            <Ionicons name="cloud-upload" size={24} color="#fff" />
            <Text style={styles.uploadAllButtonText}>
              Enviar Todos ({images.length + videos.length + models.length})
            </Text>
          </TouchableOpacity>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#2563eb" />
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>✅ Funciona no Expo Go</Text>
            <Text style={styles.infoText}>• Suporta imagens, vídeos e modelos 3D</Text>
            <Text style={styles.infoText}>• Todos os tipos de arquivo usam o mesmo sistema</Text>
            <Text style={styles.infoText}>• Upload direto para Cloudflare R2</Text>
            <Text style={styles.infoTextNote}>Nota: Arquivos 3D devem estar na galeria de fotos</Text>
          </View>
        </View>
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  buttonSection: {
    gap: 12,
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  previewItem: {
    marginRight: 12,
    position: 'relative',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  progressSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  successSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 12,
  },
  successText: {
    fontSize: 14,
    color: '#15803d',
    marginTop: 4,
  },
  uploadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  uploadAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 4,
  },
  infoTextNote: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
