"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  isDark: true,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")
  const isDark = theme === "dark"

  // Apply theme function
  const applyTheme = (newTheme: Theme) => {
    if (newTheme === "light") {
      document.documentElement.classList.add("light-mode")
    } else {
      document.documentElement.classList.remove("light-mode")
    }
    console.log("Theme applied:", newTheme)
  }

  useEffect(() => {
    // Initialize theme from localStorage on mount
    try {
      const savedTheme = (localStorage.getItem("theme") as Theme) || "dark"
      console.log("Initial theme from localStorage:", savedTheme)
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } catch (e) {
      console.error("Error initializing theme:", e)
    }
  }, [])

  const toggleTheme = () => {
    try {
      const newTheme = theme === "dark" ? "light" : "dark"
      console.log("Toggling theme to:", newTheme)
      setTheme(newTheme)
      localStorage.setItem("theme", newTheme)
      applyTheme(newTheme)
    } catch (e) {
      console.error("Error toggling theme:", e)
    }
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-opacity-10 hover:bg-gray-500"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
