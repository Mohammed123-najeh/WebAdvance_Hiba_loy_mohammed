"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { signOut } from "@/app/actions/auth"
import type { User } from "@/lib/auth"
import ThemeToggleButton from "./theme-toggle-button"
import { useTheme } from "@/contexts/theme-context"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: User
  activePage: "home" | "projects" | "tasks" | "chat"
}

export default function DashboardLayout({ children, user, activePage }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const handleSignOut = async () => {
    await signOut()
    router.push("/signin")
  }

  const navigateTo = (path: string) => {
    console.log(`Navigating to: ${path}`)
    setSidebarOpen(false)

    // Use a small timeout to ensure state updates before navigation
    setTimeout(() => {
      router.push(path)
    }, 10)
  }

  // Theme-based classes
  const bgMain = isDark ? "bg-[#1a1a1a]" : "bg-gray-100"
  const bgHeader = isDark ? "bg-[#222]" : "bg-white"
  const bgSidebar = isDark ? "bg-[#222]" : "bg-white"
  const bgButton = isDark ? "bg-[#333]" : "bg-gray-200"
  const bgButtonHover = isDark ? "hover:bg-[#444]" : "hover:bg-gray-300"
  const bgActiveButton = isDark ? "bg-blue-500" : "bg-blue-600"
  const textColor = isDark ? "text-white" : "text-gray-900"

  return (
    <div className={`flex h-screen flex-col ${bgMain} ${textColor} transition-colors duration-300`}>
      {/* Top Navigation Bar */}
      <header
        className={`flex h-14 items-center justify-between ${bgHeader} px-2 sm:px-4 shadow-md transition-colors duration-300`}
      >
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-700 md:hidden"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggleButton />
          <span className="text-sm sm:text-xl font-semibold truncate max-w-[120px] sm:max-w-none">
            {user.role === "admin" ? "Admin" : "Student"} {user.username}
          </span>
          <button
            onClick={handleSignOut}
            className="rounded bg-red-500 px-2 py-1 sm:px-4 sm:py-1 text-sm sm:text-base font-medium text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className={`h-full w-64 ${bgSidebar} p-2 transform transition-transform duration-300`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between p-2">
                <span className="text-xl font-semibold">Menu</span>
                <button onClick={() => setSidebarOpen(false)} className={`${textColor} p-1 rounded hover:bg-gray-700`}>
                  <X size={24} />
                </button>
              </div>
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => navigateTo("/dashboard")}
                  className={`flex h-12 items-center rounded px-4 text-left text-lg font-medium ${
                    activePage === "home"
                      ? bgActiveButton + " text-white"
                      : bgButton + " " + textColor + " " + bgButtonHover
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => navigateTo("/projects")}
                  className={`flex h-12 items-center rounded px-4 text-left text-lg font-medium ${
                    activePage === "projects"
                      ? bgActiveButton + " text-white"
                      : bgButton + " " + textColor + " " + bgButtonHover
                  }`}
                >
                  Projects
                </button>
                <button
                  onClick={() => navigateTo("/tasks")}
                  className={`flex h-12 items-center rounded px-4 text-left text-lg font-medium ${
                    activePage === "tasks"
                      ? bgActiveButton + " text-white"
                      : bgButton + " " + textColor + " " + bgButtonHover
                  }`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => navigateTo("/chat")}
                  className={`flex h-12 items-center rounded px-4 text-left text-lg font-medium ${
                    activePage === "chat"
                      ? bgActiveButton + " text-white"
                      : bgButton + " " + textColor + " " + bgButtonHover
                  }`}
                >
                  Chat
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Sidebar - Desktop */}
        <aside className={`hidden w-64 ${bgSidebar} p-2 md:block shadow-md transition-colors duration-300`}>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => navigateTo("/dashboard")}
              className={`flex h-12 items-center rounded px-4 text-left text-lg font-medium ${
                activePage === "home"
                  ? bgActiveButton + " text-white"
                  : bgButton + " " + textColor + " " + bgButtonHover
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigateTo("/projects")}
              className={`flex h-12 items-center rounded px-4 text-left text-lg font-medium ${
                activePage === "projects"
                  ? bgActiveButton + " text-white"
                  : bgButton + " " + textColor + " " + bgButtonHover
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => navigateTo("/tasks")}
              className={`flex h-12 items-center rounded px-4 text-left text-lg font-medium ${
                activePage === "tasks"
                  ? bgActiveButton + " text-white"
                  : bgButton + " " + textColor + " " + bgButtonHover
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => navigateTo("/chat")}
              className={`flex h-12 items-center rounded px-4 text-left text-lg font-medium ${
                activePage === "chat"
                  ? bgActiveButton + " text-white"
                  : bgButton + " " + textColor + " " + bgButtonHover
              }`}
            >
              Chat
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-6 transition-colors duration-300 text-foreground bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
