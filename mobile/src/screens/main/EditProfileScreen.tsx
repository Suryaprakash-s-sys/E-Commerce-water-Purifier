import { useAppTheme } from '../../context/ThemeContext'
import { useState } from 'react'
import type { ComponentProps } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { updateProfile as updateFirebaseProfile } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { authService } from '../../services/authService'
import { useAppStore } from '../../store/useAppStore'
import type { DealerProfile } from '../../types'
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../../utils/theme'

export default function EditProfileScreen({ navigation }: any) {
  const styles = createStyles();
  const { isDark } = useAppTheme();
  void isDark;
  const { user, refreshProfile, isDealer } = useAppStore()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const dealer = user?.role === 'dealer' ? user as DealerProfile : null
  const [businessName, setBusinessName] = useState(dealer?.businessName ?? '')
  const [gstNumber, setGstNumber] = useState(dealer?.gstNumber ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!user) return
    if (!displayName.trim() || !/^[6-9]\d{9}$/.test(phone.trim())) {
      Alert.alert('Check your details', 'Enter your name and a valid 10-digit Indian mobile number.')
      return
    }
    if (isDealer && !businessName.trim()) {
      Alert.alert('Business name required', 'Enter your registered business name.')
      return
    }
    setSaving(true)
    try {
      const updates = {
        displayName: displayName.trim(),
        phone: phone.trim(),
        ...(isDealer ? { businessName: businessName.trim(), gstNumber: gstNumber.trim() } : {}),
      }
      await authService.updateProfile(user.uid, updates)
      if (auth.currentUser) await updateFirebaseProfile(auth.currentUser, { displayName: displayName.trim() })
      await refreshProfile()
      Alert.alert('Profile updated', 'Your profile changes have been saved.', [{ text: 'OK', onPress: () => navigation.goBack() }])
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.heading}>Edit your profile</Text>
    <Text style={styles.helper}>Update the contact details linked to your Califnco account.</Text>
    <Field styles={styles} label="Full name" value={displayName} onChangeText={setDisplayName} placeholder="Your full name" />
    <Field styles={styles} label="Mobile number" value={phone} onChangeText={setPhone} placeholder="10-digit mobile number" keyboardType="phone-pad" />
    {isDealer && <>
      <Text style={styles.section}>Business details</Text>
      <Field styles={styles} label="Business name" value={businessName} onChangeText={setBusinessName} placeholder="Business name" />
      <Field styles={styles} label="GST number" value={gstNumber} onChangeText={setGstNumber} placeholder="Optional" autoCapitalize="characters" />
      <Text style={styles.addressNote}>To update your business address or location, open Saved Addresses and edit or add your Business address.</Text>
    </>}
    <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={() => void save()} disabled={saving}>
      {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save changes</Text>}
    </TouchableOpacity>
  </ScrollView>
}

function Field({ label, styles, ...props }: { label: string; styles: any } & ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor={COLORS.textLight} /></View>
}

function createStyles() {
  const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, paddingBottom: 40 },
  heading: { color: COLORS.text, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginBottom: 6 },
  helper: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, marginBottom: SPACING.lg },
  section: { color: COLORS.text, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.md, marginBottom: SPACING.sm },
  field: { marginBottom: SPACING.md },
  label: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: 13, backgroundColor: COLORS.surface, color: COLORS.text, fontSize: FONT_SIZE.base },
  addressNote: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, lineHeight: 18, marginBottom: SPACING.md },
  saveButton: { backgroundColor: COLORS.primary, minHeight: 50, borderRadius: BORDER_RADIUS.full, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm },
  saveText: { color: '#fff', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  disabled: { opacity: 0.7 },
  });
  return styles;
}


