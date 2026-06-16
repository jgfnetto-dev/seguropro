import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#fbf8ff',
        foreground: '#1a1b22',
        surface: '#fbf8ff',
        'surface-dim': '#dad9e3',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f4f2fc',
        'surface-container': '#eeedf7',
        'surface-container-high': '#e8e7f1',
        'surface-container-highest': '#e3e1eb',
        'on-surface': '#1a1b22',
        'on-surface-variant': '#444653',
        outline: '#757684',
        'outline-variant': '#c4c5d5',
        primary: {
          DEFAULT: '#00288e',
          container: '#1e40af',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#a8b8ff',
        secondary: {
          DEFAULT: '#0058be',
          container: '#2170e4',
        },
        'on-secondary': '#ffffff',
        tertiary: {
          DEFAULT: '#611e00',
          container: '#872d00',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        border: '#c4c5d5',
        input: '#c4c5d5',
        ring: '#3755c3',
        muted: {
          DEFAULT: '#eeedf7',
          foreground: '#444653',
        },
        accent: {
          DEFAULT: '#eeedf7',
          foreground: '#1a1b22',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1a1b22',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#1a1b22',
        },
        destructive: {
          DEFAULT: '#ba1a1a',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.05)',
        overlay: '0 4px 12px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}

export default config
