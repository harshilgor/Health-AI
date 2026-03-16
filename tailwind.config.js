/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#FAFAFA",
                foreground: "#0A0A0A",
                accent: "#0A0A0A",
                card: "#FFFFFF",
                "card-muted": "#F5F5F5",
                muted: "#737373",
            },
            fontFamily: {
                serif: ['"EB Garamond"', 'serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
                sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.25rem',
            },
        },
    },
    plugins: [],
}
