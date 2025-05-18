import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()

    // Get all companies
    const { data: companies, error: companiesError } = await supabase.from("companies").select("id, name, votes")

    if (companiesError) {
      throw companiesError
    }

    // Get actual vote counts from the votes table
    const { data: voteData, error: voteError } = await supabase
      .from("votes")
      .select("company_id, count")
      .select("company_id, count(*)")
      .group("company_id")

    if (voteError) {
      throw voteError
    }

    // Create a map of company ID to actual vote count
    const actualVoteCounts = {}
    voteData.forEach((item) => {
      actualVoteCounts[item.company_id] = Number.parseInt(item.count)
    })

    // Compare current vote counts with actual vote counts
    const discrepancies = []
    for (const company of companies) {
      const actualCount = actualVoteCounts[company.id] || 0
      if (company.votes !== actualCount) {
        discrepancies.push({
          id: company.id,
          name: company.name,
          currentVotes: company.votes,
          actualVotes: actualCount,
          difference: company.votes - actualCount,
        })
      }
    }

    return NextResponse.json({
      success: true,
      companies,
      actualVoteCounts,
      discrepancies,
    })
  } catch (error) {
    console.error("Error checking vote counts:", error)
    return NextResponse.json(
      {
        error: "Failed to check vote counts",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { fix } = await request.json()

    if (fix !== true) {
      return NextResponse.json({ success: false, message: "No action taken" })
    }

    // Get actual vote counts from the votes table
    const { data: voteData, error: voteError } = await supabase
      .from("votes")
      .select("company_id, count(*)")
      .group("company_id")

    if (voteError) {
      throw voteError
    }

    // Update each company with the correct vote count
    const updates = []
    for (const item of voteData) {
      const { error: updateError } = await supabase
        .from("companies")
        .update({ votes: Number.parseInt(item.count) })
        .eq("id", item.company_id)

      if (updateError) {
        throw updateError
      }

      updates.push({
        company_id: item.company_id,
        votes: Number.parseInt(item.count),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Vote counts fixed successfully",
      updates,
    })
  } catch (error) {
    console.error("Error fixing vote counts:", error)
    return NextResponse.json(
      {
        error: "Failed to fix vote counts",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
