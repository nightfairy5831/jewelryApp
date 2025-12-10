import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';

export default function RegisterDetail3() {
  const { sellerRegistrationData, clearSellerRegistrationData } = useAppStore();

  const handleConfirm = () => {
    // TODO: Submit registration data to API
    Alert.alert(
      'Cadastro Concluído',
      'Seu cadastro foi realizado com sucesso!',
      [
        {
          text: 'OK',
          onPress: () => {
            clearSellerRegistrationData();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Concluindo cadastro</Text>
          </View>

          {/* Data Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CPF</Text>
              <Text style={styles.fieldValue}>{sellerRegistrationData?.cpf || '-'}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Data de nascimento</Text>
              <Text style={styles.fieldValue}>{sellerRegistrationData?.birthDate || '-'}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nome completo</Text>
              <Text style={styles.fieldValue}>{sellerRegistrationData?.name || '-'}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>E-mail de acesso</Text>
              <Text style={styles.fieldValue}>{sellerRegistrationData?.email || '-'}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Telefone</Text>
              <Text style={styles.fieldValue}>{sellerRegistrationData?.phone || '-'}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CNPJ</Text>
              <Text style={styles.fieldValue}>{sellerRegistrationData?.cnpj || '-'}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nome fantasia</Text>
              <Text style={styles.fieldValue}>{sellerRegistrationData?.tradeName || '-'}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Telefone da empresa</Text>
              <Text style={styles.fieldValue}>{sellerRegistrationData?.companyPhone || '-'}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>E-mail da empresa</Text>
              <Text style={styles.fieldValue}>{sellerRegistrationData?.companyEmail || '-'}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Faturamento mensal</Text>
              <Text style={styles.fieldValue}>
                {sellerRegistrationData?.monthlyRevenue ? `R$ ${sellerRegistrationData.monthlyRevenue}` : '-'}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer with Confirm Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleConfirm}
          >
            <Text style={styles.primaryButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#071327',
    marginLeft: 12,
  },
  summaryContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 20,
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
