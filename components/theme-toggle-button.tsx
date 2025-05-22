"use client"

import { useTheme } from "@/contexts/theme-context"
import { Moon, Sun } from "lucide-react"

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center gap-2 rounded-full px-3 py-2 transition-colors
        ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"}
      `}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <>
          <Sun size={18} className="text-yellow-400" />
          <span className="text-sm font-medium md:inline">Light Mode</span>
        </>
      ) : (
        <>
          <Moon size={18} className="text-blue-600" />
          <span className="text-sm font-medium md:inline">Dark Mode</span>
        </>
      )}
    </button>
  )
}
