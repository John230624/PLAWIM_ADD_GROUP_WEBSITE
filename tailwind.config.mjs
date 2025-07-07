// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInSlow: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Add this keyframe for the bounce animation
        bounceOnce: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '20%': {
            transform: 'translateY(-10%)',
          },
          '40%': {
            transform: 'translateY(0%)',
          },
          '60%': {
            transform: 'translateY(-5%)',
          },
          '80%': {
            transform: 'translateY(0%)',
          },
        },
      },
      animation: {
        'fade-in-slow': 'fadeInSlow 0.5s ease-out forwards',
        // Add this animation utility
        'bounce-once': 'bounceOnce 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
};

export default config;