import type { Config } from 'tailwindcss';

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
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        neutral: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
        success: {
          50: '#ebfbee',
          100: '#d3f9d8',
          200: '#b2f2bb',
          300: '#8ce99a',
          400: '#69db7c',
          500: '#51cf66',
          600: '#40c057',
          700: '#37b24d',
          800: '#2f9e44',
          900: '#2b8a3e',
        },
      },
      fontFamily: {
        sans: ['Valley Sans', 'system-ui', 'sans-serif'],
        valley: ['Valley Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
