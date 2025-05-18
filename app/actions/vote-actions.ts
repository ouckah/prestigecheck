"use server"

import { createServerClient } from "@/lib/supabase"

// Function to calculate ELO change
function calculateEloChange(winnerElo: number, loserElo: number): number {
  const kFactor = 32 // Standard K-factor used in ELO calculations
  const expectedWin = 1.0 / (1.0 + Math.pow(10, (loserElo - winnerElo) / 400.0))
  return Math.round(kFactor * (1 - expectedWin))
}

export async function submitVote(formData: FormData) {
  try {
    const supabase = createServerClient()

    const companyId = Number(formData.get("companyId"))
    const userId = formData.get("userId") as string | null
    const anonymousId = formData.get("anonymousId") as string | null
    const comparisonDate = formData.get("comparisonDate") as string
    const companyIdsString = formData.get("companyIds") as string
    const companyIds = JSON.parse(companyIdsString) as number[]

    if (!companyId || !comparisonDate || (!userId && !anonymousId) || !companyIds.length) {
      throw new Error("Missing required fields")
    }

    console.log("Vote submission - Before getting ELO ratings")

    // Get the ELO ratings before the vote
    const { data: beforeCompanies, error: beforeError } = await supabase
      .from("companies")
      .select("id, name, elo, votes, win_percentage")
      .in("id", companyIds)

    if (beforeError) {
      console.error("Error fetching before ELO ratings:", beforeError)
      throw beforeError
    }

    console.log("Before ELO ratings:", beforeCompanies)

    // Create a map of company ID to ELO rating before the vote
    const beforeEloMap = {}
    beforeCompanies?.forEach((company) => {
      beforeEloMap[company.id] = company.elo
    })

    // Create the vote data object
    const voteData = userId
      ? { company_id: companyId, user_id: userId, comparison_date: comparisonDate }
      : { company_id: companyId, anonymous_id: anonymousId, comparison_date: comparisonDate }

    console.log("Inserting vote:", voteData)

    // Insert the vote
    const { error } = await supabase.from("votes").insert(voteData)

    if (error) {
      console.error("Error inserting vote:", error)
      throw error
    }

    console.log("Vote inserted successfully, updating ELO ratings")

    // Get the winner company
    const winnerCompany = beforeCompanies?.find((c) => c.id === companyId)
    if (!winnerCompany) {
      throw new Error("Winner company not found")
    }

    // Calculate total ELO gain for the winner
    let totalEloGain = 0

    // Update ELO ratings for all companies in the comparison
    for (const company of beforeCompanies || []) {
      if (company.id === companyId) {
        // This is the winner - we'll update it after calculating the total ELO gain
        continue
      } else {
        // This is a loser
        const eloChange = calculateEloChange(winnerCompany.elo, company.elo)
        totalEloGain += eloChange

        // Update the loser's ELO - don't increment their vote count
        await supabase
          .from("companies")
          .update({
            elo: company.elo - eloChange,
            // No change to votes count for losers
            win_percentage: Math.round((company.win_percentage * company.votes) / company.votes),
          })
          .eq("id", company.id)
      }
    }

    // Now update the winner with the total ELO gain and increment their vote count
    await supabase
      .from("companies")
      .update({
        elo: winnerCompany.elo + totalEloGain,
        votes: winnerCompany.votes + 1, // Only increment the winner's vote count
        win_percentage: Math.round(
          (winnerCompany.win_percentage * winnerCompany.votes + 100) / (winnerCompany.votes + 1),
        ),
      })
      .eq("id", companyId)

    console.log("ELO ratings updated, getting new ratings")

    // Get the updated ELO ratings and vote counts after the vote
    const { data: afterCompanies, error: afterError } = await supabase
      .from("companies")
      .select("id, name, elo, votes")
      .in("id", companyIds)

    if (afterError) {
      console.error("Error fetching after ELO ratings:", afterError)
      throw afterError
    }

    console.log("After ELO ratings:", afterCompanies)

    // Calculate the ELO changes
    const eloChanges =
      afterCompanies?.map((company) => ({
        id: company.id,
        name: company.name,
        before: beforeEloMap[company.id],
        after: company.elo,
        change: company.elo - beforeEloMap[company.id],
        votes: company.votes,
      })) || []

    console.log("Calculated ELO changes:", eloChanges)

    return {
      success: true,
      eloChanges,
    }
  } catch (error) {
    console.error("Error submitting vote:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
