"use client"

import { signOut } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import ThemeToggle from "./theme-toggle"
import type { User } from "@/lib/auth"

interface HeaderProps {
  user: User
}

export default function ResponsiveHeader({ user }: HeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/signin")
  }

  return (
    <header className="flex h-14 items-center justify-between bg-card-background px-4">
      <div className="ml-12 md:ml-0">{/* Space for mobile menu button */}</div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="hidden text-xl font-semibold text-foreground sm:inline">
          {user.role === "admin" ? "Admin" : "Student"} {user.username}
        </span>
        <button
          onClick={handleSignOut}
          className="rounded bg-danger px-4 py-1 font-medium text-white hover:bg-danger-hover"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
