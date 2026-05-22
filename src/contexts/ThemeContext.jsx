import { createContext, useEffect, useState } from "react";
import { api } from "../api/Aquasmart";

export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
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

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
