import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        panel: '#FFFFFF',
        border: '#E2E8F0',
        primary: '#2563EB',
        success: '#16A34A',
        warning: '#D97706',
        error: '#DC2626',
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        muted: '#94A3B8',
        op: {
          charge: '#6366F1',
          react: '#EF4444',
          filter: '#8B5CF6',
          dry: '#F59E0B',
          heatcool: '#0EA5E9',
          mixage: '#6B7280',
          custom: '#84CC16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
