import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const requestData = await request.json().catch(() => ({}))

    // Get target date (yesterday if not specified)
    let targetDate: string
    if (requestData.date) {
      targetDate = requestData.date
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      targetDate = yesterday.toISOString().split("T")[0]
    }

    // Execute the stored procedure to update ELO ratings
    const { data, error } = await supabase.rpc("process_daily_elo_updates", {
      target_date: targetDate,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ELO updates for ${targetDate}`,
      updates: data,
    })
  } catch (error) {
    console.error("Error updating daily ELO ratings:", error)
    return NextResponse.json(
      {
        error: "Failed to update daily ELO ratings",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
