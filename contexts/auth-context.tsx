"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { supabase, type Profile } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    username: string,
    isStudent: boolean,
    universityId?: string,
  ) => Promise<{ error: any }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check active sessions and set the user
    const getSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            const { data, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single()

            if (profileError) {
              console.error("Error fetching profile:", profileError)
            } else {
              setProfile(data as Profile)
            }
          } catch (err) {
            console.error("Unexpected error fetching profile:", err)
          }
        }
      } catch (err) {
        console.error("Unexpected error in getSession:", err)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (profileError) {
            console.error("Error fetching profile on auth change:", profileError)
          } else {
            setProfile(data as Profile)
          }
        } catch (err) {
          console.error("Unexpected error fetching profile on auth change:", err)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("Sign in response:", data?.user?.email, error?.message)
      return { error }
    } catch (err) {
      console.error("Unexpected error in signIn:", err)
      return { error: err }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    username: string,
    isStudent: boolean,
    universityId?: string,
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role: isStudent ? "student" : "admin",
            university_id: universityId,
          },
        },
      })

      console.log("Sign up response:", data?.user?.email, error?.message)
      return { error }
    } catch (err) {
      console.error("Unexpected error in signUp:", err)
      return { error: err }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/signin")
    } catch (err) {
      console.error("Error signing out:", err)
    }
  }

  const value = {
    user,
    profile,
    signIn,
    signUp,
    signOut,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
