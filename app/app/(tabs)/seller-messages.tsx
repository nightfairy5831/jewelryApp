import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { messageApi, type QAMessage } from '../../services/api';

export default function SellerMessagesScreen() {
  const router = useRouter();
  const { authToken } = useAppStore();
  const { user: currentUser } = useCurrentUser();

  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedMessage, setSelectedMessage] = useState<QAMessage | null>(null);
  const [answerModalVisible, setAnswerModalVisible] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (authToken) {
      fetchMessages();
    }
  }, [authToken]);

  const fetchMessages = async () => {
    if (!authToken) return;

    try {
      setError(null);
      const response = await messageApi.getMyMessages(authToken);
      setMessages(response || []);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (message: QAMessage) => {
    setSelectedMessage(message);
    setAnswerText('');
    setAnswerModalVisible(true);
  };

  const submitAnswer = async () => {
    if (!authToken || !selectedMessage) return;

    if (!answerText.trim()) {
      Alert.alert('Erro', 'Digite uma resposta');
      return;
    }

    setActionLoading(true);

    try {
      await messageApi.answerQuestion(authToken, selectedMessage.id, answerText.trim());
      Alert.alert('Sucesso!', 'Resposta enviada com sucesso');
      setAnswerModalVisible(false);
      setSelectedMessage(null);
      setAnswerText('');
      fetchMessages();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao enviar resposta');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (message: QAMessage) => {
    Alert.alert(
      'Excluir Mensagem',
      'Tem certeza que deseja excluir esta mensagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (!authToken) return;
            try {
              await messageApi.delete(authToken, message.id);
              Alert.alert('Sucesso', 'Mensagem excluída');
              fetchMessages();
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Falha ao excluir mensagem');
            }
          },
        },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Mensagens</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Messages List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.content}
        contentContainerStyle={styles.messagesContainer}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Carregando mensagens...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMessages}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>Nenhuma mensagem</Text>
            <Text style={styles.emptySubtext}>
              Você ainda não recebeu perguntas de clientes
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <View key={message.id} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <View style={styles.messageUserInfo}>
                  <Ionicons name="person-circle-outline" size={24} color="#2563eb" />
                  <View style={styles.messageUserDetails}>
                    <Text style={styles.messageUserName}>{message.from_user_name}</Text>
                    <Text style={styles.messageDate}>
                      {message.created_at && new Date(message.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.messageContent}>
                <Text style={styles.messageLabel}>Pergunta:</Text>
                <Text style={styles.messageQuestion}>{message.question}</Text>
              </View>

              {message.answer ? (
                <View style={styles.answerContent}>
                  <Text style={styles.answerLabel}>Sua resposta:</Text>
                  <Text style={styles.answerText}>{message.answer}</Text>
                  {message.answered_at && (
                    <Text style={styles.answerDate}>
                      Respondido em{' '}
                      {new Date(message.answered_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.messageActions}>
                  <TouchableOpacity
                    style={styles.answerButton}
                    onPress={() => handleAnswer(message)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                    <Text style={styles.answerButtonText}>Responder</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(message)}
              >
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Answer Modal */}
      <Modal
        visible={answerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAnswerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Responder Pergunta</Text>
            <Text style={styles.modalSubtitle}>De: {selectedMessage?.from_user_name}</Text>

            <View style={styles.modalQuestionBox}>
              <Text style={styles.modalQuestionLabel}>Pergunta:</Text>
              <Text style={styles.modalQuestionText}>{selectedMessage?.question}</Text>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Sua resposta *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Digite sua resposta..."
                value={answerText}
                onChangeText={setAnswerText}
                editable={!actionLoading}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setAnswerModalVisible(false)}
                disabled={actionLoading}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={submitAnswer}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Enviar</Text>
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
  content: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  messageUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageUserDetails: {
    marginLeft: 8,
    flex: 1,
  },
  messageUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  messageDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  productBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    maxWidth: 120,
  },
  productName: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  messageContent: {
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  messageQuestion: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  answerContent: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 6,
  },
  answerText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    marginBottom: 8,
  },
  answerDate: {
    fontSize: 11,
    color: '#16a34a',
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  answerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
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
    marginBottom: 16,
  },
  modalQuestionBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalQuestionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  modalQuestionText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  modalInputGroup: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    height: 100,
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
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
