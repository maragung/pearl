import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pearl: {
          50: '#f0f7ff',
          100: '#e0eefe',
          200: '#bae0fd',
          300: '#7cc9fc',
          400: '#36aef8',
          500: '#0c94e9',
          600: '#0077c7',
          700: '#015ea1',
          800: '#065185',
          900: '#0b446e',
          950: '#072b49',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
