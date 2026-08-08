// ─── NIGHT HAS COME — Design Tokens ─────────────────────────────────
// Premium psychological-thriller aesthetic.
// 8px spacing system. Dark theme. Accessible.

export const colors = {
  // Base
  base: {
    900: '#080A10',
    800: '#0E121B',
    700: '#151A25',
    600: '#1D2432',
    500: '#252D3D',
    400: '#323C50',
    300: '#455066',
    200: '#5E6D88',
    100: '#8393AD',
  },

  // Text
  text: {
    primary: '#F4F6FA',
    secondary: '#9BA6B8',
    muted: '#5E6D88',
    disabled: '#455066',
  },

  // Factions
  faction: {
    civic: '#72C8FF',
    civicSoft: 'rgba(114, 200, 255, 0.12)',
    civicBorder: 'rgba(114, 200, 255, 0.30)',
    veil: '#C35CFF',
    veilSoft: 'rgba(195, 92, 255, 0.12)',
    veilBorder: 'rgba(195, 92, 255, 0.30)',
    independent: '#F0B86B',
    independentSoft: 'rgba(240, 184, 107, 0.12)',
    independentBorder: 'rgba(240, 184, 107, 0.30)',
  },

  // Semantic
  warning: '#F4B942',
  danger: '#F05D67',
  success: '#72D69A',
  focus: '#B9E7FF',
  info: '#72C8FF',

  // Surfaces
  surface: {
    card: '#151A25',
    elevated: '#1D2432',
    overlay: 'rgba(8, 10, 16, 0.85)',
    glass: 'rgba(21, 26, 37, 0.80)',
    input: '#0E121B',
  },

  // Borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.10)',
    strong: 'rgba(255, 255, 255, 0.16)',
    focus: 'rgba(185, 231, 255, 0.40)',
  },
} as const;

export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

export const radii = {
  sm: '6px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
  md: '0 2px 8px rgba(0, 0, 0, 0.5)',
  lg: '0 4px 16px rgba(0, 0, 0, 0.6)',
  xl: '0 8px 32px rgba(0, 0, 0, 0.7)',
  glow: {
    civic: '0 0 12px rgba(114, 200, 255, 0.25)',
    veil: '0 0 12px rgba(195, 92, 255, 0.25)',
    danger: '0 0 12px rgba(240, 93, 103, 0.25)',
  },
} as const;

export const typography = {
  fontFamily: {
    display: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.8125rem',  // 13px
    base: '0.9375rem', // 15px
    lg: '1.0625rem',  // 17px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.2',
    base: '1.5',
    relaxed: '1.7',
  },
} as const;

export const animation = {
  duration: {
    fast: '150ms',
    base: '250ms',
    slow: '400ms',
    phase: '800ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    tension: 'cubic-bezier(0.2, 0, 0, 1)',
  },
} as const;

export const breakpoints = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1440,
} as const;

export const touchTarget = {
  minimum: '44px',
} as const;
