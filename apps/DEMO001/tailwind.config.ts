import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic colors (required for component templates)
        background: '#FFFFFF',
        surface: '#F8F9FA',
        foreground: '#202124',
        muted: '#5f6368',
        border: '#DADCE0',

        // Brand colors
        primary: '#1a73e8',
        'primary-hover': '#1557b0',
        secondary: '#ea4335',
        accent: '#34a853',
        'accent-orange': '#fbbc04',

        // Semantic text colors
        text: {
          primary: '#202124',
          secondary: '#5f6368',
          tertiary: '#80868b',
        },

        // Semantic background colors
        bg: {
          primary: '#FFFFFF',
          secondary: '#F8F9FA',
          tertiary: '#F1F3F4',
        },

        // Border colors
        'border-light': '#E8EAED',
        'border-dark': '#DADCE0',

        // Status colors
        info: '#1a73e8',
        success: '#34a853',
        warning: '#fbbc04',
        error: '#ea4335',

        // AI colors
        'ai-pastel': '#E8F0FE',
      },
      fontFamily: {
        primary: ['Google Sans', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        secondary: ['Google Sans Display', 'sans-serif'],
      },
      fontSize: {
        xs: '11px',
        sm: '12px',
        base: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '22px',
        '3xl': '28px',
        '4xl': '36px',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      letterSpacing: {
        tight: '-0.01em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        card: '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)',
        button: '0 1px 3px 0 rgba(26,115,232,0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
