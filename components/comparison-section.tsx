"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { Trophy, BarChart3, TrendingUp, TrendingDown, Users, Clock } from "lucide-react"
import CompanyStats from "@/components/company-stats"
import { motion, AnimatePresence } from "framer-motion"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import {
  getTodayString,
  getAnonymousId,
  hasVotedToday,
  saveVoteLocally,
  clearVoteData,
  getTimeUntilNextComparison,
} from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { submitVote } from "@/app/actions/vote-actions"
import { Skeleton } from "@/components/ui/skeleton"

// Format the current UTC time
function getCurrentUtcTime() {
  const now = new Date()
  const hours = String(now.getUTCHours()).padStart(2, "0")
  const minutes = String(now.getUTCMinutes()).padStart(2, "0")
  return `${hours}:${minutes} UTC`
}

// Sample themes for daily comparisons (fallback if none in database)
const DEFAULT_THEMES = [
  "Innovation Leaders",
  "User Experience Champions",
  "Market Disruptors",
  "Tech Giants",
  "Cloud Computing Leaders",
  "AI Pioneers",
  "Hardware Innovators",
  "Software Powerhouses",
  "Consumer Tech Favorites",
  "Enterprise Solutions",
  "Social Media Titans",
  "E-commerce Leaders",
]

// Get a theme based on the date (fallback)
const getDefaultTheme = () => {
  const today = new Date()
  const dayOfYear = Math.floor((today - new Date(Date.UTC(today.getUTCFullYear(), 0, 0))) / (1000 * 60 * 60 * 24))
  return DEFAULT_THEMES[dayOfYear % DEFAULT_THEMES.length]
}

interface EloChange {
  id: number
  name: string
  before: number
  after: number
  change: number
  votes?: number
}

interface CompanyVote {
  id: number
  percentage: number
  votes: number
}

export default function ComparisonSection() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [dailyCompanies, setDailyCompanies] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [dailyTheme, setDailyTheme] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [eloChanges, setEloChanges] = useState<EloChange[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [votePercentages, setVotePercentages] = useState<CompanyVote[]>([])
  const [isLoadingVotes, setIsLoadingVotes] = useState(false)
  const [nextComparisonTime, setNextComparisonTime] = useState<{ hours: number; minutes: number } | null>(null)
  const [currentUtcTime, setCurrentUtcTime] = useState(getCurrentUtcTime())

  // Update the UTC time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUtcTime(getCurrentUtcTime())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Update the time until next comparison
  useEffect(() => {
    if (hasVoted) {
      const updateNextComparisonTime = () => {
        const timeUntil = getTimeUntilNextComparison()
        setNextComparisonTime({ hours: timeUntil.hours, minutes: timeUntil.minutes })
      }

      // Update immediately
      updateNextComparisonTime()

      // Then update every minute
      const interval = setInterval(updateNextComparisonTime, 60000)

      return () => clearInterval(interval)
    }
  }, [hasVoted])

  // Generate a pair of companies based on the date (fallback)
  const getRandomCompanyPair = (companyList: any[]) => {
    if (companyList.length < 2) return []

    const dateStr = getTodayString()
    // Use the date string to create a deterministic "random" selection
    const dateHash = dateStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

    // Use the hash to select two companies
    const firstIndex = dateHash % companyList.length
    let secondIndex = (dateHash * 13) % companyList.length

    // Make sure we don't select the same company twice
    if (secondIndex === firstIndex) {
      secondIndex = (secondIndex + 1) % companyList.length
    }

    return [companyList[firstIndex], companyList[secondIndex]]
  }

  // Fetch the latest vote counts for the companies
  const fetchLatestVoteCounts = async () => {
    if (dailyCompanies.length === 0) return

    try {
      setIsLoadingVotes(true)
      const supabase = getSupabaseBrowserClient()
      const companyIds = dailyCompanies.map((c) => c.id)
      const todayString = getTodayString()

      console.log("Fetching vote counts for companies:", companyIds, "on date:", todayString)

      // Get all votes for today's comparison
      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select("company_id")
        .eq("comparison_date", todayString)
        .in("company_id", companyIds)

      if (votesError) {
        console.error("Error fetching votes:", votesError)
        throw votesError
      }

      console.log("Votes data received:", votesData)

      // Count votes for each company
      const voteCounts = new Map<number, number>()
      companyIds.forEach((id) => voteCounts.set(id, 0)) // Initialize all with 0

      if (votesData && votesData.length > 0) {
        votesData.forEach((vote) => {
          const currentCount = voteCounts.get(vote.company_id) || 0
          voteCounts.set(vote.company_id, currentCount + 1)
        })
      }

      // Calculate total votes
      const totalVotes = Array.from(voteCounts.values()).reduce((sum, count) => sum + count, 0)

      // Calculate percentages
      const newPercentages: CompanyVote[] = companyIds.map((id) => {
        const votes = voteCounts.get(id) || 0
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
        return { id, votes, percentage }
      })

      console.log("Calculated vote percentages:", newPercentages)
      setVotePercentages(newPercentages)
    } catch (error) {
      console.error("Error fetching latest vote counts:", error)
      toast({
        title: "Error fetching votes",
        description: "Could not load the latest vote counts. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingVotes(false)
    }
  }

  // Get the percentage for a company
  const getPercentage = (companyId: number): number => {
    const result = votePercentages.find((item) => item.id === companyId)
    return result ? result.percentage : 0
  }

  // Get the votes for a company
  const getVotes = (companyId: number): number => {
    const result = votePercentages.find((item) => item.id === companyId)
    return result ? result.votes : 0
  }

  // Check if the stored vote date is from a previous day
  const checkForNewDay = () => {
    const lastVoteDate = localStorage.getItem("lastVoteDate")
    const todayString = getTodayString()

    console.log("Checking for new day - Last vote date:", lastVoteDate, "Today (UTC):", todayString)

    // If there's a last vote date and it's not today, clear the vote data
    if (lastVoteDate && lastVoteDate !== todayString) {
      console.log("New day detected (UTC), clearing previous vote data")
      clearVoteData()
      return true
    }
    return false
  }

  // Load companies and vote data
  useEffect(() => {
    const fetchTodaysComparison = async () => {
      try {
        setIsLoading(true)

        // Check if it's a new day and clear previous vote data if needed
        const isNewDay = checkForNewDay()

        const supabase = getSupabaseBrowserClient()
        const todayString = getTodayString()

        console.log("Fetching comparison for UTC date:", todayString)

        // Check if there's a scheduled comparison for today
        const { data: scheduledComparison, error: comparisonError } = await supabase
          .from("scheduled_comparisons")
          .select("id, theme")
          .eq("date", todayString)
          .single()

        if (comparisonError && comparisonError.code !== "PGRST116") {
          // PGRST116 is "Results contain 0 rows" - this is expected if no comparison is scheduled
          console.error("Error fetching scheduled comparison:", comparisonError)
        }

        let companiesData = []

        if (scheduledComparison) {
          console.log("Found scheduled comparison for UTC date:", scheduledComparison)
          // Get companies for this comparison
          const { data: comparisonCompanies, error: companiesError } = await supabase
            .from("comparison_companies")
            .select("company_id")
            .eq("comparison_id", scheduledComparison.id)

          if (companiesError) {
            console.error("Error fetching comparison companies:", companiesError)
            throw companiesError
          }

          if (comparisonCompanies && comparisonCompanies.length >= 2) {
            const companyIds = comparisonCompanies.map((cc) => cc.company_id)

            // Get company details
            const { data: companies, error: detailsError } = await supabase
              .from("companies")
              .select("*")
              .in("id", companyIds)

            if (detailsError) {
              console.error("Error fetching company details:", detailsError)
              throw detailsError
            }

            if (companies && companies.length >= 2) {
              companiesData = companies
              setDailyTheme(scheduledComparison.theme)
              console.log("Loaded scheduled companies:", companies.length)
            } else {
              console.warn("Not enough companies found for scheduled comparison")
              throw new Error("Could not load companies for today's comparison")
            }
          } else {
            console.warn("Not enough company IDs in scheduled comparison")
            throw new Error("Not enough companies in today's comparison")
          }
        } else {
          console.log("No scheduled comparison found for UTC date, using random pair")
          // No scheduled comparison, get all companies and select a random pair
          const { data: allCompanies, error: allCompaniesError } = await supabase.from("companies").select("*")

          if (allCompaniesError) {
            console.error("Error fetching all companies:", allCompaniesError)
            throw allCompaniesError
          }

          if (allCompanies && allCompanies.length >= 2) {
            companiesData = getRandomCompanyPair(allCompanies)
            setDailyTheme(getDefaultTheme())
            console.log("Generated random company pair based on UTC date")
          } else {
            console.warn("Not enough companies available for random selection")
            throw new Error("Not enough companies available")
          }
        }

        // Set companies data
        setDailyCompanies(companiesData)

        // Check if user has already voted today (using UTC date)
        if (hasVotedToday()) {
          console.log("User has already voted today (UTC)")
          const savedSelectedId = Number(localStorage.getItem("selectedCompanyId"))
          setSelectedId(savedSelectedId)
          setHasVoted(true)
          setShowResults(true)

          // Set the time until next comparison
          const timeUntil = getTimeUntilNextComparison()
          setNextComparisonTime({ hours: timeUntil.hours, minutes: timeUntil.minutes })
        } else {
          console.log("User has not voted today (UTC)")
          // Reset states for a new day
          setSelectedId(null)
          setHasVoted(false)
          setShowResults(false)
          setEloChanges([])
          setNextComparisonTime(null)
        }

        // Now fetch vote counts
        if (companiesData.length > 0) {
          try {
            setIsLoadingVotes(true)
            const companyIds = companiesData.map((c) => c.id)

            // Get all votes for today's comparison
            const { data: votesData, error: votesError } = await supabase
              .from("votes")
              .select("company_id")
              .eq("comparison_date", todayString)
              .in("company_id", companyIds)

            if (votesError) {
              console.error("Error fetching votes:", votesError)
              throw votesError
            }

            console.log("Votes data received:", votesData?.length || 0, "votes")

            // Count votes for each company
            const voteCounts = new Map<number, number>()
            companyIds.forEach((id) => voteCounts.set(id, 0)) // Initialize all with 0

            if (votesData && votesData.length > 0) {
              votesData.forEach((vote) => {
                const currentCount = voteCounts.get(vote.company_id) || 0
                voteCounts.set(vote.company_id, currentCount + 1)
              })
            }

            // Calculate total votes
            const totalVotes = Array.from(voteCounts.values()).reduce((sum, count) => sum + count, 0)

            // Calculate percentages
            const newPercentages: CompanyVote[] = companyIds.map((id) => {
              const votes = voteCounts.get(id) || 0
              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
              return { id, votes, percentage }
            })

            console.log("Calculated vote percentages:", newPercentages)
            setVotePercentages(newPercentages)
          } catch (error) {
            console.error("Error fetching vote counts:", error)
          } finally {
            setIsLoadingVotes(false)
          }
        }
      } catch (error) {
        console.error("Error fetching today's comparison:", error)
        toast({
          title: "Error loading comparison",
          description: "Could not load today's comparison. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTodaysComparison()
  }, [toast])

  const handleSelection = async (id: number) => {
    if (hasVoted || isSubmitting) return

    try {
      setIsSubmitting(true)

      // Save the vote locally first (using UTC date)
      setSelectedId(id)
      saveVoteLocally(id)
      setHasVoted(true)

      // Show results with a slight delay for animation
      setTimeout(() => {
        setShowResults(true)
      }, 300)

      // Create a FormData object to pass to the server action
      const formData = new FormData()
      formData.append("companyId", id.toString())
      formData.append("comparisonDate", getTodayString())
      formData.append("companyIds", JSON.stringify(dailyCompanies.map((c) => c.id)))

      // Use user ID if authenticated, otherwise use anonymous ID
      if (user) {
        formData.append("userId", user.id)
      } else {
        formData.append("anonymousId", getAnonymousId())
      }

      // Submit the vote using the server action
      const result = await submitVote(formData)

      if (!result.success) {
        throw new Error(result.error)
      }

      // Fetch the latest vote counts from the database
      await fetchLatestVoteCounts()

      // Store the ELO changes
      if (result.eloChanges && result.eloChanges.length > 0) {
        setEloChanges(result.eloChanges)

        // Show a toast with the ELO changes
        const selectedChange = result.eloChanges.find((c) => c.id === id)
        if (selectedChange && selectedChange.change !== 0) {
          toast({
            title: "ELO Updated",
            description: `${selectedChange.name} ${selectedChange.change > 0 ? "gained" : "lost"} ${Math.abs(
              selectedChange.change,
            )} ELO points!`,
          })
        }

        // Update the companies with their new ELO ratings
        setDailyCompanies((prevCompanies) => {
          return prevCompanies.map((company) => {
            const change = result.eloChanges.find((c) => c.id === company.id)
            if (change) {
              return {
                ...company,
                elo: change.after,
                votes: change.votes || company.votes,
              }
            }
            return company
          })
        })
      }

      // Set the time until next comparison
      const timeUntil = getTimeUntilNextComparison()
      setNextComparisonTime({ hours: timeUntil.hours, minutes: timeUntil.minutes })
    } catch (error) {
      console.error("Error handling selection:", error)
      toast({
        title: "Error saving vote",
        description: "Your vote was recorded locally but could not be saved to the server.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // If still loading, show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  // If we don't have the daily companies yet, show error
  if (dailyCompanies.length < 2) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No comparison available for today. Please check back later.</p>
      </div>
    )
  }

  const selectedCompany = dailyCompanies.find((c) => c.id === selectedId)
  const otherCompanies = dailyCompanies.filter((c) => c.id !== selectedId)

  // Get the ELO change for a company
  const getEloChange = (companyId: number): number => {
    const change = eloChanges.find((c) => c.id === companyId)
    return change ? change.change : 0
  }

  return (
    <div className="space-y-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Today's Comparison</h2>
        <div className="inline-block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-medium mb-4">
          Theme: {dailyTheme}
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-2">
          <Clock className="h-3 w-3" />
          <span>Current time: {currentUtcTime}</span>
        </div>
        <p className="text-gray-500">
          {hasVoted
            ? "You've already voted today. Here are the results."
            : `Which company do you think is more prestigious? (${dailyCompanies.length} options)`}
        </p>

        {hasVoted && nextComparisonTime && (
          <div className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              Next comparison in {nextComparisonTime.hours}h {nextComparisonTime.minutes}m (at midnight UTC)
            </span>
          </div>
        )}
      </div>

      <div
        className={`grid grid-cols-1 ${dailyCompanies.length > 3 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-8 max-w-6xl mx-auto`}
      >
        {dailyCompanies.map((company) => (
          <AnimatePresence key={company.id}>
            <motion.div
              initial={{ opacity: 1 }}
              animate={{
                opacity: showResults && selectedId !== company.id ? 0.7 : 1,
                scale: showResults && selectedId === company.id ? 1.05 : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              <Card
                className={`overflow-hidden transition-all hover:shadow-lg ${
                  !hasVoted ? "hover:scale-105 cursor-pointer" : ""
                } ${showResults && selectedId === company.id ? "ring-2 ring-yellow-400 shadow-lg" : ""}`}
                onClick={() => !hasVoted && !isSubmitting && handleSelection(company.id)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-32 h-32">
                    <Image
                      src={company.logo || "/placeholder.svg"}
                      alt={`${company.name} logo`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">{company.name}</h2>
                    {showResults && eloChanges.length > 0 && (
                      <div
                        className={`flex items-center justify-center gap-1 font-medium mt-1 ${
                          getEloChange(company.id) > 0
                            ? "text-green-600"
                            : getEloChange(company.id) < 0
                              ? "text-red-600"
                              : "text-gray-500"
                        }`}
                      >
                        {getEloChange(company.id) > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : getEloChange(company.id) < 0 ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : null}
                        <span>
                          {getEloChange(company.id) > 0 ? "+" : ""}
                          {getEloChange(company.id)} ELO
                        </span>
                      </div>
                    )}
                  </div>
                  {!hasVoted && (
                    <Button className="w-full" disabled={isSubmitting}>
                      {isSubmitting && selectedId === company.id ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          Selecting...
                        </span>
                      ) : (
                        "Select"
                      )}
                    </Button>
                  )}

                  {showResults && selectedId === company.id && (
                    <div className="flex items-center gap-2 text-yellow-600 font-medium mt-2">
                      <Trophy className="h-4 w-4" />
                      <span>Your Choice</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        ))}
      </div>

      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
        >
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6 space-y-8">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5" />
                  <h3 className="text-xl font-bold">Results</h3>
                </div>

                {isSubmitting || isLoadingVotes ? (
                  <div className="space-y-6">
                    <div className="text-center py-4 text-gray-500 flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                      <p>Fetching results...</p>
                    </div>

                    {/* Skeleton loading state for results */}
                    {dailyCompanies.map((company) => (
                      <div key={company.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}

                    <div className="pt-6 border-t mt-6">
                      <Skeleton className="h-6 w-40 mb-4" />
                      <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-6 w-40" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 pt-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {dailyCompanies.map((company) => (
                      <div key={company.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span>{company.name}</span>
                            {eloChanges.length > 0 && (
                              <span
                                className={`flex items-center gap-1 ${
                                  getEloChange(company.id) > 0
                                    ? "text-green-600"
                                    : getEloChange(company.id) < 0
                                      ? "text-red-600"
                                      : "text-gray-500"
                                }`}
                              >
                                {getEloChange(company.id) > 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : getEloChange(company.id) < 0 ? (
                                  <TrendingDown className="h-3 w-3" />
                                ) : null}
                                {getEloChange(company.id) > 0 ? "+" : ""}
                                {getEloChange(company.id)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-gray-500">
                              <Users className="h-3 w-3" />
                              {getVotes(company.id)} votes
                            </span>
                            <span>{getPercentage(company.id)}%</span>
                          </div>
                        </div>
                        <Progress value={getPercentage(company.id)} className="h-3" />
                      </div>
                    ))}

                    <div className="pt-4 text-sm text-gray-500 text-center">Based on historical data and your vote</div>
                  </div>
                )}

                {selectedCompany && !isSubmitting && !isLoadingVotes && (
                  <div className="pt-6 border-t mt-6">
                    <h4 className="text-lg font-medium mb-4">Your Choice</h4>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <CompanyStats
                        company={{
                          ...selectedCompany,
                          votes: getVotes(selectedCompany.id),
                        }}
                        eloChange={eloChanges.length > 0 ? getEloChange(selectedCompany.id) : undefined}
                      />
                      {eloChanges.length > 0 && (
                        <div className="mt-4 text-center">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                              getEloChange(selectedCompany.id) > 0
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {getEloChange(selectedCompany.id) > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span>
                              Your vote changed this company's ELO by{" "}
                              <strong>
                                {getEloChange(selectedCompany.id) > 0 ? "+" : ""}
                                {getEloChange(selectedCompany.id)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {otherCompanies.length > 0 && (
                      <div className="mt-8">
                        <h4 className="text-lg font-medium mb-4">Other Options</h4>
                        <div className="grid gap-6 md:grid-cols-2">
                          {otherCompanies.map((company) => (
                            <div key={company.id} className="border p-4 rounded-lg">
                              <CompanyStats
                                company={{
                                  ...company,
                                  votes: getVotes(company.id),
                                }}
                                eloChange={eloChanges.length > 0 ? getEloChange(company.id) : undefined}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  )
}
