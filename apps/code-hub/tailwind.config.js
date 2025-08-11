const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        // Refined palette
        'primary-user': '#2563eb', // blue-600
        'primary-bot': '#e2e8f0', // slate-200
        'bg-chat': '#f8fafc', // slate-50
      },
    },
  },
  plugins: [],
};
