const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101418",
        mist: "#f5f7f8",
        line: "#d9e0e4",
        mivim: {
          500: "#14b8a6",
          600: "#0f9488",
          900: "#0c3b3a"
        },
        coral: "#f9735b",
        amber: "#f5b84b"
      },
      boxShadow: {
        soft: "0 16px 50px rgba(16, 20, 24, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
