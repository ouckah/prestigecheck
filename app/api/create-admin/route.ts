import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()

    // Create the user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: "aidan.ouckama@gmail.com",
      password: "prestigehunt214!",
      email_confirm: true,
      user_metadata: { role: "admin" },
    })

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: userData.user,
    })
  } catch (error) {
    console.error("Error creating admin user:", error)
    return NextResponse.json(
      {
        error: "Failed to create admin user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
