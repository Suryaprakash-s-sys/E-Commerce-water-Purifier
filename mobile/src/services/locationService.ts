import * as Location from 'expo-location'

export type CapturedAddressLocation = {
  lat: number
  lng: number
  street?: string
  streetNumber?: string
  district?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
}

export async function captureCurrentAddressLocation(): Promise<CapturedAddressLocation> {
  const permission = await Location.requestForegroundPermissionsAsync()
  if (permission.status !== 'granted') throw new Error('Allow location access to use your current location.')

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
  const [place] = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  })

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    street: place?.street ?? undefined,
    streetNumber: place?.streetNumber ?? undefined,
    district: place?.district ?? place?.subregion ?? undefined,
    city: place?.city ?? undefined,
    region: place?.region ?? undefined,
    postalCode: place?.postalCode ?? undefined,
    country: place?.country ?? undefined,
  }
}
