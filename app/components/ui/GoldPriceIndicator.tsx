import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { goldPriceApi, GoldPriceData } from '../../services/api';

interface GoldPriceIndicatorProps {
  compact?: boolean;
}

export default function GoldPriceIndicator({ compact = false }: GoldPriceIndicatorProps) {
  const [goldPrice, setGoldPrice] = useState<GoldPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGoldPrice();
    // Refresh every 5 minutes
    const interval = setInterval(fetchGoldPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchGoldPrice = async () => {
    try {
      setLoading(true);
      const response = await goldPriceApi.getCurrentPrice();
      if (response.success) {
        setGoldPrice(response.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch gold price');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !goldPrice) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (error || !goldPrice) {
    return null;
  }

  if (compact) {
    return (
      <View style={[styles.container, styles.containerCompact]}>
        <Ionicons name="trending-up" size={14} color="#D4AF37" />
        <Text style={styles.compactText}>
          Ouro 18k: R$ {goldPrice.price_18k.toFixed(2)}/g
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={20} color="#D4AF37" />
        <Text style={styles.title}>Preço do Ouro</Text>
        <TouchableOpacity onPress={fetchGoldPrice}>
          <Ionicons name="refresh" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.pricesGrid}>
        <View style={styles.priceItem}>
          <Text style={styles.karatLabel}>10k</Text>
          <Text style={styles.priceValue}>R$ {goldPrice.price_10k.toFixed(2)}</Text>
          <Text style={styles.perGram}>/grama</Text>
        </View>

        <View style={styles.priceItem}>
          <Text style={styles.karatLabel}>18k</Text>
          <Text style={styles.priceValue}>R$ {goldPrice.price_18k.toFixed(2)}</Text>
          <Text style={styles.perGram}>/grama</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={14} color="#666" />
        <Text style={styles.footerText}>
          Atualizado: {new Date(goldPrice.updated_at).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  containerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
  },
  compactText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  pricesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  priceItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  karatLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  perGram: {
    fontSize: 11,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#666',
  },
});
