import { useAppTheme } from '../../context/ThemeContext';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAppStore } from '../../store/useAppStore';
import { captureCurrentAddressLocation, type CapturedAddressLocation } from '../../services/locationService';
import { COLORS, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../utils/theme';
import { Address } from '../../types';

const SERVICE_TYPES = ['installation', 'maintenance', 'repair', 'inspection'];

export default function ServiceBookingScreen() {
  const s = createStyles();
  const { isDark } = useAppTheme();
  void isDark;


  const { user } = useAppStore();
  const [type, setType] = useState('installation');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [location, setLocation] = useState<CapturedAddressLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function chooseLocation() {
    setIsLocating(true);
    try {
      const current = await captureCurrentAddressLocation();
      setLocation(current);
    } catch (error) {
      Alert.alert('Location required', error instanceof Error ? error.message : 'Allow location access or try again.');
    } finally {
      setIsLocating(false);
    }
  }

  async function submit() {
    if (!user || !date || !phone) {
      Alert.alert('Missing details', 'Enter a preferred date and contact phone number.');
      return;
    }
    if (!location) {
      Alert.alert('Service location required', 'Tap “Share my current location” before submitting your service request.');
      return;
    }
    setIsSubmitting(true);
    const address: Address = {
      id: `service_${Date.now()}`,
      label: 'Service',
      fullName: user.displayName,
      phone,
      line1: [location.streetNumber, location.street].filter(Boolean).join(' ') || 'Current device location',
      line2: location.district ?? '',
      city: location.city ?? location.district ?? '',
      state: location.region ?? '',
      pincode: location.postalCode ?? '',
      country: location.country ?? 'India',
      lat: location.lat,
      lng: location.lng,
      isDefault: false,
    };
    try {
      await addDoc(collection(db, 'serviceBookings'), {
        userId: user.uid,
        userName: user.displayName,
        userPhone: phone,
        userEmail: user.email,
        serviceType: type,
        description,
        preferredDate: new Date(date),
        preferredTimeSlot: 'Any time',
        address,
        coordinates: { latitude: location.lat, longitude: location.lng },
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      Alert.alert('Request received', 'Your selected location was sent with the service request.');
      setDescription('');
      setLocation(null);
    } catch (error) {
      Alert.alert('Could not book', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const locationText = location
    ? [location.streetNumber, location.street, location.city ?? location.district, location.region].filter(Boolean).join(', ')
    : '';

  return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.title}>Book a service visit</Text>
    <Text style={s.label}>Service type</Text>
    {SERVICE_TYPES.map(service => <TouchableOpacity key={service} onPress={() => setType(service)} style={[s.choice, type === service && s.active]}>
      <Text style={type === service ? s.white : s.text}>{service[0].toUpperCase() + service.slice(1)}</Text>
    </TouchableOpacity>)}
    <Text style={s.label}>Preferred date (YYYY-MM-DD)</Text>
    <TextInput style={s.input} placeholder="2026-11-10" value={date} onChangeText={setDate} />
    <Text style={s.label}>Contact phone</Text>
    <TextInput style={s.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

    <Text style={s.label}>Service location *</Text>
    <Text style={s.hint}>Share your current location so our service team can find you.</Text>
    <TouchableOpacity style={s.locationButton} onPress={() => void chooseLocation()} disabled={isLocating}>
      {isLocating ? <ActivityIndicator color={COLORS.primary} /> : <Text style={s.locationIcon}>⌖</Text>}
      <Text style={s.locationButtonText}>{isLocating ? 'Getting your location…' : location ? 'Update my current location' : 'Share my current location'}</Text>
    </TouchableOpacity>
    {location && <View style={s.locationCard}>
      <Text style={s.locationTitle}>Location attached</Text>
      {!!locationText && <Text style={s.text}>{locationText}</Text>}
      <Text style={s.hint}>Coordinates: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</Text>
    </View>}

    <Text style={s.label}>Describe the issue (optional)</Text>
    <TextInput style={[s.input, s.multiline]} multiline value={description} onChangeText={setDescription} />
    <TouchableOpacity style={[s.button, isSubmitting && s.disabled]} onPress={() => void submit()} disabled={isSubmitting}>
      {isSubmitting ? <ActivityIndicator color={COLORS.textOnPrimary} /> : <Text style={s.white}>Submit request</Text>}
    </TouchableOpacity>
  </ScrollView>;
}

function createStyles() {
  const s = StyleSheet.create({
  page: { padding: SPACING.base, paddingBottom: 36, gap: 10, backgroundColor: COLORS.surface },
  title: { fontSize: 23, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  label: { fontWeight: '600', marginTop: 8, color: COLORS.text },
  hint: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, lineHeight: 18 },
  choice: { padding: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surface },
  active: { backgroundColor: COLORS.primary },
  text: { color: COLORS.text, fontSize: FONT_SIZE.sm },
  white: { color: COLORS.textOnPrimary, fontWeight: FONT_WEIGHT.bold },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: 12, color: COLORS.text, backgroundColor: COLORS.surfaceAlt },
  multiline: { height: 92, textAlignVertical: 'top' },
  locationButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, padding: 10 },
  locationIcon: { color: COLORS.primary, fontSize: 22, fontWeight: '700' },
  locationButtonText: { color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },
  locationCard: { backgroundColor: '#e8f6f5', borderRadius: BORDER_RADIUS.md, padding: 12, gap: 4 },
  locationTitle: { fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  button: { backgroundColor: COLORS.primary, padding: 15, borderRadius: BORDER_RADIUS.md, alignItems: 'center', marginTop: 10, minHeight: 50, justifyContent: 'center' },
  disabled: { opacity: 0.7 },

  });
  return s;
}
