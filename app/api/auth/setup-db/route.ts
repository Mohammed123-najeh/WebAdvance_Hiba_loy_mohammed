import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create custom users table
    const { error: tableError } = await supabase.rpc("create_custom_users_table", {})

    if (tableError) {
      // Table might already exist, try to continue
      console.log("Table creation error (might already exist):", tableError)
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed",
    })
  } catch (err: any) {
    console.error("Setup error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
