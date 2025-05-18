"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Get all announcements
export async function getAnnouncements() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("system_announcements")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get a specific announcement by key
export async function getAnnouncementByKey(key: string) {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("system_announcements").select("*").eq("key", key).single()

    if (error && error.code !== "PGRST116") throw error // PGRST116 is "Results contain 0 rows"

    return { success: true, data }
  } catch (error) {
    console.error(`Error fetching announcement with key ${key}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Update an announcement
export async function updateAnnouncement(announcement: {
  id: number
  key: string
  title: string
  short_description: string
  full_description?: string | null
  is_active: boolean
  bg_color: string
}) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from("system_announcements")
      .update({
        ...announcement,
        updated_at: new Date().toISOString(),
      })
      .eq("id", announcement.id)

    if (error) throw error

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error updating announcement:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Create a new announcement
export async function createAnnouncement(announcement: {
  key: string
  title: string
  short_description: string
  full_description?: string | null
  is_active: boolean
  bg_color: string
}) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from("system_announcements").insert(announcement)

    if (error) throw error

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error creating announcement:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Delete an announcement
export async function deleteAnnouncement(id: number) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from("system_announcements").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error deleting announcement:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
