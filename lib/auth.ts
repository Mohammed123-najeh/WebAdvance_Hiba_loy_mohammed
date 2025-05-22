import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"

export type User = {
  id: number
  username: string
  role: string
  university_id?: string
}

// For server components and API routes
export function createServerClient() {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// For client components
export function createClientClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Get the current session
export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return null
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value)
      return sessionData.user || null
    } catch (error) {
      console.error("Error parsing session cookie:", error)
      return null
    }
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

// Set the session
export async function setSession(user: User): Promise<void> {
  const cookieStore = cookies()
  cookieStore.set("session", JSON.stringify({ user }), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  })
}

// Clear the session
export async function clearSession(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete("session")
}
