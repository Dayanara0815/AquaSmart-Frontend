import { createContext, useEffect, useState } from "react";
import { api } from "../api/Aquasmart";

export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
  daltonismEnabled: false,
  toggleDaltonism: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("aquasmart:theme");
      return saved === "dark" ? "dark" : "light";
    } catch (e) {
      return "light";
    }
  });

  const [daltonismEnabled, setDaltonismEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("aquasmart:daltonism");
      return saved === "true";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("aquasmart:theme", theme);
    } catch (e) {
      // ignore
    }
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("theme-dark");
      root.classList.remove("theme-light");
    } else {
      root.classList.add("theme-light");
      root.classList.remove("theme-dark");
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem("aquasmart:daltonism", String(daltonismEnabled));
    } catch (e) {
      // ignore
    }
    const root = document.documentElement;
    if (daltonismEnabled) {
      root.classList.add("theme-daltonism");
    } else {
      root.classList.remove("theme-daltonism");
    }
  }, [daltonismEnabled]);

  // On mount try to load preference from backend (if user has one)
  useEffect(() => {
    let mounted = true;
    api.getUserTheme()
      .then((res) => {
        if (mounted && res && res.theme) {
          setTheme(res.theme === "dark" ? "dark" : "light");
        }
      })
      .catch(() => {
        // ignore if backend not available
      });
    return () => {
      mounted = false;
    };
  }, []);

  const toggleTheme = (next) => {
    setTheme((cur) => {
      const newT = next ? next : cur === "light" ? "dark" : "light";
      // persist to backend (fire-and-forget)
      try {
        api.setUserTheme(newT).catch(() => {});
      } catch (e) {
        // ignore
      }
      return newT;
    });
  };

  const toggleDaltonism = (val) => {
    setDaltonismEnabled((prev) => {
      const nextVal = typeof val === "boolean" ? val : !prev;
      return nextVal;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, daltonismEnabled, toggleDaltonism }}>
      {children}
    </ThemeContext.Provider>
  );
}
