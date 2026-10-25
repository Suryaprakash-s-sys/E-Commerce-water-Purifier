import { useAppTheme } from '../../context/ThemeContext';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { authService } from '../../services/authService';
import { COLORS, FONTS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export default function RegisterScreen({
 navigation }: Props) {
  const styles = createStyles();
  const { isDark } = useAppTheme();
  void isDark;

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const update = (key: keyof typeof form) => (val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.registerCustomer(
        form.email.trim().toLowerCase(),
        form.password,
        form.name.trim(),
        form.phone.trim()
      );
      Alert.alert('Account Created!', 'Your account has been created successfully. Please sign in.', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      let message = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') message = 'This email is already registered.';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const Field = ({ label, fieldKey, placeholder, icon, keyboard = 'default', secure = false, autoComplete = 'off' }: any) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, errors[fieldKey as keyof typeof form] ? styles.inputError : null]}>
        <Ionicons name={icon} size={20} color={COLORS.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          value={form[fieldKey as keyof typeof form]}
          onChangeText={update(fieldKey as keyof typeof form)}
          keyboardType={keyboard}
          secureTextEntry={secure && !showPassword}
          autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
          autoComplete={autoComplete}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {errors[fieldKey as keyof typeof form] ? (
        <Text style={styles.errorText}>{errors[fieldKey as keyof typeof form]}</Text>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Ionicons name="person-add" size={36} color="#fff" />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join thousands of happy customers</Text>
        </View>

        <View style={styles.card}>
          <Field label="Full Name" fieldKey="name" placeholder="John Doe" icon="person-outline" />
          <Field label="Email Address" fieldKey="email" placeholder="john@example.com" icon="mail-outline" keyboard="email-address" autoComplete="email" />
          <Field label="Mobile Number" fieldKey="phone" placeholder="9876543210" icon="call-outline" keyboard="phone-pad" />
          <Field label="Password" fieldKey="password" placeholder="Min. 8 characters" icon="lock-closed-outline" secure />
          <Field label="Confirm Password" fieldKey="confirmPassword" placeholder="Re-enter password" icon="lock-closed-outline" secure />

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color={COLORS.textOnPrimary} /> : <Text style={styles.submitBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles() {
  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryDark },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  header: { paddingTop: 50, paddingBottom: 32, paddingHorizontal: SPACING.xl, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: SPACING.xl, zIndex: 10 },
  logoContainer: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  title: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: '#fff' },
  subtitle: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface, marginHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, ...SHADOW.lg,
  },
  fieldGroup: { marginBottom: SPACING.base },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.textSecondary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surfaceAlt,
  },
  inputIcon: { paddingHorizontal: 12 },
  input: { flex: 1, height: 48, fontSize: FONT_SIZE.base, color: COLORS.text },
  inputError: { borderColor: COLORS.error },
  eyeBtn: { padding: 12 },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.xs, marginTop: 4 },
  submitBtn: {
    backgroundColor: COLORS.primary, height: 52,
    borderRadius: BORDER_RADIUS.full, alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.md, ...SHADOW.md,
  },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.textOnPrimary, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  loginLink: { alignItems: 'center', marginTop: SPACING.lg },
  loginLinkText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  loginLinkBold: { color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },

  });
  return styles;
}
