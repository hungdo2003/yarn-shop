/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '360px',   // Samsung A/Redmi/Oppo phổ biến
        // sm: 640px  (default)
        // md: 768px  (default — iPad mini/iPad)
        // lg: 1024px (default — iPad Pro 12.9")
      },
      colors: {
        primary: { DEFAULT: '#C2185B', light: '#E91E63', dark: '#880E4F' },
        secondary: { DEFAULT: '#FF8A80', light: '#FFCCBC', dark: '#FF5252' },
        accent: '#FFF8E1',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] }
    }
  },
  plugins: []
};
