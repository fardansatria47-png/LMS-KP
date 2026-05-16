export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        // Override Tailwind default sizes — sedikit lebih kecil
        'xs':   ['0.7rem',   { lineHeight: '1rem' }],       // 9.8px
        'sm':   ['0.8rem',   { lineHeight: '1.2rem' }],     // 11.2px
        'base': ['0.875rem', { lineHeight: '1.375rem' }],   // 12.25px
        'lg':   ['0.95rem',  { lineHeight: '1.5rem' }],     // 13.3px
        'xl':   ['1.05rem',  { lineHeight: '1.6rem' }],     // 14.7px
        '2xl':  ['1.2rem',   { lineHeight: '1.75rem' }],    // 16.8px
        '3xl':  ['1.4rem',   { lineHeight: '1.9rem' }],     // 19.6px
        '4xl':  ['1.65rem',  { lineHeight: '2.1rem' }],     // 23.1px
        '5xl':  ['1.9rem',   { lineHeight: '2.3rem' }],     // 26.6px
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease",
      },
    },
  },
  plugins: [],
};
