// ============================================================
// Califnco Water Purifier App — Theme System
// ============================================================

const LIGHT_COLORS = {
  // Soft neutral palette inspired by the supplied editorial shopping UI.
  primary: '#171719',
  primaryDark: '#111113',
  primaryLight: '#E4E3E8',
  accent: '#8ADBE5',
  accentDark: '#347D88',

  secondary: '#55555B',
  success: '#278B72',
  warning: '#D69424',
  error: '#C94747',
  info: '#4E9BA5',

  background: '#F1F0F4',
  surface: '#FFFFFF',
  surfaceAlt: '#E9E8ED',
  card: '#FFFFFF',

  text: '#19191D',
  textSecondary: '#696970',
  textMuted: '#92929A',
  textLight: '#ADADB4',
  textOnPrimary: '#FFFFFF',

  border: '#DEDEE3',
  borderLight: '#ECEBF0',
  divider: '#E5E4E9',

  // Status colors
  pending: '#F39C12',
  confirmed: '#3498DB',
  processing: '#9B59B6',
  shipped: '#24BFB4',
  delivered: '#27AE60',
  cancelled: '#E74C3C',

  // Dealer badge
  dealerBadge: '#F39C12',
  dealerBadgeText: '#FFFFFF',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.2)',
};

const DARK_COLORS: typeof LIGHT_COLORS = {
  ...LIGHT_COLORS,
  primary: '#8ADBE5',
  primaryDark: '#101114',
  primaryLight: '#303238',
  accent: '#8ADBE5',
  accentDark: '#6CC7D3',
  secondary: '#A3A3AD',
  success: '#54C6A2',
  warning: '#F0B44C',
  error: '#FF7777',
  info: '#7BCAD4',
  background: '#101114',
  surface: '#1B1C20',
  surfaceAlt: '#28292E',
  card: '#1B1C20',
  text: '#F4F4F5',
  textSecondary: '#C7C7CE',
  textMuted: '#A0A0AA',
  textLight: '#85858F',
  textOnPrimary: '#101114',
  border: '#383940',
  borderLight: '#2D2E34',
  divider: '#383940',
  dealerBadgeText: '#101114',
  overlay: 'rgba(0,0,0,0.72)',
  overlayLight: 'rgba(0,0,0,0.4)',
};

export const COLORS: typeof LIGHT_COLORS = { ...LIGHT_COLORS };

export function setColorScheme(mode: 'light' | 'dark'): void {
  Object.assign(COLORS, mode === 'dark' ? DARK_COLORS : LIGHT_COLORS);
  STATUS_COLORS.refunded = COLORS.textMuted;
}

export const FONTS = {
  regular: 'sans-serif',
  medium: 'sans-serif-medium',
  semiBold: 'sans-serif-medium',
  bold: 'sans-serif',
  heading: 'Georgia',
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  hero: 36,
};

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BORDER_RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 34,
  full: 9999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#25242A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.035,
    shadowRadius: 5,
    elevation: 1,
  },
  md: {
    shadowColor: '#25242A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.055,
    shadowRadius: 10,
    elevation: 2,
  },
  lg: {
    shadowColor: '#25242A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.pending,
  confirmed: COLORS.confirmed,
  processing: COLORS.processing,
  shipped: COLORS.shipped,
  delivered: COLORS.delivered,
  cancelled: COLORS.cancelled,
  refunded: COLORS.textMuted,
  approved: COLORS.success,
  rejected: COLORS.error,
};
