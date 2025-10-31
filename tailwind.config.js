/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
      },
      colors: {
        primary: '#0e0e0e',
        secondary: '#666666',
        border: '#E6E6E6',
        background: '#F2F2F2',
        brand: '#76b0cd',
        brandDark: '#4a7fa0',
        brandLight: '#81bcdaff',
      },
      boxShadow: {
        soft: '0 6px 20px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        card: '12px',
        avatar: '20px',
        navbar: '16px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(3deg)' },
        },
        'float-fast': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
      
        'float-diagonal': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(6px, -8px)' },
          '50%': { transform: 'translate(0, -12px)' },
          '75%': { transform: 'translate(-6px, -8px)' },
        },
      },

      animation: {
        float: 'float 4s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'float-fast': 'float-fast 3.5s ease-in-out infinite',
        'float-diagonal': 'float-diagonal 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
