import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { paymentApi } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { authToken, fetchOrders } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [showWebView, setShowWebView] = useState(false);

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    if (!authToken || !orderId) return;

    setLoading(true);
    try {
      const response = await paymentApi.createPaymentIntent(authToken, parseInt(orderId));
      setPaymentIntent(response);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async (paymentId: number) => {
    if (!authToken) return;

    setLoading(true);
    try {
      await paymentApi.retryPayment(authToken, paymentId);
      Alert.alert('Success', 'Payment retry initiated. Redirecting...');
      createPaymentIntent();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to retry payment');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentLink = () => {
    if (!paymentIntent?.init_point) {
      Alert.alert('Error', 'Payment link not available');
      return;
    }

    // Open WebView modal instead of external browser
    setShowWebView(true);
  };

  const handleWebViewNavigationChange = (navState: any) => {
    const { url } = navState;

    // Parse URL to check for Mercado Pago callback parameters
    const urlObj = new URL(url);
    const urlParams = new URLSearchParams(urlObj.search);
    const collectionStatus = urlParams.get('collection_status');
    const paymentStatus = urlParams.get('status');

    // Detect payment success - deep link or URL patterns
    const isSuccess =
      url.includes('perfectjewel://payment-success') ||
      url.includes('status=approved') ||
      collectionStatus === 'approved' ||
      paymentStatus === 'approved';

    // Detect payment failure
    const isFailure =
      url.includes('perfectjewel://payment-failure') ||
      url.includes('status=rejected') ||
      collectionStatus === 'rejected' ||
      paymentStatus === 'rejected';

    // Detect payment pending
    const isPending =
      url.includes('perfectjewel://payment-pending') ||
      url.includes('status=pending') ||
      collectionStatus === 'pending' ||
      paymentStatus === 'pending' ||
      paymentStatus === 'in_process';

    if (isSuccess) {
      setShowWebView(false);
      setPaymentStatus('completed');

      setTimeout(async () => {
        await fetchOrders();
        Alert.alert(
          'Pagamento Concluído!',
          'Seu pagamento foi processado com sucesso.',
          [
            {
              text: 'Ver Perfil',
              onPress: () => router.replace('/(tabs)/profile'),
            },
          ]
        );
      }, 500);
    } else if (isFailure) {
      setShowWebView(false);
      setPaymentStatus('failed');

      Alert.alert(
        'Pagamento Falhou',
        'Não foi possível processar seu pagamento. Por favor, tente novamente.',
        [
          {
            text: 'Tentar Novamente',
            onPress: () => handleRetryPayment(paymentIntent.payment.id),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } else if (isPending) {
      setShowWebView(false);
      Alert.alert(
        'Pagamento Pendente',
        'Seu pagamento está sendo processado. Você receberá uma notificação quando for confirmado.'
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'pending':
      default:
        return '#FFA500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'pending':
      default:
        return 'time-outline';
    }
  };

  if (loading && !paymentIntent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8A870" />
        <Text style={styles.loadingText}>Preparing payment...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="card-outline" size={64} color="#C8A870" />
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <Text style={styles.headerSubtitle}>Order #{orderId}</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons
            name={getStatusIcon(paymentStatus)}
            size={40}
            color={getStatusColor(paymentStatus)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(paymentStatus) }]}>
            {paymentStatus.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.statusDescription}>
          {paymentStatus === 'pending' && 'Waiting for payment confirmation...'}
          {paymentStatus === 'completed' && 'Payment received successfully!'}
          {paymentStatus === 'failed' && 'Payment could not be processed.'}
        </Text>
      </View>

      {paymentIntent && (
        <View style={styles.paymentInfoCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>
              R$ {parseFloat(paymentIntent.payment.amount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>
              {paymentIntent.payment.payment_method.toUpperCase().replace('_', ' ')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(paymentStatus) }]}>
              {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
            </Text>
          </View>
        </View>
      )}

      {paymentStatus === 'pending' && (
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handleOpenPaymentLink}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="card" size={24} color="#fff" />
                <Text style={styles.payButtonText}>Proceed to Payment</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {paymentStatus === 'completed' && (
        <TouchableOpacity
          style={styles.successButton}
          onPress={() => router.replace('/(tabs)/profile')}
        >
          <Ionicons name="list" size={24} color="#fff" />
          <Text style={styles.successButtonText}>View My Orders</Text>
        </TouchableOpacity>
      )}

      {paymentStatus === 'failed' && (
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => paymentIntent && handleRetryPayment(paymentIntent.payment.id)}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.retryButtonText}>Retry Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.replace('/orders')}
          >
            <Text style={styles.cancelButtonText}>Back to Orders</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#666" />
        <Text style={styles.infoText}>
          Your payment is processed securely through Mercado Pago. You will receive a confirmation email once the payment is completed.
        </Text>
      </View>

      {/* WebView Modal for Payment */}
      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowWebView(false)}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Pagamento</Text>
            <View style={{ width: 40 }} />
          </View>
          <WebView
            source={{ uri: paymentIntent?.init_point }}
            onNavigationStateChange={handleWebViewNavigationChange}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(request) => {
              // Allow all navigation
              return true;
            }}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#C8A870" />
                <Text style={styles.webViewLoadingText}>Carregando...</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  paymentInfoCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionsCard: {
    margin: 16,
    marginTop: 0,
  },
  payButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#FFF9E6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
    lineHeight: 18,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  webViewLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
