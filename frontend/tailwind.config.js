/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#0f1117',
          secondary: '#161b22',
          cell: '#1c2128',
          'cell-center': '#21262d',
          hover: '#2a2f3a',
        },
        border: {
          default: '#30363d',
          focus: '#58a6ff',
          subgoal: '#388bfd',
        },
        text: {
          primary: '#e6edf3',
          secondary: '#8b949e',
          accent: '#58a6ff',
        },
        accent: {
          0: '#f78166',
          1: '#ff9f43',
          2: '#ffd166',
          3: '#06d6a0',
          4: '#58a6ff',
          5: '#a78bfa',
          6: '#ec4899',
          7: '#67e8f9',
        }
      }
    }
  },
  plugins: []
}
