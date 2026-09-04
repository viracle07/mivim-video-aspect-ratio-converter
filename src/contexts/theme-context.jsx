"use client";

import { createContext, useContext, useEffect, useState } from "react";

const fallbackTheme = {
  theme: "system",
  setTheme(value) {
    if (typeof window === "undefined") return;
    localStorage.setItem("mivim-theme", value);
    document.documentElement.dataset.theme = value === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : value;
  }
};
const ThemeContext = createContext(fallbackTheme);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system");

  useEffect(() => {
    const saved = localStorage.getItem("mivim-theme") || "system";
    setThemeState(saved);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.dataset.themePreference = theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  function setTheme(value) {
    localStorage.setItem("mivim-theme", value);
    setThemeState(value);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
