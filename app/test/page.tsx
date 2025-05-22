"use client"

import type React from "react"

import { useState } from "react"

export default function TestPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/auth/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setResult({ error: err.message || "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-lg bg-[#1a1a1a] p-8">
        <h1 className="mb-8 text-3xl font-bold text-white">Test User Creation</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="mb-2 block text-xl text-white">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded bg-[#333333] p-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              placeholder="user@example.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="mb-2 block text-xl text-white">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded bg-[#333333] p-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-green-500 p-4 text-center text-white hover:bg-green-600 focus:outline-none disabled:opacity-70"
          >
            {loading ? "Creating User..." : "Create User"}
          </button>
        </form>

        {result && (
          <div className="mt-6 rounded bg-gray-800 p-4">
            <h2 className="mb-2 text-xl font-bold text-white">Result:</h2>
            <pre className="overflow-auto text-sm text-white">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
