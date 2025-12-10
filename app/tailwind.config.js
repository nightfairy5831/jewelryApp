/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#000000',
          dark: '#1a1a1a',
        },
        secondary: {
          DEFAULT: '#FFAE00',
        },
        accent: {
          DEFAULT: '#535252',
        },
      }
    },
  },
  plugins: [],
}
