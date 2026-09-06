/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0D9488', // Teal/Green from design
                    light: '#ccfbf1',
                },
                secondary: {
                    DEFAULT: '#2563EB', // Blue from design
                    light: '#dbeafe',
                },
                neutral: {
                    900: '#111827', // Text color
                    100: '#F3F4F6', // Subtle backgrounds
                    50: '#F9FAFB',  // Main app background
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Standard clean font
            }
        },
    },
    plugins: [],
};