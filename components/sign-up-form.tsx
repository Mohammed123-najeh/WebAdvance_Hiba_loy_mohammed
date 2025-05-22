"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { signUp } from "@/app/actions/auth"
import { useTheme } from "@/contexts/theme-context"
import { Sun, Moon } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-green-500 p-4 text-center text-white hover:bg-green-600 focus:outline-none disabled:opacity-70"
    >
      {pending ? "Signing Up..." : "Sign Up"}
    </button>
  )
}

export default function SignUpForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(signUp, { error: null })
  const [isStudent, setIsStudent] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  // Handle redirect after successful sign-up
  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard")
    }
  }, [state, router])

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

        <h1 className={`mb-8 text-3xl font-bold ${textColor}`}>Sign Up</h1>

        {state?.error && <div className="mb-4 rounded bg-red-500/10 p-3 text-sm text-red-500">{state.error}</div>}

        <form action={formAction}>
          <div className="mb-6">
            <label htmlFor="username" className={`mb-2 block text-xl ${textColor}`}>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
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
              name="password"
              type="password"
              className={`w-full rounded ${inputBg} ${inputText} p-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-300`}
              required
            />
          </div>

          <div className="mb-6 flex items-center">
            <input
              id="isStudent"
              name="isStudent"
              type="checkbox"
              checked={isStudent}
              onChange={(e) => setIsStudent(e.target.checked)}
              className={`h-5 w-5 rounded border-gray-600 ${inputBg} text-green-500 focus:ring-0 focus:ring-offset-0`}
            />
            <label htmlFor="isStudent" className={`ml-2 text-xl ${textColor}`}>
              I am a student
            </label>
          </div>

          {isStudent && (
            <div className="mb-6">
              <label htmlFor="universityId" className={`mb-2 block text-xl ${textColor}`}>
                University ID
              </label>
              <input
                id="universityId"
                name="universityId"
                type="text"
                className={`w-full rounded ${inputBg} ${inputText} p-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-300`}
                required={isStudent}
              />
            </div>
          )}

          <SubmitButton />
        </form>

        <div className={`mt-6 text-center ${textColor}`}>
          Already have an account?{" "}
          <Link href="/signin" className="text-green-500 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
