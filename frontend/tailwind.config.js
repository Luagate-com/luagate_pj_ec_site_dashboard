/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Figma 準拠のトークン
        brand: {
          DEFAULT: "#05B45B",
          hover: "#04A052",
          light: "rgba(5,180,91,0.1)",
          dark: "#037F40",
        },
        warning: {
          DEFAULT: "#F2B705",
          light: "rgba(242,183,5,0.1)",
        },
        danger: {
          DEFAULT: "#F15025",
          light: "#FFF5F0",
        },
        muted: {
          DEFAULT: "#AEADA9",
          light: "rgba(174,173,169,0.1)",
        },
        ink: {
          DEFAULT: "#363635",
          sub: "#727270",
          disabled: "#A3A3A3",
        },
        surface: {
          DEFAULT: "#FDFDFA",
          second: "#F5F4ED",
        },
        line: "#DCDCD9",
        canvas: "#FDFDFA",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Hiragino Sans",
          "Yu Gothic",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
