// ============================================================
// Califnco Water Purifier App — Theme System
// ============================================================

export const COLORS = {
// Sky-blue and slate palette from the supplied mobile UI direction.
  primary: '#5C6B73',
  primaryDark: '#455A64',
  primaryLight: '#89D9E6',
  accent: '#89D9E6',
  accentDark: '#3B8794',

  secondary: '#5C6B73',
  success: '#27A98D',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#4B9EAE',

  background: '#455A64',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F8F9',
  card: '#FFFFFF',

  text: '#1C343C',
  textSecondary: '#50666E',
  textMuted: '#829398',
  textLight: '#A0AFB2',
  textOnPrimary: '#FFFFFF',

  border: '#D4E0E2',
  borderLight: '#E5ECEE',
  divider: '#DCE6E8',

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

export const FONTS = {
  regular: 'sans-serif-rounded',
  medium: 'sans-serif-rounded',
  semiBold: 'sans-serif-rounded',
  bold: 'sans-serif-rounded',
  heading: 'sans-serif-rounded',
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
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  full: 9999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
