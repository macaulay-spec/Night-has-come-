/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: { 900: '#080A10', 800: '#0E121B', 700: '#151A25', 600: '#1D2432', 500: '#252D3D' },
        civic: { DEFAULT: '#72C8FF', soft: 'rgba(114, 200, 255, 0.12)' },
        veil: { DEFAULT: '#C35CFF', soft: 'rgba(195, 92, 255, 0.12)' },
        independent: { DEFAULT: '#F0B86B', soft: 'rgba(240, 184, 107, 0.12)' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { sm: '6px', md: '12px', lg: '16px' },
      animation: { 'phase-fade': 'phaseFade 800ms cubic-bezier(0.2, 0, 0, 1)' },
      keyframes: { phaseFade: { '0%': { opacity: '0', transform: 'scale(0.98)' }, '100%': { opacity: '1', transform: 'scale(1)' } } },
    },
  },
  plugins: [],
};
