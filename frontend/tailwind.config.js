/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        morty: ['Orbitron', 'monospace'],
        enclave: ['Roboto Mono', 'monospace'],
        warlock: ['Cinzel', 'serif'],
      },
      colors: {
        portal: {
          green: '#39ff14',
          dark: '#0a0a0a',
          glow: '#00ff41',
        },
        enclave: {
          blue: '#1a3a6e',
          white: '#e8e8e8',
          gold: '#c9a227',
        },
        warlock: {
          blood: '#8b0000',
          parchment: '#d4c4a8',
          shadow: '#1a0a0a',
          rune: '#ff4444',
        },
      },
      animation: {
        'portal-spin': 'portalSpin 8s linear infinite',
        'glitch': 'glitch 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'blood-drip': 'bloodDrip 3s ease-in-out infinite',
        'data-stream': 'dataStream 1.5s linear infinite',
        'wisp': 'wisp 4s ease-in-out infinite',
      },
      keyframes: {
        portalSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '60%': { transform: 'translate(-1px, -1px)' },
          '80%': { transform: 'translate(1px, 1px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px currentColor' },
          '50%': { boxShadow: '0 0 25px currentColor, 0 0 40px currentColor' },
        },
        bloodDrip: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7', textShadow: '0 2px 4px #8b0000' },
        },
        dataStream: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
        wisp: {
          '0%, 100%': { transform: 'translateY(0) opacity(0.3)' },
          '50%': { transform: 'translateY(-20px) opacity(0.8)' },
        },
      },
    },
  },
  plugins: [],
};
