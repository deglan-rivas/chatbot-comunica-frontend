import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--chatbot-primary, #0056b3)',
        'background-light': 'var(--chatbot-bg-light, #F3F4F6)',
        'background-dark': 'var(--chatbot-bg-dark, #111827)',
        'chat-bg-light': 'var(--chatbot-chat-bg-light, #E5DDD5)',
        'chat-bg-dark': 'var(--chatbot-chat-bg-dark, #0B141A)',
        'bot-bubble-light': 'var(--chatbot-bot-bubble-light, #FFFFFF)',
        'bot-bubble-dark': 'var(--chatbot-bot-bubble-dark, #202C33)',
        'user-bubble-light': 'var(--chatbot-user-bubble-light, #D9FDD3)',
        'user-bubble-dark': 'var(--chatbot-user-bubble-dark, #005C4B)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
