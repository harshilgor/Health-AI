/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#F5F5F7",
                foreground: "#000000",
                accent: "#000000",
                card: "#FFFFFF",
                "card-muted": "#EFEFF4",
                muted: "#86868B",
            },
            fontFamily: {
                serif: ['"EB Garamond"', 'serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
                sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"San Francisco"', '"SF Pro Text"', '"Helvetica Neue"', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
