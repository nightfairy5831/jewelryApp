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
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { uploadApi } from '../../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { register, isAuthLoading } = useAppStore();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Store local preview URI
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (role === 'seller' && !phone) {
      Alert.alert('Erro', 'Por favor, preencha o número de celular');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Erro', 'Você precisa aceitar os Termos de Uso para continuar');
      return;
    }

    try {
      let uploadedAvatarUrl: string | undefined = undefined;

      // Upload avatar if selected
      if (avatarUrl) {
        setUploadingAvatar(true);
        try {
          const file = {
            uri: avatarUrl,
            type: 'image/jpeg',
            name: `avatar-${Date.now()}.jpg`,
          };
          const response = await uploadApi.uploadAvatar(file);
          uploadedAvatarUrl = response.url;
        } catch (uploadError: any) {
          console.error('Avatar upload failed:', uploadError);
          // Continue registration without avatar
        } finally {
          setUploadingAvatar(false);
        }
      }

      // Register user with avatar URL
      await register(name, email, password, password, phone, role, uploadedAvatarUrl);

      const message = role === 'seller'
        ? 'Cadastro realizado com sucesso! Sua conta será analisada e você receberá um e-mail quando for aprovada. Por favor, faça login após a aprovação.'
        : 'Cadastro realizado com sucesso! Por favor, faça login para continuar.';

      Alert.alert(
        'Sucesso',
        message,
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error: any) {
      Alert.alert('Erro no Registro', error.message || 'Não foi possível criar a conta');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Back Button */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cadastro de novo usuário</Text>
          </View>

          <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Conta</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'buyer' && styles.roleButtonActive]}
                onPress={() => setRole('buyer')}
              >
                <Image
                  source={require('../../assets/buyer.png')}
                  style={styles.roleIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.roleButtonText, role === 'buyer' && styles.roleButtonTextActive]} numberOfLines={1}>
                  cliente
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, role === 'seller' && styles.roleButtonActive]}
                onPress={() => setRole('seller')}
              >
                <Image
                  source={require('../../assets/seller.png')}
                  style={styles.roleIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.roleButtonText, role === 'seller' && styles.roleButtonTextActive]} numberOfLines={1}>
                  vendedor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Upload Field */}
          <TouchableOpacity
            style={styles.imageUploadContainer}
            onPress={pickImage}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#F5C518" />
            ) : avatarUrl ? (
              <>
                <Image source={{ uri: avatarUrl }} style={styles.avatarPreview} />
                <Text style={styles.imageUploadText}>Alterar foto de perfil</Text>
              </>
            ) : (
              <>
                <Ionicons name="image-outline" size={24} color="#F5C518" />
                <Text style={styles.imageUploadText}>+ adicionar foto de perfil</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo*</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Digite seu nome completo"
                placeholderTextColor="#B3B3B3"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail*</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#B3B3B3"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
          </View>

          {role === 'seller' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Celular*</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="(DDD) 00000 0000"
                  placeholderTextColor="#B3B3B3"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha*</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#B3B3B3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

        {/* Footer with Button */}
        <View style={styles.footer}>
          {/* Terms and Conditions */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View style={styles.checkbox}>
              {acceptedTerms && (
                <Ionicons name="checkmark" size={16} color="#000" />
              )}
            </View>
            <Text style={styles.termsText}>
              Concordo com os <Text style={styles.termsLink}>Termos Jóia Perfeita</Text>{'\n'}
              Leia com atenção à nossa política de privacidade e termos de uso.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, (isAuthLoading || uploadingAvatar) && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isAuthLoading || uploadingAvatar}
          >
            {isAuthLoading || uploadingAvatar ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Criar conta</Text>
            )}
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
    flexGrow: 1,
    padding: 20,
    paddingBottom: 200, // Increased to accommodate footer on small screens
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Reduced from 16 to save space
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#071327',
    marginLeft: 8,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoContainer: {
    width: 90,
    height: 90,
    marginBottom: 12,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '400',
    color: '#535252',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    marginTop: 6,
  },
  form: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16, // Reduced from 20 to save space
  },
  inputGroup: {
    marginBottom: 16, // Reduced from 20 to save space
  },
  roleInputGroup: {
    marginTop: 15,
  },
  label: {
    fontSize: 16,
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
    height: 50, // Reduced from 56 to save space on small screens
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D9D9D9',
    borderRadius: 50,
    paddingVertical: 12, // Reduced from 14
    paddingHorizontal: 10,
    gap: 8, // Reduced from 10
  },
  roleButtonActive: {
    borderColor: '#F5C518',
    backgroundColor: '#FFFBF0',
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
  },
  roleButtonTextActive: {
    color: '#000000',
    fontWeight: '500',
  },
  roleIcon: {
    width: 40, // Reduced from 44 to save space
    height: 40, // Reduced from 44 to save space
  },
  imageUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F5C518',
    borderStyle: 'dashed',
    borderRadius: 40,
    paddingVertical: 12, // Reduced from 16 to save space
    paddingHorizontal: 20,
    marginTop: 16, // Reduced from 20
    marginBottom: 16, // Reduced from 20
    gap: 8,
  },
  avatarPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 8,
  },
  imageUploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12, // Reduced from 16
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  termsLink: {
    color: '#000000',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 12,
    marginTop: 4, // Reduced from 8
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
});
