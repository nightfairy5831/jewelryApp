import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import type { Order, Payment } from '../../services/api';

type OrderStatus = Order['status'];

const getPaymentStatus = (payments?: Payment[]): 'none' | 'failed' | 'paid' => {
  if (!payments || payments.length === 0) return 'none';
  if (payments.some(p => p.status === 'failed')) return 'failed';
  if (payments.every(p => p.status === 'completed')) return 'paid';
  return 'none';
};

interface OrderCardProps {
  order: Order;
  viewType: 'buyer' | 'seller';
  onAccept?: (order: Order) => void;
  onReject?: (order: Order) => void;
  onShip?: (order: Order, trackingNumber: string) => void;
  onViewAddress?: (order: Order) => void;
  onViewReason?: (order: Order) => void;
  onConfirmDelivery?: (order: Order) => void;
  onCompletePayment?: (order: Order) => void;
  onCancelOrder?: (order: Order) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<OrderStatus, {
  color: string;
  bgColor: string;
  sellerLabel: string;
  buyerLabel: string;
  buyerMessage?: string;
  sellerMessage?: string;
}> = {
  pending: {
    color: '#6b7280',
    bgColor: '#f3f4f6',
    sellerLabel: 'Aguardando pagamento',
    buyerLabel: 'Aguardando pagamento',
    sellerMessage: 'Aguardando confirmação de pagamento do comprador.'
  },
  confirmed: {
    color: '#111827',
    bgColor: '#f3f4f6',
    sellerLabel: 'Nova venda',
    buyerLabel: 'Aguardando o vendedor',
    buyerMessage: 'Aguardando o vendedor confirmar o seu pedido.'
  },
  accepted: {
    color: '#f97316',
    bgColor: '#fff7ed',
    sellerLabel: 'Aguardando envio',
    buyerLabel: 'Aguardando envio',
    buyerMessage: 'Seu pedido foi aceito e está sendo confeccionado.',
    sellerMessage: 'Confeccione o produto e informe o código de rastreio.'
  },
  shipped: {
    color: '#2563eb',
    bgColor: '#eff6ff',
    sellerLabel: 'Postado',
    buyerLabel: 'Postado',
    buyerMessage: 'Seu pedido foi postado, confirme quando ele chegar.',
    sellerMessage: 'Produto enviado. Aguardando confirmação de entrega.'
  },
  delivered: {
    color: '#16a34a',
    bgColor: '#f0fdf4',
    sellerLabel: 'Concluído',
    buyerLabel: 'Concluído',
    buyerMessage: 'Pedido entregue com sucesso!',
    sellerMessage: 'Pedido concluído com sucesso!'
  },
  cancelled: {
    color: '#dc2626',
    bgColor: '#fef2f2',
    sellerLabel: 'Cancelado',
    buyerLabel: 'Cancelado',
    buyerMessage: 'Seu pedido foi cancelado pelo vendedor.',
    sellerMessage: 'Pedido cancelado.'
  },
};

export default function OrderCard({
  order,
  viewType,
  onAccept,
  onReject,
  onShip,
  onViewAddress,
  onViewReason,
  onConfirmDelivery,
  onCompletePayment,
  onCancelOrder,
  isLoading,
}: OrderCardProps) {
  const [trackingInput, setTrackingInput] = useState('');

  const status = STATUS_CONFIG[order.status];
  const statusLabel = viewType === 'seller' ? status.sellerLabel : status.buyerLabel;
  const item = order.items?.[0];
  const product = item?.product;
  const paymentResult = order.status === 'pending' ? getPaymentStatus(order.payments) : null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatPrice = (price: number | string) => {
    return `R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const handleTrackingPress = () => {
    if (order.tracking_number) {
      // Open tracking URL (generic correios tracking)
      Linking.openURL(`https://rastreamento.correios.com.br/app/index.php?objetos=${order.tracking_number}`);
    }
  };

  const handleCopyTrackingNumber = async () => {
    if (order.tracking_number) {
      try {
        await Clipboard.setStringAsync(order.tracking_number);
        Alert.alert('Copiado!', 'Código de rastreio copiado para a área de transferência');
      } catch (error) {
        Alert.alert('Erro', 'Falha ao copiar código de rastreio');
      }
    }
  };

  const handleShipSubmit = () => {
    if (trackingInput.trim() && onShip) {
      onShip(order, trackingInput.trim());
      setTrackingInput('');
    }
  };

  // Get product specs
  const getSpecs = () => {
    if (!product) return null;
    return {
      teor: product.gold_karat || product.properties?.teor || '18K',
      peso: product.gold_weight_grams ? `${product.gold_weight_grams}g` : product.properties?.peso || '5g',
      preenchimento: product.properties?.preenchimento || 'Maciço',
      pedra: product.properties?.pedra || 'Natural',
    };
  };

  const specs = getSpecs();

  // Get customization from order item (ring sizes and names)
  const getCustomization = () => {
    const ringCustomization = item?.ringCustomization;
    if (!ringCustomization) return null;
    return {
      aroMasculino: ringCustomization.size_1 || ringCustomization.size,
      nomeFeminino: ringCustomization.name_2,
      aroFeminino: ringCustomization.size_2,
      nomeMasculino: ringCustomization.name_1,
    };
  };

  const customization = getCustomization();

  return (
    <View style={styles.card}>
      {/* Header: Status + Date */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{statusLabel}</Text>
          </View>
          {order.status === 'cancelled' && viewType === 'buyer' && onViewReason && (
            <TouchableOpacity onPress={() => onViewReason(order)}>
              <Text style={styles.viewReasonText}>Ver motivo</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.dateText}>Compra feita dia {formatDate(order.created_at)}</Text>
      </View>

      {/* Payment Status (for pending orders) */}
      {order.status === 'pending' && (
        <View style={styles.paymentStatusContainer}>
          {paymentResult === 'failed' ? (
            <View style={styles.paymentStatusRow}>
              <Ionicons name="close-circle" size={16} color="#dc2626" />
              <Text style={[styles.paymentStatusLabel, { color: '#dc2626' }]}>Pagamento falhou</Text>
            </View>
          ) : (
            <View style={styles.paymentStatusRow}>
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text style={[styles.paymentStatusLabel, { color: '#6b7280' }]}>Aguardando pagamento</Text>
            </View>
          )}
          {viewType === 'buyer' && (
            <View style={styles.paymentActions}>
              {onCompletePayment && (
                <TouchableOpacity
                  style={styles.payNowButton}
                  onPress={() => onCompletePayment(order)}
                >
                  <Text style={styles.payNowText}>Pagar agora</Text>
                </TouchableOpacity>
              )}
              {onCancelOrder && (
                <TouchableOpacity
                  style={styles.cancelOrderButton}
                  onPress={() => onCancelOrder(order)}
                >
                  <Text style={styles.cancelOrderText}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Product Info */}
      <View style={styles.productRow}>
        {viewType === 'seller' ? (
          <View style={styles.productIconContainer}>
            <Text style={styles.ringEmoji}>💍</Text>
          </View>
        ) : (
          <Image
            source={{ uri: product?.thumbnail || product?.images?.[0] || 'https://via.placeholder.com/60' }}
            style={styles.productImage}
          />
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product?.name || `Produto #${item?.product_id}`}
          </Text>
        </View>
        {viewType === 'buyer' && product?.rating && product.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Buyer Info (for seller view) */}
      {viewType === 'seller' && order.buyer && (
        <View style={styles.buyerInfoContainer}>
          <View style={styles.buyerInfoRow}>
            <Ionicons name="person-outline" size={16} color="#6b7280" />
            <Text style={styles.buyerInfoText}>{order.buyer.name}</Text>
          </View>
        </View>
      )}

      {/* Customization (Ring sizes and names) */}
      {customization && (
        <View style={styles.customizationContainer}>
          {customization.aroMasculino && (
            <Text style={styles.customizationText}>Aro Masculino: {customization.aroMasculino}</Text>
          )}
          {customization.nomeFeminino && (
            <Text style={styles.customizationText}>Nome Feminino: {customization.nomeFeminino}</Text>
          )}
          {customization.aroFeminino && (
            <>
              <Text style={styles.customizationText}>Aro Feminino: {customization.aroFeminino}</Text>
            </>
          )}
          {customization.nomeMasculino && (
            <Text style={styles.customizationText}>Nome Masculino: {customization.nomeMasculino}</Text>
          )}
        </View>
      )}

      {/* Product Specs Grid */}
      {specs && (
        <View style={styles.specsContainer}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Teor:</Text>
            <Text style={styles.specValue}>{specs.teor}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Peso:</Text>
            <Text style={styles.specValue}>{specs.peso}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Preenchimento:</Text>
            <Text style={styles.specValue}>{specs.preenchimento}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Pedra:</Text>
            <Text style={styles.specValue}>{specs.pedra}</Text>
          </View>
        </View>
      )}

      {/* Price */}
      <Text style={styles.price}>{formatPrice(order.total_amount)}</Text>

      {/* Tracking Number Display (for shipped only) */}
      {order.tracking_number && order.status === 'shipped' && (
        <View style={styles.trackingContainer}>
          <Text style={styles.trackingCode} numberOfLines={1}>{order.tracking_number}</Text>
          <TouchableOpacity onPress={handleCopyTrackingNumber}>
            <Ionicons name="copy-outline" size={18} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.trackingButton} onPress={handleTrackingPress}>
            <Text style={styles.trackingButtonText}>Rastreamento</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Seller: Message and Tracking Input for accepted orders */}
      {viewType === 'seller' && order.status === 'accepted' && (
        <>
          {status.sellerMessage && (
            <Text style={styles.statusMessage}>{status.sellerMessage}</Text>
          )}
          <View style={styles.trackingInputContainer}>
            <TextInput
              style={styles.trackingInput}
              placeholder="Digite o código de rastreio *"
              placeholderTextColor="#9ca3af"
              value={trackingInput}
              onChangeText={setTrackingInput}
            />
            <TouchableOpacity
              style={[styles.shipButton, !trackingInput.trim() && styles.shipButtonDisabled]}
              onPress={handleShipSubmit}
              disabled={!trackingInput.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.shipButtonText}>Enviar produto</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Seller: Accept/Reject for confirmed orders */}
      {viewType === 'seller' && order.status === 'confirmed' && (
        <>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => onReject?.(order)}
              disabled={isLoading}
            >
              <Text style={styles.rejectButtonText}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => onAccept?.(order)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.acceptButtonText}>Aceitar</Text>
              )}
            </TouchableOpacity>
          </View>
          {onViewAddress && (
            <TouchableOpacity style={styles.addressButton} onPress={() => onViewAddress(order)}>
              <Ionicons name="location-outline" size={16} color="#111827" />
              <Text style={styles.addressButtonText}>Ver endereço</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Buyer: Status message */}
      {viewType === 'buyer' && status.buyerMessage && order.status !== 'pending' && (
        <Text style={styles.statusMessage}>{status.buyerMessage}</Text>
      )}

      {/* Seller: Status message (for pending, shipped, delivered, cancelled) */}
      {viewType === 'seller' && status.sellerMessage && !['confirmed', 'accepted'].includes(order.status) && (
        <Text style={styles.statusMessage}>{status.sellerMessage}</Text>
      )}

      {/* Seller: Ver endereço button for other statuses */}
      {viewType === 'seller' && order.status !== 'confirmed' && onViewAddress && ['accepted', 'shipped', 'delivered'].includes(order.status) && (
        <TouchableOpacity style={styles.addressButton} onPress={() => onViewAddress(order)}>
          <Ionicons name="location-outline" size={16} color="#111827" />
          <Text style={styles.addressButtonText}>Ver endereço</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 26,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewReasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f97316',
    textDecorationLine: 'underline',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  productIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringEmoji: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  buyerInfoContainer: {
    marginBottom: 12,
  },
  buyerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buyerInfoText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  customizationContainer: {
    marginBottom: 12,
  },
  customizationText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  specsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 16,
  },
  specItem: {
    minWidth: '40%',
  },
  specLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trackingCode: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  trackingButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trackingButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  trackingInputContainer: {
    marginBottom: 12,
  },
  trackingInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  shipButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  shipButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  shipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statusMessage: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
  },
  addressButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  paymentStatusContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentStatusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 10,
  },
  payNowButton: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  payNowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  cancelOrderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelOrderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
});
