/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brutalist: {
          bg: '#0a0a0a',
          card: '#111111',
          surface: '#1a1a1a',
          border: '#404040',
          muted: '#a3a3a3',
          text: '#fafafa',
          accent: '#facc15',
        }
      },
      boxShadow: {
        brutalist: '4px 4px 0px rgba(255,255,255,0.05)',
        'brutalist-hover': '6px 6px 0px #facc15',
      }
    },
  },
  plugins: [],
};
