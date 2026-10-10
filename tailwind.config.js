module.exports = {
  darkMode: 'media',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d' },
      },
      fontFamily: { sans: ['var(--font-sans)', 'sans-serif'], serif: ['var(--font-serif)', 'Georgia', 'serif'] },
    },
  },
};
