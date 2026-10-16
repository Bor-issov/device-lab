/** @type {import('tailwindcss').Config} */
module.exports = {
  // Class strategy so Device Lab can set light/dark per frame on web.
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#44423e',
        paper: '#ebe7e3',
        signal: '#ecf94d',
      },
    },
  },
  plugins: [],
};
