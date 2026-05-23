/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1976D2',
          dark: '#1565C0',
          light: '#42A5F5',
        },
      },
      fontSize: {
        caption: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.06em' }],
        label: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        body: ['1rem', { lineHeight: '1.5rem' }],
        'body-lg': ['1.125rem', { lineHeight: '1.5rem' }],
        'title-sm': ['1.25rem', { lineHeight: '1.375rem' }],
        title: ['1.5rem', { lineHeight: '1.75rem' }],
      },
      minHeight: {
        touch: '2.75rem',
        nav: '5rem',
      },
      height: {
        nav: '5rem',
      },
      spacing: {
        'page-x': '1.5rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
