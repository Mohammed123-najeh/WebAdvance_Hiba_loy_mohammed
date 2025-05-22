import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Try to create a user directly
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    })

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: data.user,
    })
  } catch (err: any) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 })
  }
}
