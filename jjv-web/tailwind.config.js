/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#141110',
        card: '#1e1b19',
        border: '#332e2b',
        foreground: '#ede8e3',
        muted: '#8f8580',
        jjv: {
          coral: {
            DEFAULT: '#c27a66',
            light: '#d4956f',
            dark: '#8f5c48',
          },
          blue: {
            DEFAULT: '#6b94b8',
            light: '#8badc8',
            dark: '#4a7194',
          },
          gold: {
            DEFAULT: '#c9a355',
            light: '#d4b872',
            dark: '#b39540',
          },
          red: {
            DEFAULT: '#b55e5e',
            light: '#c87a7a',
            dark: '#a04d4d',
          },
          surface: {
            50: '#f5f0eb',
            100: '#ede8e3',
            200: '#d4cec8',
            300: '#b5aea8',
            400: '#8f8580',
            500: '#5e5752',
            600: '#4a4440',
            700: '#332e2b',
            800: '#262220',
            900: '#1a1714',
            950: '#120f0d',
          }
        }
      }
    },
  },
  plugins: [],
}
