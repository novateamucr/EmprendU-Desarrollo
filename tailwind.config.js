/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#222222',
        secondary: '#666666',
        border: '#E6E6E6',
        background: '#F2F2F2',
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
    },
  },
  plugins: [],
}