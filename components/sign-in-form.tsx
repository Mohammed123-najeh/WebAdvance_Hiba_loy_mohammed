"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useTheme } from "@/contexts/theme-context"
import { Sun, Moon } from "lucide-react"

export default function SignInForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setError("Username and password are required")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Direct database query instead of using server action
      const { data, error: queryError } = await supabase
        .from("custom_users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single()

      if (queryError || !data) {
        console.error("Sign in error:", queryError)
        setError("Invalid username or password")
        return
      }

      // Update last_seen timestamp
      await supabase.from("custom_users").update({ last_seen: new Date().toISOString() }).eq("id", data.id)

      // Store user data in localStorage for client-side access
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          username: data.username,
          role: data.role,
          university_id: data.university_id,
        }),
      )

      // Set cookie for server-side access
      document.cookie = `session=${JSON.stringify({
        user: {
          id: data.id,
          username: data.username,
          role: data.role,
          university_id: data.university_id,
        },
      })}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Unexpected error during sign in:", err)
      setError(err.message || "An error occurred during sign in")
    } finally {
      setLoading(false)
    }
  }

  // Determine classes based on theme
  const containerBg = isDark ? "bg-black" : "bg-gray-100"
  const formBg = isDark ? "bg-[#1a1a1a]" : "bg-white"
  const textColor = isDark ? "text-white" : "text-gray-900"
  const inputBg = isDark ? "bg-[#333333]" : "bg-gray-100"
  const inputText = isDark ? "text-white" : "text-gray-900"
  const buttonBg = isDark ? "bg-[#333]" : "bg-gray-200"
  const buttonHoverBg = isDark ? "hover:bg-[#444]" : "hover:bg-gray-300"

  return (
    <div className={`flex min-h-screen items-center justify-center ${containerBg} p-4 transition-colors duration-300`}>
      <div className={`w-full max-w-md rounded-lg ${formBg} p-8 relative shadow-lg transition-colors duration-300`}>
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className={`flex h-10 w-10 items-center justify-center rounded-full ${buttonBg} ${buttonHoverBg} transition-colors`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-600" />}
          </button>
        </div>

        <h1 className={`mb-8 text-3xl font-bold ${textColor}`}>Sign In</h1>

        {error && <div className="mb-4 rounded bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}

        <form onSubmit={handleSignIn}>
          <div className="mb-6">
            <label htmlFor="username" className={`mb-2 block text-xl ${textColor}`}>
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full rounded ${inputBg} ${inputText} p-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-300`}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className={`mb-2 block text-xl ${textColor}`}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded ${inputBg} ${inputText} p-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-300`}
              required
            />
          </div>

          <div className="mb-6 flex items-center">
            <input
              id="staySignedIn"
              type="checkbox"
              className={`h-5 w-5 rounded border-gray-600 ${inputBg} text-green-500 focus:ring-0 focus:ring-offset-0`}
            />
            <label htmlFor="staySignedIn" className={`ml-2 text-xl ${textColor}`}>
              Stay Signed In
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-green-500 p-4 text-center text-white hover:bg-green-600 focus:outline-none disabled:opacity-70"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className={`mt-6 text-center ${textColor}`}>
          Don't have an account?{" "}
          <Link href="/signup" className="text-green-500 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
