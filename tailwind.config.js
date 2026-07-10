import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx}',
    ],

    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Noto Sans JP"', '"Inter"', ...defaultTheme.fontFamily.sans],
                display: ['"Yuji Syuku"', '"Noto Sans JP"', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};