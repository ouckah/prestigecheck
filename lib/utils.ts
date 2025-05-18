import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get today's date in YYYY-MM-DD format using UTC
export function getTodayString() {
  const today = new Date()
  const year = today.getUTCFullYear()
  const month = String(today.getUTCMonth() + 1).padStart(2, "0")
  const day = String(today.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Format date for display with user's local timezone
export function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  // Create date with time set to noon to avoid timezone issues
  const date = new Date(dateString + "T12:00:00Z")
  return date.toLocaleDateString(undefined, options)
}

// Generate or retrieve anonymous ID for non-authenticated users
export function getAnonymousId() {
  let anonymousId = localStorage.getItem("anonymousId")

  if (!anonymousId) {
    anonymousId = uuidv4()
    localStorage.setItem("anonymousId", anonymousId)
  }

  return anonymousId
}

// Check if user has voted today (using UTC date)
export function hasVotedToday() {
  const lastVoteDate = localStorage.getItem("lastVoteDate")
  return lastVoteDate === getTodayString()
}

// Save vote information locally (using UTC date)
export function saveVoteLocally(companyId: number) {
  localStorage.setItem("selectedCompanyId", companyId.toString())
  localStorage.setItem("lastVoteDate", getTodayString())
}

// Clear local vote data (used when a new day starts)
export function clearVoteData() {
  localStorage.removeItem("selectedCompanyId")
  localStorage.removeItem("lastVoteDate")
}

// Get time until next comparison (midnight UTC)
export function getTimeUntilNextComparison() {
  const now = new Date()
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0))

  // Time difference in milliseconds
  const diffMs = tomorrow.getTime() - now.getTime()

  // Convert to hours, minutes, seconds
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return { hours, minutes, diffMs }
}
