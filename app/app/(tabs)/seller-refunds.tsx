import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { refundApi, SellerRefundRequest } from '../../services/api';

const REASON_LABELS: Record<string, string> = {
  defective_product: 'Produto Defeituoso',
  wrong_item: 'Item Errado',
  not_as_described: 'Diferente da Descrição',
  changed_mind: 'Mudou de Ideia',
  late_delivery: 'Atraso na Entrega',
  other: 'Outro',
};

export default function SellerRefundsScreen() {
  const router = useRouter();
  const { authToken } = useAppStore();
  const { user: currentUser } = useCurrentUser();

  const [refunds, setRefunds] = useState<SellerRefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  const [selectedRefund, setSelectedRefund] = useState<SellerRefundRequest | null>(null);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseAction, setResponseAction] = useState<'approve' | 'reject'>('approve');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authToken) {
      fetchRefunds();
    }
  }, [authToken]);

  const fetchRefunds = async () => {
    if (!authToken) return;

    try {
      const response = await refundApi.getSellerRefunds(authToken);
      setRefunds(response.refund_requests);
    } catch (err: any) {
      console.error('Error fetching refunds:', err);
      Alert.alert('Erro', err.message || 'Falha ao carregar reembolsos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRefunds();
  };

  const handleApprove = (refund: SellerRefundRequest) => {
    setSelectedRefund(refund);
    setResponseAction('approve');
    setResponseText('');
    setResponseModalVisible(true);
  };

  const handleReject = (refund: SellerRefundRequest) => {
    setSelectedRefund(refund);
    setResponseAction('reject');
    setResponseText('');
    setResponseModalVisible(true);
  };

  const submitResponse = async () => {
    if (!authToken || !selectedRefund) return;

    if (responseAction === 'reject' && !responseText.trim()) {
      Alert.alert('Erro', 'Por favor, forneça um motivo para rejeitar o reembolso');
      return;
    }

    setSubmitting(true);

    try {
      if (responseAction === 'approve') {
        await refundApi.approveRefund(authToken, selectedRefund.id, responseText || undefined);
        Alert.alert('Sucesso', 'Reembolso aprovado e processado com sucesso');
      } else {
        await refundApi.rejectRefund(authToken, selectedRefund.id, responseText);
        Alert.alert('Sucesso', 'Solicitação de reembolso rejeitada');
      }

      setResponseModalVisible(false);
      setSelectedRefund(null);
      fetchRefunds();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao processar solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f97316';
      case 'approved': return '#2563eb';
      case 'rejected': return '#dc2626';
      case 'refunded': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };

  const filteredRefunds = filterStatus === 'all'
    ? refunds
    : refunds.filter(r => r.status === filterStatus);

  const pendingCount = refunds.filter(r => r.status === 'pending').length;

  if (!currentUser || currentUser.role !== 'seller') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Acesso restrito a vendedores</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/seller-dashboard')}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reembolsos</Text>
        {pendingCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'pending', label: 'Pendentes' },
          { key: 'refunded', label: 'Reembolsados' },
          { key: 'rejected', label: 'Rejeitados' },
          { key: 'all', label: 'Todos' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              filterStatus === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setFilterStatus(filter.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Refunds List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D4AF37']} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : filteredRefunds.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="return-down-back-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>Nenhuma solicitação</Text>
            <Text style={styles.emptySubtext}>
              {filterStatus === 'pending'
                ? 'Nenhuma solicitação de reembolso pendente'
                : 'Nenhuma solicitação encontrada'}
            </Text>
          </View>
        ) : (
          <View style={styles.refundsContainer}>
            {filteredRefunds.map((refund) => (
              <View key={refund.id} style={styles.refundCard}>
                {/* Header */}
                <View style={styles.refundHeader}>
                  <View>
                    <Text style={styles.orderNumber}>Pedido #{refund.order_number}</Text>
                    <Text style={styles.refundDate}>
                      {new Date(refund.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(refund.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(refund.status) }]}>
                      {getStatusLabel(refund.status)}
                    </Text>
                  </View>
                </View>

                {/* Buyer Info */}
                <View style={styles.buyerInfo}>
                  <Ionicons name="person-outline" size={16} color="#6b7280" />
                  <Text style={styles.buyerText}>{refund.buyer_name}</Text>
                  {refund.buyer_email && (
                    <Text style={styles.buyerEmail}> • {refund.buyer_email}</Text>
                  )}
                </View>

                {/* Amount */}
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Valor do Reembolso:</Text>
                  <Text style={styles.amountValue}>R$ {Number(refund.amount).toFixed(2)}</Text>
                </View>

                {/* Reason */}
                <View style={styles.reasonContainer}>
                  <Text style={styles.reasonLabel}>Motivo:</Text>
                  <Text style={styles.reasonValue}>{REASON_LABELS[refund.reason] || refund.reason}</Text>
                </View>

                {/* Description */}
                {refund.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Descrição:</Text>
                    <Text style={styles.descriptionValue}>{refund.description}</Text>
                  </View>
                )}

                {/* Platform Fee Info */}
                {refund.status === 'pending' && (
                  <View style={styles.feeInfoContainer}>
                    <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
                    <Text style={styles.feeInfoText}>
                      {['defective_product', 'wrong_item', 'not_as_described'].includes(refund.reason)
                        ? 'Taxa da plataforma será devolvida'
                        : 'Taxa da plataforma será retida'}
                    </Text>
                  </View>
                )}

                {/* Seller Response */}
                {refund.seller_response && (
                  <View style={styles.responseContainer}>
                    <Text style={styles.responseLabel}>Sua resposta:</Text>
                    <Text style={styles.responseValue}>{refund.seller_response}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                {refund.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReject(refund)}
                    >
                      <Ionicons name="close" size={18} color="#dc2626" />
                      <Text style={styles.rejectButtonText}>Rejeitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApprove(refund)}
                    >
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={styles.approveButtonText}>Aprovar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Response Modal */}
      <Modal
        visible={responseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResponseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {responseAction === 'approve' ? 'Aprovar Reembolso' : 'Rejeitar Reembolso'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Pedido #{selectedRefund?.order_number} • R$ {Number(selectedRefund?.amount || 0).toFixed(2)}
            </Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>
                {responseAction === 'approve'
                  ? 'Mensagem para o comprador (opcional)'
                  : 'Motivo da rejeição (obrigatório)'}
              </Text>
              <TextInput
                style={styles.modalInput}
                multiline
                numberOfLines={4}
                placeholder={
                  responseAction === 'approve'
                    ? 'Ex: Reembolso aprovado, pedimos desculpas pelo inconveniente.'
                    : 'Ex: O produto foi entregue conforme descrito...'
                }
                value={responseText}
                onChangeText={setResponseText}
                editable={!submitting}
                textAlignVertical="top"
              />
            </View>

            {responseAction === 'approve' && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={20} color="#f97316" />
                <Text style={styles.warningText}>
                  Ao aprovar, o reembolso será processado automaticamente via Mercado Pago.
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setResponseModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  responseAction === 'reject' && styles.modalRejectButton,
                ]}
                onPress={submitResponse}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {responseAction === 'approve' ? 'Aprovar' : 'Rejeitar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  badgeContainer: {
    position: 'absolute',
    right: 60,
    top: 12,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#D4AF37',
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: '#D4AF37',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  refundsContainer: {
    padding: 16,
    gap: 12,
  },
  refundCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  refundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  refundDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  buyerText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  buyerEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  reasonContainer: {
    paddingVertical: 8,
  },
  reasonLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  reasonValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  descriptionContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  descriptionValue: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  feeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  feeInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
  },
  responseContainer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  responseLabel: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 4,
  },
  responseValue: {
    fontSize: 14,
    color: '#166534',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff7ed',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#c2410c',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  modalRejectButton: {
    backgroundColor: '#dc2626',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
