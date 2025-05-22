"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import ThemeToggleButton from "./theme-toggle-button"
import type { User } from "@/lib/auth"

interface SidebarProps {
  user: User
  activePage: "home" | "projects" | "tasks" | "chat"
}

export default function ResponsiveSidebar({ user, activePage }: SidebarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
  }

  const navigateTo = (path: string) => {
    router.push(path)
    closeSidebar()
  }

  const isAdmin = user.role === "admin"

  // Theme-based classes
  const bgSidebar = isDark ? "bg-[#222]" : "bg-white"
  const bgButton = isDark ? "bg-[#333]" : "bg-gray-200"
  const bgButtonHover = isDark ? "hover:bg-opacity-80" : "hover:bg-gray-300"
  const bgActiveButton = isDark ? "bg-blue-600" : "bg-blue-500"
  const textColor = isDark ? "text-white" : "text-gray-900"

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-50 block rounded bg-primary p-2 text-white md:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`responsive-sidebar w-64 ${bgSidebar} p-2 md:static md:left-0 ${isOpen ? "open" : ""} shadow-md transition-colors duration-300`}
      >
        <div className="mb-4 flex items-center justify-between p-2 md:hidden">
          <span className={`text-xl font-semibold ${textColor}`}>{isAdmin ? "Admin Panel" : "Student Portal"}</span>
          <button onClick={closeSidebar} className={textColor} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => navigateTo("/dashboard")}
            className={`flex h-12 items-center rounded px-4 text-left text-lg font-medium ${
              activePage === "home" ? bgActiveButton + " text-white" : bgButton + " " + textColor + " " + bgButtonHover
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
              activePage === "tasks" ? bgActiveButton + " text-white" : bgButton + " " + textColor + " " + bgButtonHover
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => navigateTo("/chat")}
            className={`flex h-12 items-center rounded px-4 text-left text-lg font-medium ${
              activePage === "chat" ? bgActiveButton + " text-white" : bgButton + " " + textColor + " " + bgButtonHover
            }`}
          >
            Chat
          </button>
        </nav>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-center">
            <ThemeToggleButton />
          </div>
        </div>
      </aside>
    </>
  )
}
