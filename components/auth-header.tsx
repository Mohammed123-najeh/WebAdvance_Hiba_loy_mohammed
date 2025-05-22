"use client"

import { ThemeToggle } from "@/contexts/theme-context"

export default function AuthHeader() {
  return (
    <header className="fixed top-0 right-0 p-4 z-10">
      <ThemeToggle />
    </header>
  )
}
