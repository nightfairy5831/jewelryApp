import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { router, useLocalSearchParams } from 'expo-router';
import { messageApi, QAMessage } from '../../services/api';

export default function Forum() {
  const { sellerId, sellerName } = useLocalSearchParams<{ sellerId: string; sellerName: string }>();
  const { currentUser, authToken } = useAppStore();
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [answeringId, setAnsweringId] = useState<number | null>(null);

  const sellerIdNum = sellerId ? parseInt(sellerId, 10) : null;
  const decodedSellerName = sellerName ? decodeURIComponent(sellerName) : 'Vendedor';

  useEffect(() => {
    if (sellerIdNum && authToken) {
      loadMessages();
    } else {
      setLoading(false);
    }
  }, [sellerIdNum, authToken]);

  const loadMessages = async () => {
    if (!authToken || !sellerIdNum) return;
    try {
      setLoading(true);
      const data = await messageApi.getBySeller(authToken, sellerIdNum);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleCreateQuestion = async () => {
    if (!authToken) {
      Alert.alert('Login necessário', 'Faça login para enviar uma pergunta', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    if (!newQuestionText.trim() || !sellerIdNum) return;
    try {
      await messageApi.createQuestion(authToken, sellerIdNum, newQuestionText);
      setNewQuestionText('');
      setShowNewQuestion(false);
      Alert.alert('Sucesso', 'Pergunta enviada com sucesso!');
      loadMessages();
    } catch (error) {
      console.error('Failed to create question:', error);
      Alert.alert('Erro', 'Não foi possível enviar a pergunta');
    }
  };

  const handleAnswer = async (messageId: number) => {
    if (!answerText.trim() || !authToken) return;
    try {
      await messageApi.answerQuestion(authToken, messageId, answerText);
      setAnswerText('');
      setAnsweringId(null);
      Alert.alert('Sucesso', 'Resposta enviada com sucesso!');
      loadMessages();
    } catch (error) {
      console.error('Failed to answer:', error);
      Alert.alert('Erro', 'Não foi possível enviar a resposta');
    }
  };

  const handleNewQuestionPress = () => {
    if (!authToken) {
      Alert.alert('Login necessário', 'Faça login para enviar uma pergunta', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    setShowNewQuestion(true);
  };

  const isCurrentUserSeller = currentUser?.id === sellerIdNum;

  if (!sellerIdNum) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perguntas</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>Vendedor não encontrado</Text>
          <Text style={styles.emptyStateText}>Volte para a página do produto</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perguntas para {decodedSellerName}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>Nenhuma pergunta ainda</Text>
            <Text style={styles.emptyStateText}>
              {isCurrentUserSeller
                ? 'Você ainda não recebeu perguntas de compradores.'
                : 'Seja o primeiro a fazer uma pergunta para este vendedor!'}
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <View key={message.id} style={styles.qaCard}>
              {/* Question */}
              <Text style={styles.questionText} numberOfLines={2}>{message.question}</Text>

              {/* Answer */}
              {message.answer ? (
                <Text style={styles.answerText} numberOfLines={2}>{message.answer}</Text>
              ) : isCurrentUserSeller ? (
                answeringId === message.id ? (
                  <View style={styles.answerInputSection}>
                    <TextInput
                      style={styles.answerInput}
                      placeholder="Digite sua resposta..."
                      value={answerText}
                      onChangeText={setAnswerText}
                      multiline
                      maxLength={1000}
                    />
                    <View style={styles.answerActions}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => { setAnsweringId(null); setAnswerText(''); }}
                      >
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sendBtn, !answerText.trim() && styles.sendBtnDisabled]}
                        onPress={() => handleAnswer(message.id)}
                        disabled={!answerText.trim()}
                      >
                        <Text style={styles.sendBtnText}>Responder</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.answerBtn}
                    onPress={() => setAnsweringId(message.id)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color="#000000" />
                    <Text style={styles.answerBtnText}>Responder</Text>
                  </TouchableOpacity>
                )
              ) : (
                <View style={styles.pendingAnswer}>
                  <Text style={styles.pendingAnswerText}>Aguardando resposta do vendedor...</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* New Question Modal - Centered */}
      {showNewQuestion && (
        <View style={styles.modalOverlay}>
          <View style={styles.newQuestionContainer}>
            <View style={styles.newQuestionHeader}>
              <Text style={styles.newQuestionTitle}>Pergunte ao vendedor</Text>
              <TouchableOpacity onPress={() => setShowNewQuestion(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.newQuestionInput}
              placeholder="Digite sua pergunta..."
              value={newQuestionText}
              onChangeText={setNewQuestionText}
              multiline
              maxLength={1000}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalButton, !newQuestionText.trim() && styles.modalButtonDisabled]}
              onPress={handleCreateQuestion}
              disabled={!newQuestionText.trim()}
            >
              <Text style={styles.modalButtonText}>Criar pergunta</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Footer with Create Button - Similar to Register page */}
      {!isCurrentUserSeller && !showNewQuestion && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleNewQuestionPress}
          >
            <Text style={styles.createButtonText}>Adicionar pergunta</Text>
          </TouchableOpacity>
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  qaCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  questionSection: {
    marginBottom: 12,
  },
  qaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sellerAvatar: {
    backgroundColor: '#10b981',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  qaHeaderInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteBtn: {
    padding: 8,
  },
  questionText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  answerText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
    height: 44,
    paddingLeft: 16,
  },
  pendingAnswer: {
    height: 44,
    justifyContent: 'center',
    paddingLeft: 16,
  },
  pendingAnswerText: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
  },
  answerBtnText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  answerInputSection: {
    marginTop: 12,
  },
  answerInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  answerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#6b7280',
  },
  sendBtn: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendBtnText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newQuestionContainer: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  newQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  newQuestionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  newQuestionInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    maxHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#000000',
    height: 40,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 20,
  },
  createButton: {
    backgroundColor: '#000000',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
