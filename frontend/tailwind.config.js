/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                logo: ['"Bangers"', 'sans-serif'],
                '404': ['"BBH Bartle"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
