import { useAppTheme } from '../../context/ThemeContext';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/authService';
import { Address } from '../../types';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { captureCurrentAddressLocation } from '../../services/locationService';

export default function AddressScreen({
 navigation, route }: any) {
  const styles = createStyles();
  const { isDark } = useAppTheme();
  void isDark;

  const { user, refreshProfile, isDealer } = useAppStore();
  const addresses = user?.addresses ?? [];
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [form, setForm] = useState<Partial<Address>>({
    id: `addr_${Date.now()}`,
    label: isDealer ? 'Business' : 'Home',
    fullName: user?.displayName ?? '',
    phone: user?.phone ?? '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: addresses.length === 0,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});

  const update = (key: keyof Address) => (val: any) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<keyof Address, string>> = {};
    if (!form.fullName?.trim()) e.fullName = 'Name is required';
    if (!form.phone?.trim() || !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Valid phone required';
    if (!form.line1?.trim()) e.line1 = 'Address line 1 is required';
    if (!form.city?.trim()) e.city = 'City is required';
    if (!form.state?.trim()) e.state = 'State is required';
    if (!form.pincode?.trim() || !/^\d{6}$/.test(form.pincode)) e.pincode = 'Valid 6-digit pincode required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user) return;
    setIsSaving(true);
    try {
      await authService.saveAddress(user.uid, form as Address, addresses);
      await refreshProfile();
      Alert.alert('Success', 'Address saved successfully');
      setShowForm(false);
      setForm({ id: `addr_${Date.now()}`, label: isDealer ? 'Business' : 'Home', fullName: user?.displayName ?? '', phone: user?.phone ?? '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', isDefault: false });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const location = await captureCurrentAddressLocation();
      setForm((current) => ({
        ...current,
        lat: location.lat,
        lng: location.lng,
        line1: current.line1?.trim() || [location.streetNumber, location.street].filter(Boolean).join(' '),
        city: location.city || location.district || current.city,
        state: location.region || current.state,
        pincode: location.postalCode || current.pincode,
        country: location.country || current.country || 'India',
      }));
      Alert.alert('Location added', 'We filled in the address details we could find. Please check them before saving.');
    } catch (err) {
      Alert.alert('Could not get location', err instanceof Error ? err.message : 'Please enter your address manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!user) return;
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = addresses.filter((a) => a.id !== addressId);
          await authService.updateProfile(user.uid, { addresses: updated });
          await refreshProfile();
        },
      },
    ]);
  };

  const LABELS = isDealer ? ['Business', 'Office', 'Other'] : ['Home', 'Office', 'Other'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Existing addresses */}
      {addresses.map((addr) => (
        <View key={addr.id} style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <View style={styles.labelBadge}><Text style={styles.labelText}>{addr.label}</Text></View>
            {addr.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
          </View>
          <Text style={styles.addressName}>{addr.fullName}</Text>
          <Text style={styles.addressLine}>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</Text>
          <Text style={styles.addressLine}>{addr.city}, {addr.state} — {addr.pincode}</Text>
          <Text style={styles.addressPhone}>📞 {addr.phone}</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(addr.id)}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add New Button */}
      {!showForm && (
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      )}

      {/* Form */}
      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Add New Address</Text>
          <TouchableOpacity style={styles.locationButton} onPress={() => void handleUseCurrentLocation()} disabled={isLocating}>
            {isLocating ? <ActivityIndicator color={COLORS.primary} /> : <Ionicons name="locate-outline" size={19} color={COLORS.primary} />}
            <Text style={styles.locationButtonText}>{isLocating ? 'Getting your location…' : 'Use my current location'}</Text>
          </TouchableOpacity>
          {form.lat != null && form.lng != null && <Text style={styles.locationHint}>Location saved: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</Text>}

          {/* Label */}
          <Text style={styles.label}>Label</Text>
          <View style={styles.labelRow}>
            {LABELS.map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.labelChip, form.label === l && styles.labelChipActive]}
                onPress={() => update('label')(l)}
              >
                <Text style={[styles.labelChipText, form.label === l && styles.labelChipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {[
            { label: 'Full Name *', key: 'fullName', placeholder: 'John Doe' },
            { label: 'Phone *', key: 'phone', placeholder: '9876543210', keyboard: 'phone-pad' },
            { label: 'Address Line 1 *', key: 'line1', placeholder: 'Street, House/Flat No.' },
            { label: 'Address Line 2', key: 'line2', placeholder: 'Area, Landmark' },
            { label: 'City *', key: 'city', placeholder: 'Mumbai' },
            { label: 'State *', key: 'state', placeholder: 'Maharashtra' },
            { label: 'Pincode *', key: 'pincode', placeholder: '400001', keyboard: 'numeric' },
          ].map(({ label, key, placeholder, keyboard }) => (
            <View key={key} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={[styles.input, errors[key as keyof Address] ? styles.inputError : null]}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textLight}
                value={(form[key as keyof Address] as string) ?? ''}
                onChangeText={update(key as keyof Address)}
                keyboardType={(keyboard as any) ?? 'default'}
              />
              {errors[key as keyof Address] ? <Text style={styles.errorText}>{errors[key as keyof Address]}</Text> : null}
            </View>
          ))}

          <View style={styles.defaultRow}>
            <Text style={styles.defaultLabel}>Set as Default Address</Text>
            <Switch
              value={form.isDefault}
              onValueChange={update('isDefault')}
              trackColor={{ true: COLORS.primary }}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color={COLORS.textOnPrimary} /> : <Text style={styles.saveBtnText}>Save Address</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles() {
  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, paddingBottom: 40 },
  addressCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.base, marginBottom: SPACING.sm, ...SHADOW.sm },
  addressHeader: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  labelBadge: { backgroundColor: COLORS.primary + '20', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 },
  labelText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },
  defaultBadge: { backgroundColor: COLORS.success + '20', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 },
  defaultText: { fontSize: FONT_SIZE.xs, color: COLORS.success, fontWeight: FONT_WEIGHT.bold },
  addressName: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.text, marginBottom: 2 },
  addressLine: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 18 },
  addressPhone: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 4 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm },
  deleteBtnText: { color: COLORS.error, fontSize: FONT_SIZE.sm },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed' },
  addBtnText: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semiBold, fontSize: FONT_SIZE.base },
  form: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.base, ...SHADOW.sm },
  formTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.md },
  locationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.primary, marginBottom: SPACING.md },
  locationButtonText: { color: COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold },
  locationHint: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: -SPACING.sm, marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.textSecondary, marginBottom: 6 },
  labelRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  labelChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  labelChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  labelChipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  labelChipTextActive: { color: COLORS.textOnPrimary, fontWeight: FONT_WEIGHT.semiBold },
  fieldGroup: { marginBottom: SPACING.sm },
  fieldLabel: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, fontSize: FONT_SIZE.base, color: COLORS.text, backgroundColor: COLORS.surfaceAlt },
  inputError: { borderColor: COLORS.error },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.xs, marginTop: 2 },
  defaultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: SPACING.md },
  defaultLabel: { fontSize: FONT_SIZE.base, color: COLORS.text },
  saveBtn: { backgroundColor: COLORS.primary, height: 52, borderRadius: BORDER_RADIUS.full, alignItems: 'center', justifyContent: 'center', ...SHADOW.md },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: COLORS.textOnPrimary, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  cancelBtn: { alignItems: 'center', marginTop: SPACING.md, padding: SPACING.sm },
  cancelBtnText: { color: COLORS.textMuted, fontSize: FONT_SIZE.base },

  });
  return styles;
}
