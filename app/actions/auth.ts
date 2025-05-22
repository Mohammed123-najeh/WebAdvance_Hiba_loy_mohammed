"use server"
import { createServerClient, setSession, clearSession, type User } from "@/lib/auth"

export async function signIn(prevState: any, formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (!username || !password) {
    return { error: "Username and password are required" }
  }

  try {
    const supabase = createServerClient()

    // Query the custom_users table without using .single()
    const { data, error } = await supabase
      .from("custom_users")
      .select("*")
      .eq("username", username)
      .eq("password", password)

    // Check if there was an error with the query
    if (error) {
      console.error("Database query error:", error)
      return { error: "Database error occurred" }
    }

    // Check if any user was found
    if (!data || data.length === 0) {
      return { error: "Invalid username or password" }
    }

    // Use the first matching user (should be only one)
    const userData = data[0]

    // Update last_seen timestamp
    const { error: updateError } = await supabase
      .from("custom_users")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", userData.id)

    if (updateError) {
      console.error("Error updating last_seen:", updateError)
      // Don't throw an error, just log it
    }

    // Create session
    const user: User = {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      university_id: userData.university_id,
    }

    await setSession(user)

    // Return success instead of redirecting
    return { success: true, role: user.role }
  } catch (error: any) {
    console.error("Sign in error:", error)
    return { error: error.message || "An error occurred during sign in" }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const isStudent = formData.get("isStudent") === "on"
  const universityId = formData.get("universityId") as string | undefined

  if (!username || !password) {
    return { error: "Username and password are required" }
  }

  if (isStudent && !universityId) {
    return { error: "University ID is required for students" }
  }

  try {
    const supabase = createServerClient()

    // Check if username already exists without using .single()
    const { data: existingUsers, error: checkError } = await supabase
      .from("custom_users")
      .select("id")
      .eq("username", username)

    if (checkError) {
      console.error("Error checking existing user:", checkError)
      return { error: "Database error occurred" }
    }

    if (existingUsers && existingUsers.length > 0) {
      return { error: "Username already exists" }
    }

    // Insert new user
    const { data, error } = await supabase
      .from("custom_users")
      .insert({
        username,
        password,
        role: isStudent ? "student" : "admin",
        university_id: isStudent ? universityId : null,
      })
      .select()

    if (error) {
      console.error("User creation error:", error)
      return { error: error.message || "Failed to create user" }
    }

    if (!data || data.length === 0) {
      return { error: "Failed to create user" }
    }

    // Create session
    const user: User = {
      id: data[0].id,
      username: data[0].username,
      role: data[0].role,
      university_id: data[0].university_id,
    }

    await setSession(user)

    // Return success instead of redirecting
    return { success: true, role: user.role }
  } catch (error: any) {
    console.error("Sign up error:", error)
    return { error: error.message || "An error occurred during sign up" }
  }
}

export async function signOut() {
  await clearSession()
  return { success: true }
}
