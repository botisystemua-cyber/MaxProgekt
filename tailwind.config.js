/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CSS-змінні дозволяють тенанту перевизначити кольори через
        // primary_color / secondary_color у БД (див. RestaurantHeader).
        brand: {
          primary: 'var(--color-brand-primary, #FF6B35)',
          secondary: 'var(--color-brand-secondary, #1A1A2E)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        // "Опукло з тінями" — м'яка, але помітна елевація для карток і пілюль.
        soft: '0 4px 16px -6px rgba(15, 23, 42, 0.12), 0 2px 6px -2px rgba(15, 23, 42, 0.06)',
        raised: '0 12px 28px -10px rgba(15, 23, 42, 0.20), 0 6px 12px -4px rgba(15, 23, 42, 0.10)',
        glow: '0 8px 32px -8px var(--color-brand-primary, #FF6B35)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pop-in': 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
