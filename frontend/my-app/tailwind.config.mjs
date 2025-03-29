/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        centauri: ['Centauri', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
        'roboto-mono': ['Roboto Mono', 'monospace'],
      },
      colors: {
        silver: {
          300: '#CFD8DC',
        },
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
