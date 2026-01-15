import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { refundApi, RefundReason } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

const REFUND_REASONS: { value: RefundReason; label: string; description: string }[] = [
  { value: 'defective_product', label: 'Produto Defeituoso', description: 'O produto chegou com defeito ou danificado' },
  { value: 'wrong_item', label: 'Item Errado', description: 'Recebi um produto diferente do que comprei' },
  { value: 'not_as_described', label: 'Diferente da Descrição', description: 'O produto não corresponde à descrição' },
  { value: 'changed_mind', label: 'Mudei de Ideia', description: 'Não quero mais o produto' },
  { value: 'late_delivery', label: 'Atraso na Entrega', description: 'O produto chegou muito atrasado' },
  { value: 'other', label: 'Outro Motivo', description: 'Outro motivo não listado' },
];

export default function RefundRequestScreen() {
  const { paymentId, amount, sellerName, orderNumber } = useLocalSearchParams<{
    paymentId: string;
    amount: string;
    sellerName: string;
    orderNumber: string;
  }>();
  const router = useRouter();
  const { authToken } = useAppStore();

  const [selectedReason, setSelectedReason] = useState<RefundReason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!authToken || !paymentId || !selectedReason) {
      Alert.alert('Erro', 'Selecione um motivo para o reembolso');
      return;
    }

    Alert.alert(
      'Confirmar Solicitação',
      'Deseja enviar esta solicitação de reembolso? O vendedor será notificado e analisará seu pedido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              await refundApi.createRefundRequest(
                authToken,
                parseInt(paymentId),
                selectedReason,
                description || undefined
              );
              Alert.alert(
                'Solicitação Enviada',
                'Sua solicitação de reembolso foi enviada com sucesso. O vendedor irá analisar e responder em breve.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Falha ao enviar solicitação');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Solicitar Reembolso</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pedido:</Text>
            <Text style={styles.infoValue}>#{orderNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vendedor:</Text>
            <Text style={styles.infoValue}>{sellerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valor:</Text>
            <Text style={styles.infoValueHighlight}>R$ {parseFloat(amount || '0').toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motivo do Reembolso</Text>
          <Text style={styles.sectionSubtitle}>Selecione o motivo que melhor descreve sua solicitação</Text>

          {REFUND_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              style={[
                styles.reasonCard,
                selectedReason === reason.value && styles.reasonCardSelected,
              ]}
              onPress={() => setSelectedReason(reason.value)}
            >
              <View style={styles.reasonRadio}>
                {selectedReason === reason.value ? (
                  <Ionicons name="radio-button-on" size={24} color="#D4AF37" />
                ) : (
                  <Ionicons name="radio-button-off" size={24} color="#ccc" />
                )}
              </View>
              <View style={styles.reasonContent}>
                <Text style={styles.reasonLabel}>{reason.label}</Text>
                <Text style={styles.reasonDescription}>{reason.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição Adicional</Text>
          <Text style={styles.sectionSubtitle}>Opcional: forneça mais detalhes sobre sua solicitação</Text>
          <TextInput
            style={styles.descriptionInput}
            multiline
            numberOfLines={4}
            placeholder="Descreva o problema em detalhes..."
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.warningCard}>
          <Ionicons name="information-circle" size={24} color="#FFA500" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Como funciona</Text>
            <Text style={styles.warningText}>
              1. Sua solicitação será enviada ao vendedor{'\n'}
              2. O vendedor analisará e responderá{'\n'}
              3. Se aprovado, o reembolso será processado automaticamente
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!selectedReason || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!selectedReason || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Enviar Solicitação</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoValueHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  reasonCard: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  reasonCardSelected: {
    borderColor: '#D4AF37',
    backgroundColor: '#FFF9E6',
  },
  reasonRadio: {
    marginRight: 12,
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reasonDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    backgroundColor: '#fafafa',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 32,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
