/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          950: "#050712",
          900: "#080d1f",
          800: "#0c1530",
          700: "#142145",
        },
        pulse: {
          blue: "#3ba7ff",
          cyan: "#19e6d7",
          violet: "#8d6cff",
          lime: "#b6ff6d",
        },
      },
      boxShadow: {
        glow: "0 0 55px rgba(25, 230, 215, 0.18)",
        panel: "0 24px 80px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "radial-field":
          "radial-gradient(circle at 20% 20%, rgba(59, 167, 255, 0.18), transparent 30%), radial-gradient(circle at 80% 10%, rgba(141, 108, 255, 0.18), transparent 28%), radial-gradient(circle at 70% 85%, rgba(25, 230, 215, 0.12), transparent 32%)",
      },
    },
  },
  
  plugins: [], 
};
