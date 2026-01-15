import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { paymentApi, CardDetails, SellerPayment } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

type PaymentMethod = 'credit_card' | 'pix';

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { authToken, fetchOrders } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [paymentStatus, setPaymentStatus] = useState<'input' | 'processing' | 'completed' | 'failed'>('input');
  const [sellerPayments, setSellerPayments] = useState<SellerPayment[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expirationMonth, setExpirationMonth] = useState('');
  const [expirationYear, setExpirationYear] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardholderDocument, setCardholderDocument] = useState(''); // CPF

  // PIX state
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19);
  };

  const formatCPF = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const validateCardForm = (): boolean => {
    if (cardNumber.replace(/\s/g, '').length < 13) {
      Alert.alert('Erro', 'Número do cartão inválido');
      return false;
    }
    if (!expirationMonth || !expirationYear) {
      Alert.alert('Erro', 'Data de validade inválida');
      return false;
    }
    if (securityCode.length < 3) {
      Alert.alert('Erro', 'CVV inválido');
      return false;
    }
    if (cardholderName.length < 3) {
      Alert.alert('Erro', 'Nome do titular inválido');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!authToken || !orderId) return;

    if (paymentMethod === 'credit_card' && !validateCardForm()) {
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');
    setError(null);

    try {
      const cardDetails: CardDetails | undefined = paymentMethod === 'credit_card' ? {
        card_number: cardNumber.replace(/\s/g, ''),
        expiration_month: expirationMonth.padStart(2, '0'),
        expiration_year: expirationYear.length === 2 ? `20${expirationYear}` : expirationYear,
        security_code: securityCode,
        cardholder_name: cardholderName,
        cardholder_document: cardholderDocument.replace(/\D/g, ''),
      } : undefined;

      const response = await paymentApi.createPaymentIntent(
        authToken,
        parseInt(orderId),
        paymentMethod,
        cardDetails
      );

      setSellerPayments(response.payments);

      if (response.status === 'completed') {
        setPaymentStatus('completed');
        await fetchOrders();
        Alert.alert(
          'Pagamento Concluído!',
          'Seu pagamento foi processado com sucesso.',
          [{ text: 'Ver Pedidos', onPress: () => router.replace('/(tabs)/profile') }]
        );
      } else if (response.status === 'partial_failure') {
        setPaymentStatus('failed');
        setError('Alguns pagamentos falharam. Por favor, tente novamente.');
      } else if (paymentMethod === 'pix') {
        // PIX: Show QR codes for each seller
        const pixPayment = response.payments.find(p => p.pix_qr_code_base64);
        if (pixPayment) {
          setPixQrCode(pixPayment.pix_qr_code_base64 || null);
          setPixCode(pixPayment.pix_qr_code || null);
        }
        setPaymentStatus('input'); // Stay on screen to show PIX codes
      } else {
        // Credit card pending (waiting for webhook)
        setPaymentStatus('processing');
        pollPaymentStatus();
      }
    } catch (error: any) {
      setPaymentStatus('failed');
      setError(error.message || 'Falha ao processar pagamento');
      Alert.alert('Erro', error.message || 'Falha ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async () => {
    if (!authToken || !orderId) return;

    let attempts = 0;
    const maxAttempts = 30; // 30 seconds

    const checkStatus = async () => {
      try {
        const status = await paymentApi.getOrderPaymentStatus(authToken, parseInt(orderId));

        if (status.all_completed) {
          setPaymentStatus('completed');
          await fetchOrders();
          Alert.alert(
            'Pagamento Concluído!',
            'Seu pagamento foi processado com sucesso.',
            [{ text: 'Ver Pedidos', onPress: () => router.replace('/(tabs)/profile') }]
          );
          return;
        }

        const hasFailed = status.payments.some(p => p.status === 'failed');
        if (hasFailed) {
          setPaymentStatus('failed');
          setError('Um ou mais pagamentos falharam');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 1000);
        }
      } catch (e) {
        // Ignore polling errors
      }
    };

    checkStatus();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'failed': return '#F44336';
      default: return '#FFA500';
    }
  };

  const renderPaymentMethodSelector = () => (
    <View style={styles.methodSelector}>
      <Text style={styles.sectionTitle}>Método de Pagamento</Text>
      <View style={styles.methodButtons}>
        <TouchableOpacity
          style={[styles.methodButton, paymentMethod === 'credit_card' && styles.methodButtonActive]}
          onPress={() => setPaymentMethod('credit_card')}
        >
          <Ionicons name="card" size={24} color={paymentMethod === 'credit_card' ? '#fff' : '#333'} />
          <Text style={[styles.methodButtonText, paymentMethod === 'credit_card' && styles.methodButtonTextActive]}>
            Cartão (10%)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodButton, paymentMethod === 'pix' && styles.methodButtonActive]}
          onPress={() => setPaymentMethod('pix')}
        >
          <Ionicons name="qr-code" size={24} color={paymentMethod === 'pix' ? '#fff' : '#333'} />
          <Text style={[styles.methodButtonText, paymentMethod === 'pix' && styles.methodButtonTextActive]}>
            PIX (8%)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCardForm = () => (
    <View style={styles.cardForm}>
      <Text style={styles.sectionTitle}>Dados do Cartão</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Número do Cartão</Text>
        <TextInput
          style={styles.input}
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChangeText={(text) => setCardNumber(formatCardNumber(text))}
          keyboardType="numeric"
          maxLength={19}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Mês</Text>
          <TextInput
            style={styles.input}
            placeholder="MM"
            value={expirationMonth}
            onChangeText={setExpirationMonth}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Ano</Text>
          <TextInput
            style={styles.input}
            placeholder="AA"
            value={expirationYear}
            onChangeText={setExpirationYear}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>CVV</Text>
          <TextInput
            style={styles.input}
            placeholder="123"
            value={securityCode}
            onChangeText={setSecurityCode}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nome no Cartão</Text>
        <TextInput
          style={styles.input}
          placeholder="NOME COMO NO CARTÃO"
          value={cardholderName}
          onChangeText={(text) => setCardholderName(text.toUpperCase())}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>CPF do Titular</Text>
        <TextInput
          style={styles.input}
          placeholder="000.000.000-00"
          value={cardholderDocument}
          onChangeText={(text) => setCardholderDocument(formatCPF(text))}
          keyboardType="numeric"
          maxLength={14}
        />
      </View>
    </View>
  );

  const renderPixInfo = () => (
    <View style={styles.pixContainer}>
      <Text style={styles.sectionTitle}>Pagamento via PIX</Text>

      {pixQrCode ? (
        <View style={styles.pixQrContainer}>
          <Image
            source={{ uri: `data:image/png;base64,${pixQrCode}` }}
            style={styles.pixQrImage}
          />
          <Text style={styles.pixInstructions}>
            Escaneie o QR Code com seu app de banco
          </Text>
          {pixCode && (
            <View style={styles.pixCodeContainer}>
              <Text style={styles.pixCodeLabel}>Ou copie o código:</Text>
              <TouchableOpacity
                style={styles.pixCodeButton}
                onPress={() => {
                  // Copy to clipboard would go here
                  Alert.alert('Código PIX', 'Código copiado!');
                }}
              >
                <Text style={styles.pixCodeText} numberOfLines={2}>
                  {pixCode.substring(0, 50)}...
                </Text>
                <Ionicons name="copy" size={20} color="#C8A870" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.pixPlaceholder}>
          <Ionicons name="qr-code" size={64} color="#ccc" />
          <Text style={styles.pixPlaceholderText}>
            Clique em "Gerar PIX" para criar o código de pagamento
          </Text>
        </View>
      )}
    </View>
  );

  const renderSellerPayments = () => (
    <View style={styles.sellerPaymentsContainer}>
      <Text style={styles.sectionTitle}>Pagamentos por Vendedor</Text>
      {sellerPayments.map((payment, index) => (
        <View key={index} style={styles.sellerPaymentCard}>
          <View style={styles.sellerPaymentHeader}>
            <Text style={styles.sellerName}>{payment.seller_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
              <Text style={styles.statusBadgeText}>{payment.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.sellerPaymentDetails}>
            <Text style={styles.sellerAmount}>R$ {payment.amount.toFixed(2)}</Text>
            <Text style={styles.sellerFee}>Taxa: R$ {payment.application_fee.toFixed(2)}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  if (paymentStatus === 'processing' && loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8A870" />
        <Text style={styles.loadingText}>Processando pagamento...</Text>
        <Text style={styles.loadingSubtext}>Não feche esta tela</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pagamento</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>Pedido #{orderId}</Text>
          </View>

          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={24} color="#F44336" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {paymentStatus === 'completed' ? (
            <View style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={styles.successTitle}>Pagamento Concluído!</Text>
              <Text style={styles.successText}>Seu pedido foi confirmado com sucesso.</Text>
              <TouchableOpacity
                style={styles.viewOrdersButton}
                onPress={() => router.replace('/(tabs)/profile')}
              >
                <Text style={styles.viewOrdersButtonText}>Ver Meus Pedidos</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {renderPaymentMethodSelector()}

              {paymentMethod === 'credit_card' ? renderCardForm() : renderPixInfo()}

              {sellerPayments.length > 0 && renderSellerPayments()}

              <View style={styles.feeInfo}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.feeInfoText}>
                  {paymentMethod === 'credit_card'
                    ? 'Taxa de 10% para pagamento com cartão de crédito.'
                    : 'Taxa de 8% para pagamento via PIX.'}
                  {'\n'}Cada vendedor receberá um pagamento separado.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.payButton, loading && styles.payButtonDisabled]}
                onPress={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name={paymentMethod === 'credit_card' ? 'card' : 'qr-code'}
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.payButtonText}>
                      {paymentMethod === 'credit_card' ? 'Pagar com Cartão' : 'Gerar PIX'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.securityText}>
              Pagamento seguro via Mercado Pago. Seus dados estão protegidos.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
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
  orderInfo: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 1,
  },
  orderLabel: {
    fontSize: 16,
    color: '#666',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    color: '#F44336',
    fontSize: 14,
  },
  successCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
  },
  successText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  viewOrdersButton: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  viewOrdersButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  methodSelector: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  methodButtonActive: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  methodButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  cardForm: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
  },
  pixContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  pixQrContainer: {
    alignItems: 'center',
  },
  pixQrImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  pixInstructions: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  pixCodeContainer: {
    width: '100%',
    marginTop: 16,
  },
  pixCodeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  pixCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  pixCodeText: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  pixPlaceholder: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  pixPlaceholderText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  sellerPaymentsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sellerPaymentCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  sellerPaymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  sellerPaymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sellerAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sellerFee: {
    fontSize: 12,
    color: '#666',
  },
  feeInfo: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
  },
  feeInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  payButtonDisabled: {
    backgroundColor: '#999',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 32,
  },
  securityText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
});
