/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './context/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f0ea',
          100: '#e6dcc9',
          200: '#d3bd97',
          300: '#bd9a66',
          400: '#a87c45',
          500: '#8c6332',
          600: '#704d27',
          700: '#583c20',
          800: '#46301c',
          900: '#3a281a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
