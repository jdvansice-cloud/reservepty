import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a1628',
          light: '#1a2b4a',
        },
        accent: {
          DEFAULT: '#c8b273',
          light: '#d4c088',
        },
      },
      fontFamily: {
        serif: ['Didot LT Pro', 'Didot', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
