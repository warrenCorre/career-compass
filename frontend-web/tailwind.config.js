/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4f7f2',
          100: '#e9efe5',
          200: '#d3dfcb',
          300: '#bdcfb1',
          400: '#a7bf97',
          500: '#4A6A3B', // Your original green!
          600: '#3d5a30',
          700: '#2e4524',
          800: '#1e2e18',
          900: '#0f170c',
        },
        secondary: {
          50: '#f6faf7',
          100: '#edf5ef',
          200: '#dbeade',
          300: '#c9e0ce',
          400: '#b7d5bd',
          500: '#A3C9A8',
          600: '#82a186',
          700: '#627965',
          800: '#415043',
          900: '#212822',
        },
        accent: {
          50: '#fefbf8',
          100: '#fdf7f1',
          200: '#fbf0e3',
          300: '#f9e8d5',
          400: '#f7e1c7',
          500: '#F4E3C6',
          600: '#c3b69e',
          700: '#928a77',
          800: '#625d4f',
          900: '#312f28',
        },
        dark: '#2C3E50',
        light: '#F9F7F3',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'float': 'float 20s ease-in-out infinite',
        'float-slow': 'float 30s ease-in-out infinite',
        'float-slower': 'float 40s ease-in-out infinite',
        'gradient': 'gradient 6s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-up': 'scaleUp 0.2s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(50px, 50px) rotate(90deg)' },
          '50%': { transform: 'translate(0, 100px) rotate(180deg)' },
          '75%': { transform: 'translate(-50px, 50px) rotate(270deg)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundSize: {
        '300%': '300%',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
        'strong': '0 10px 40px -3px rgba(0, 0, 0, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}