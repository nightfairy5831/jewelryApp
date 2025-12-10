import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';

export default function RegisterDetail2() {
  const [tradeName, setTradeName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');

  const { setSellerRegistrationData } = useAppStore();

  const handleNext = () => {
    // Validate required fields (monthlyRevenue is optional)
    if (!tradeName || !companyPhone || !companyEmail) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Save data to store and navigate
    setSellerRegistrationData({
      tradeName,
      companyPhone,
      companyEmail,
      monthlyRevenue,
    });
    router.push('/auth/create-account');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
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

          {/* Icons */}
          <View style={styles.iconsContainer}>
            <View style={styles.iconWrapper}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.plusText}>+</Text>
            <View style={styles.iconWrapper}>
              <Image
                source={require('../../assets/buyer.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Progress Stepper */}
          <View style={styles.stepperTop}>
            <View style={styles.stepConnector}>
              <View style={[styles.stepDotLarge, styles.stepDotActive]} />
              <View style={[styles.stepLine, styles.stepLineActive]} />
              <View style={[styles.stepDotLarge, styles.stepDotActive]} />
              <View style={[styles.stepLine, styles.stepLineActive]} />
              <View style={[styles.stepDotLarge, styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={styles.stepDotLarge} />
            </View>
            <View style={styles.stepLabelsRow}>
              <Text style={[styles.stepLabelTop, styles.stepLabelActive]}>Dados{'\n'}básicos</Text>
              <Text style={[styles.stepLabelTop, styles.stepLabelActive]}>Sobre a{'\n'}empresa</Text>
              <Text style={[styles.stepLabelTop, styles.stepLabelActive]}>Dados{'\n'}adicionais</Text>
              <Text style={styles.stepLabelTop}>Confirmação</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome fantasia*</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Digite um nome"
                  placeholderTextColor="#B3B3B3"
                  value={tradeName}
                  onChangeText={setTradeName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone da empresa*</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="(DDD) 0 0000.0000"
                  placeholderTextColor="#B3B3B3"
                  value={companyPhone}
                  onChangeText={setCompanyPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail da empresa*</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="nome@dominio.com"
                  placeholderTextColor="#B3B3B3"
                  value={companyEmail}
                  onChangeText={setCompanyEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Faturamento mensal (opcional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="0,00"
                  placeholderTextColor="#B3B3B3"
                  value={monthlyRevenue}
                  onChangeText={setMonthlyRevenue}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer with Next Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
          >
            <Text style={styles.primaryButtonText}>Próximo</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#071327',
    marginLeft: 12,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  iconWrapper: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 70,
    height: 70,
  },
  plusText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 20,
  },
  stepperTop: {
    marginBottom: 40,
  },
  stepConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepDotLarge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D9D9D9',
  },
  stepLine: {
    width: 50,
    height: 3,
    backgroundColor: '#D9D9D9',
  },
  stepLineActive: {
    backgroundColor: '#000000',
  },
  stepLineCompleted: {
    backgroundColor: '#000000',
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  stepLabelTop: {
    fontSize: 11,
    fontWeight: '400',
    color: '#757575',
    textAlign: 'center',
    flex: 1,
  },
  stepDotActive: {
    backgroundColor: '#000000',
  },
  stepDotCompleted: {
    backgroundColor: '#000000',
  },
  stepLabelActive: {
    color: '#000000',
    fontWeight: '700',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    paddingHorizontal: 18,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 15,
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
