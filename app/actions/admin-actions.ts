"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Add a new company
export async function addCompany(formData: FormData) {
  try {
    const supabase = createServerClient()

    const name = formData.get("name") as string
    const logo = formData.get("logo") as string
    const elo = Number.parseInt(formData.get("elo") as string) || 1500
    const votes = Number.parseInt(formData.get("votes") as string) || 0
    const win_percentage = Number.parseInt(formData.get("win_percentage") as string) || 50

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name,
        logo,
        elo,
        votes,
        win_percentage,
      })
      .select()

    if (error) throw error

    revalidatePath("/admin")
    return { success: true, data }
  } catch (error) {
    console.error("Error adding company:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Delete a company
export async function deleteCompany(id: number) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.from("companies").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error deleting company:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Update a company
export async function updateCompany(company: {
  id: number
  name: string
  logo: string
  elo: number
  votes: number
  win_percentage: number
}) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from("companies")
      .update({
        name: company.name,
        logo: company.logo,
        elo: company.elo,
        votes: company.votes,
        win_percentage: company.win_percentage,
      })
      .eq("id", company.id)

    if (error) throw error

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error updating company:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Schedule a comparison
export async function scheduleComparison(formData: FormData) {
  try {
    const supabase = createServerClient()

    const date = formData.get("date") as string
    const theme = formData.get("theme") as string
    const companyIds = JSON.parse(formData.get("companyIds") as string) as number[]

    if (!date || !theme || companyIds.length < 2) {
      throw new Error("Missing required fields")
    }

    // Insert the scheduled comparison
    const { data: comparisonData, error: comparisonError } = await supabase
      .from("scheduled_comparisons")
      .insert({
        date,
        theme,
      })
      .select()

    if (comparisonError) throw comparisonError

    const newComparisonId = comparisonData[0].id

    // Insert the company links
    const companyLinks = companyIds.map((companyId) => ({
      comparison_id: newComparisonId,
      company_id: companyId,
    }))

    const { error: linksError } = await supabase.from("comparison_companies").insert(companyLinks)

    if (linksError) throw linksError

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error scheduling comparison:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Delete a scheduled comparison
export async function deleteComparison(id: number) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.from("scheduled_comparisons").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error deleting comparison:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
