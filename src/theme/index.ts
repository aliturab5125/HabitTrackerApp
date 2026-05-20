export const colors = {
  primary: '#6C63FF',
  background: '#0F0F14',
  surface: '#1C1C27',
  text: '#FFFFFF',
  textMuted: '#8A8A9A',
  success: '#4CAF82',
  border: '#2E2E3E',
  habitColors: [
    '#6C63FF',
    '#FF6584',
    '#43C6AC',
    '#F7971E',
    '#4776E6',
    '#C471ED',
    '#12C2E9',
    '#F64F59',
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
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

const theme = { colors, spacing, fontSize };
export default theme;
