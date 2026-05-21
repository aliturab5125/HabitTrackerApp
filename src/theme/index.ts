export const colors = {
  background: '#0D1B2A',
  surface: 'rgba(245,240,235,0.05)',
  surfaceBorder: 'rgba(123,94,167,0.12)',
  modalSurface: '#131f30',
  primary: '#7B5EA7',
  success: '#A8D5BA',
  streakAmber: '#F5C842',
  streakAmberMuted: '#a08060',
  textPrimary: '#F5F0EB',
  textMuted: '#6a85a0',
  textLabel: '#4a6080',
  tabBar: 'rgba(13,27,42,0.92)',
  tabBarBorder: 'rgba(123,94,167,0.18)',
  tabBarActiveBg: 'rgba(123,94,167,0.18)',
  tabBarActiveText: '#a78cd4',
  tabBarInactiveText: '#4a6080',
  streakCardStart: '#3d2a1a',
  streakCardEnd: '#2a1e35',
  streakCardBorder: 'rgba(255,180,50,0.15)',
  fabShadow: 'rgba(123,94,167,0.5)',
  habitColors: [
    '#A8D5BA',
    '#b9a4e0',
    '#f5b8a0',
    '#f5c5d0',
    '#8ec8e8',
    '#e8b8b8',
    '#f5d080',
    '#b8d8a0',
  ],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  emoji: 28,
  emojiFab: 28,
  emojiEmpty: 64,
  emojiRow: 20,
} as const;

export const fontFamily = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

export const radii = {
  card: 14,
  cardLg: 16,
  pill: 20,
  fab: 28,
  circle: 999,
} as const;

export const letterSpacing = {
  label: 0.7,
} as const;

const theme = { colors, spacing, fontSize, fontFamily, radii, letterSpacing };
export default theme;
