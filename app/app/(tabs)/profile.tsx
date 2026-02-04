import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { router } from 'expo-router';
import type { Order } from '../../services/api';
import { uploadApi } from '../../services/api';
import OrderCard from '../../components/order/OrderCard';
import * as ImagePicker from 'expo-image-picker';

const userIcon = require('../../assets/user.png');

interface Review {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

export default function PerfilScreen() {
  const { logout, authToken, orders, fetchOrders, updateProfile } = useAppStore();
  const { user: currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'compras' | 'avaliacoes'>('compras');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (authToken && activeTab === 'compras') {
      fetchOrders();
    }
  }, [authToken, activeTab]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.replace('/auth/login');
    }
  }, [currentUser]);

  const handleEditProfile = () => {
    setEditName(currentUser.name || '');
    setEditPhone(currentUser.phone || '');
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Erro', 'O nome não pode ficar vazio');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ name: editName.trim(), phone: editPhone.trim() || undefined });
      setEditingProfile(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const file = {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: `avatar-${Date.now()}.jpg`,
      };
      const uploadResponse = await uploadApi.uploadAvatar(file);
      await updateProfile({ avatar_url: uploadResponse.url });
      Alert.alert('Sucesso', 'Foto atualizada com sucesso');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigate to main catalog/index page explicitly
              // This prevents briefly showing the profile guest screen
              router.replace('/(tabs)/');
            } catch (error) {
              console.error('Logout failed:', error);
              // Navigate even if logout fails
              router.replace('/(tabs)/');
            }
          },
        },
      ]
    );
  };

  if (!currentUser) {
    return null;
  }

  const handleViewReason = (order: Order) => {
    Alert.alert('Motivo do cancelamento', order.cancellation_reason || 'Sem motivo informado');
  };

  const handleConfirmDelivery = async (order: Order) => {
    Alert.alert(
      'Confirmar entrega',
      'Confirma que recebeu o pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => {
          // TODO: Call API to confirm delivery
        }},
      ]
    );
  };

  const renderComprasTab = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

    if (orders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="bag-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>Nenhuma compra realizada</Text>
        </View>
      );
    }

    return (
      <View style={styles.orderList}>
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            viewType="buyer"
            onViewReason={handleViewReason}
            onConfirmDelivery={handleConfirmDelivery}
          />
        ))}
      </View>
    );
  };

  const renderAvaliacoesTab = () => {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="star-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyStateText}>Nenhuma avaliação</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleChangeAvatar} disabled={uploadingAvatar}>
            <Image
              source={currentUser.avatar ? { uri: currentUser.avatar } : userIcon}
              style={styles.avatarImage}
            />
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{currentUser.name}</Text>
            <Text style={styles.userCreatedDate}>
              Desde {currentUser.createdAt ? new Date(currentUser.createdAt).getFullYear() : 'N/A'}
            </Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={handleLogout}>
            <Ionicons name="ellipsis-vertical" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Edit Profile Button / Form */}
        {editingProfile ? (
          <View style={styles.editProfileSection}>
            <View style={styles.editInputGroup}>
              <Text style={styles.editLabel}>Nome</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Seu nome"
                placeholderTextColor="#B3B3B3"
              />
            </View>
            <View style={styles.editInputGroup}>
              <Text style={styles.editLabel}>Telefone</Text>
              <TextInput
                style={styles.editInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Seu telefone"
                placeholderTextColor="#B3B3B3"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.editButtonsRow}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => setEditingProfile(false)}
              >
                <Text style={styles.editCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSaveButton, savingProfile && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.editSaveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={18} color="#111827" />
            <Text style={styles.editProfileButtonText}>Editar perfil</Text>
          </TouchableOpacity>
        )}

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'compras' && styles.tabActive]}
            onPress={() => setActiveTab('compras')}
          >
            <Text style={[styles.tabText, activeTab === 'compras' && styles.tabTextActive]}>
              Compras
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'avaliacoes' && styles.tabActive]}
            onPress={() => setActiveTab('avaliacoes')}
          >
            <Text style={[styles.tabText, activeTab === 'avaliacoes' && styles.tabTextActive]}>
              Avaliações
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'compras' && renderComprasTab()}
          {activeTab === 'avaliacoes' && renderAvaliacoesTab()}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButtonFooter} onPress={() => router.push('/(tabs)')}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1, marginBottom: 80 },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginRight: 16,
  },
  avatarImage: { width: 80, height: 80 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  userCreatedDate: { fontSize: 14, color: '#6b7280' },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  editProfileSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  editInputGroup: {
    marginBottom: 12,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  editInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 15,
    color: '#111827',
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  editCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  editSaveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#000' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  tabContent: { padding: 16, paddingBottom: 100 },
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 14, color: '#6b7280', marginTop: 12 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  backButtonFooter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: { gap: 12 },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  orderNumber: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  purchaseDate: { fontSize: 12, color: '#9ca3af' },
  reviewButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewButtonDisabled: { backgroundColor: '#e5e7eb' },
  reviewButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  reviewButtonTextDisabled: { color: '#9ca3af' },
  wishlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wishlistCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  wishlistImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
  },
  removeWishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 6,
  },
  wishlistInfo: {
    padding: 10,
  },
  wishlistProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  wishlistPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  // Order card styles
  orderList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderItemRatingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  orderStatusMessage: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  orderCardFooter: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderFooterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  orderFooterButtonBlue: {
    backgroundColor: '#2563eb',
  },
  orderFooterButtonBlack: {
    backgroundColor: '#000',
  },
  orderFooterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  orderFooterButtonTextWhite: {
    color: '#fff',
  },
});
