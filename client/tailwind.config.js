/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        'primary': '#283618',
        'secondary': '#606c38',
        'blackBG': '#fefae0',
        'favourite': '#bc6c25'
      }
    },
  },
  plugins: [],
}

