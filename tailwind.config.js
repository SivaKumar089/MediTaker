/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',
                secondary: '#10b981',
                danger: '#ef4444',
                warning: '#f59e0b',
                caretaker: {
                    primary: '#3b82f6',
                    dark: '#2563eb',
                    light: '#60a5fa',
                    accent: '#0ea5e9',
                    background: '#eff6ff',
                },
                patient: {
                    primary: '#10b981',
                    dark: '#059669',
                    light: '#34d399',
                    accent: '#14b8a6',
                    background: '#f0fdf4',
                }
            },
        },
    },
    plugins: [],
}
