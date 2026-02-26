/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './apps/web/src/**/*.{html,ts,scss}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e3f2fd',
                    100: '#bbdefb',
                    200: '#90caf9',
                    300: '#64b5f6',
                    400: '#42a5f5',
                    500: '#1976d2',
                    600: '#1565c0',
                    700: '#0d47a1',
                    800: '#0a3d91',
                    900: '#072e6f',
                },
                accent: {
                    50: '#fff3e0',
                    100: '#ffe0b2',
                    200: '#ffcc80',
                    300: '#ffb74d',
                    400: '#ffa726',
                    500: '#ff9800',
                    600: '#fb8c00',
                    700: '#f57c00',
                    800: '#ef6c00',
                    900: '#e65100',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Roboto', 'Helvetica Neue', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
