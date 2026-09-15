/** Design tokens — docs/DESIGNV2.md §6, §7, §9, §63 (UI source of truth). */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Legacy tokens — kept for dashboard/auth/student pages */
        navy: '#05051E',
        surface: {
          DEFAULT: '#15162F',
          hover: '#202143',
        },
        edge: '#292A45',
        ink: {
          DEFAULT: '#FFFFFF',
          soft: '#D5D6E3',
          muted: '#85889F',
        },
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
        },
        /* Landing page tokens — Dark Glassmorphism style */
        'lp-bg': '#08090d',
        'lp-bg-soft': '#0d0f15',
        'lp-card': '#11131a',
        'lp-card-hover': '#151821',
        'lp-text': '#f5f5f7',
        'lp-muted': '#8b8f9a',
        'lp-muted-light': '#b8bbc4',
        'lp-border': 'rgba(255,255,255,0.09)',
        'lp-border-hover': 'rgba(255,255,255,0.18)',
        'lp-accent': '#a78bfa',
        'lp-accent-2': '#7c3aed',
        'lp-accent-soft': 'rgba(167,139,250,0.12)',
        'lp-green': '#6ee7b7',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        'lp-sans': ['Manrope', 'system-ui', 'sans-serif'],
        'lp-mono': ['DM Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '8px',
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
        DEFAULT: '0 2px 8px 0 rgb(0 0 0 / 0.25)',
        lg: '0 12px 32px -8px rgb(0 0 0 / 0.4)',
      },
    },
  },
  plugins: [],
};
