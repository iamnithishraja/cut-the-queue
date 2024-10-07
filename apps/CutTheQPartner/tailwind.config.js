/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#0A0A0A",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0A0A0A",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#0A0A0A",
        },
        primary: {
          DEFAULT: "#EF4444",
          foreground: "#FEF2F2",
        },
        secondary: {
          DEFAULT: "#F5F5F5",
          foreground: "#171717",
        },
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#737373",
        },
        accent: {
          DEFAULT: "#F5F5F5",
          foreground: "#171717",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FAFAFA",
        },
        border: "#E5E5E5",
        input: "#E5E5E5",
        ring: "#EF4444",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      chart: {
        1: "#F97316",
        2: "#14B8A6",
        3: "#0F172A",
        4: "#EAB308",
        5: "#F97316",
      },
    },
  },
  plugins: [],
};