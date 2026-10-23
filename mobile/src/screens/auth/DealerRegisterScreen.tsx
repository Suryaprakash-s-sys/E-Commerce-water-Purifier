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
import { Address } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'DealerRegister'>;
};

export default function DealerRegisterScreen({ navigation }: Props) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    businessName: '', gstNumber: '',
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const update = (key: keyof typeof form) => (val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Valid 10-digit mobile required';
    if (!form.password || form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.businessName.trim()) e.businessName = 'Business name is required';
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) e.pincode = 'Valid 6-digit pincode required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const businessAddress: Address = {
        id: `addr_${Date.now()}`,
        label: 'Business',
        fullName: form.businessName,
        phone: form.phone,
        line1: form.addressLine1,
        line2: form.addressLine2,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        country: 'India',
        isDefault: true,
      };
      await authService.registerDealer(
        form.email.trim().toLowerCase(),
        form.password,
        form.name.trim(),
        form.phone.trim(),
        form.businessName.trim(),
        form.gstNumber.trim(),
        businessAddress
      );
      Alert.alert(
        'Application Submitted!',
        'Your dealer application has been submitted. You will be notified once approved by admin.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      let message = 'Registration failed.';
      if (err.code === 'auth/email-already-in-use') message = 'Email already registered.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Ionicons name="business" size={36} color="#fff" />
          </View>
          <Text style={styles.title}>Dealer Registration</Text>
          <Text style={styles.subtitle}>Apply for wholesale access</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {[
            { label: 'Full Name', key: 'name', icon: 'person-outline', placeholder: 'Your full name' },
            { label: 'Email', key: 'email', icon: 'mail-outline', placeholder: 'business@example.com', keyboard: 'email-address' },
            { label: 'Mobile', key: 'phone', icon: 'call-outline', placeholder: '9876543210', keyboard: 'phone-pad' },
            { label: 'Password', key: 'password', icon: 'lock-closed-outline', placeholder: 'Min 8 characters', secure: true },
            { label: 'Confirm Password', key: 'confirmPassword', icon: 'lock-closed-outline', placeholder: 'Re-enter password', secure: true },
          ].map(({ label, key, icon, placeholder, keyboard, secure }) => (
            <View key={key} style={styles.fieldGroup}>
              <Text style={styles.label}>{label}</Text>
              <View style={[styles.inputWrapper, errors[key as keyof typeof form] ? styles.inputError : null]}>
                <Ionicons name={icon as any} size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={COLORS.textLight}
                  value={form[key as keyof typeof form]}
                  onChangeText={update(key as keyof typeof form)}
                  keyboardType={(keyboard as any) ?? 'default'}
                  secureTextEntry={secure && !showPassword}
                  autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
                />
                {secure && (
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              {errors[key as keyof typeof form] ? <Text style={styles.errorText}>{errors[key as keyof typeof form]}</Text> : null}
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Business Information</Text>

          {[
            { label: 'Business Name', key: 'businessName', icon: 'business-outline', placeholder: 'ABC Water Solutions Pvt Ltd' },
            { label: 'GST Number (Optional)', key: 'gstNumber', icon: 'card-outline', placeholder: '22AAAAA0000A1Z5' },
            { label: 'Address Line 1', key: 'addressLine1', icon: 'location-outline', placeholder: 'Street, Shop/Office No.' },
            { label: 'Address Line 2', key: 'addressLine2', icon: 'location-outline', placeholder: 'Area, Landmark (optional)' },
            { label: 'City', key: 'city', icon: 'map-outline', placeholder: 'Mumbai' },
            { label: 'State', key: 'state', icon: 'flag-outline', placeholder: 'Maharashtra' },
            { label: 'Pincode', key: 'pincode', icon: 'mail-outline', placeholder: '400001', keyboard: 'numeric' },
          ].map(({ label, key, icon, placeholder, keyboard }) => (
            <View key={key} style={styles.fieldGroup}>
              <Text style={styles.label}>{label}</Text>
              <View style={[styles.inputWrapper, errors[key as keyof typeof form] ? styles.inputError : null]}>
                <Ionicons name={icon as any} size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={COLORS.textLight}
                  value={form[key as keyof typeof form]}
                  onChangeText={update(key as keyof typeof form)}
                  keyboardType={(keyboard as any) ?? 'default'}
                />
              </View>
              {errors[key as keyof typeof form] ? <Text style={styles.errorText}>{errors[key as keyof typeof form]}</Text> : null}
            </View>
          ))}

          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={styles.noteText}>
              Your application will be reviewed by our admin team. You'll receive access to dealer pricing and bulk ordering upon approval.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color={COLORS.textOnPrimary} /> : <Text style={styles.submitBtnText}>Submit Dealer Application</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Already registered? <Text style={styles.loginLinkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryDark },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  header: { paddingTop: 50, paddingBottom: 28, paddingHorizontal: SPACING.xl, alignItems: 'center' },
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
  sectionTitle: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.md, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  fieldGroup: { marginBottom: SPACING.sm },
  label: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.textSecondary, marginBottom: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surfaceAlt,
  },
  inputIcon: { paddingHorizontal: 10 },
  input: { flex: 1, height: 44, fontSize: FONT_SIZE.md, color: COLORS.text },
  inputError: { borderColor: COLORS.error },
  eyeBtn: { padding: 10 },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.xs, marginTop: 2 },
  noteBox: {
    flexDirection: 'row', gap: 8,
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginVertical: SPACING.md,
    borderLeftWidth: 3, borderLeftColor: COLORS.info,
  },
  noteText: { flex: 1, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 18 },
  submitBtn: {
    backgroundColor: COLORS.secondary, height: 52,
    borderRadius: BORDER_RADIUS.full, alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.md, ...SHADOW.md,
  },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.textOnPrimary, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  loginLink: { alignItems: 'center', marginTop: SPACING.lg },
  loginLinkText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  loginLinkBold: { color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },
});
