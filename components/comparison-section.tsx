"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { Trophy, BarChart3 } from "lucide-react"
import CompanyStats from "@/components/company-stats"
import { motion, AnimatePresence } from "framer-motion"

// Sample themes for daily comparisons
const themes = [
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

// Get a theme based on the date
const getDailyTheme = () => {
  const today = new Date()
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))
  return themes[dayOfYear % themes.length]
}

// Sample company data
const companies = [
  {
    id: 1,
    name: "Google",
    logo: "/google-logo.png",
    elo: 1850,
    votes: 12500,
    winPercentage: 68,
    marketCap: "1.5T",
    founded: 1998,
  },
  {
    id: 2,
    name: "Apple",
    logo: "/apple-logo.png",
    elo: 1920,
    votes: 15000,
    winPercentage: 75,
    marketCap: "2.8T",
    founded: 1976,
  },
  {
    id: 3,
    name: "Microsoft",
    logo: "/microsoft-logo.png",
    elo: 1780,
    votes: 11000,
    winPercentage: 62,
    marketCap: "2.1T",
    founded: 1975,
  },
  {
    id: 4,
    name: "Amazon",
    logo: "/amazon-logo.png",
    elo: 1750,
    votes: 10500,
    winPercentage: 58,
    marketCap: "1.3T",
    founded: 1994,
  },
  {
    id: 5,
    name: "Meta",
    logo: "/meta-logo-abstract.png",
    elo: 1680,
    votes: 9000,
    winPercentage: 52,
    marketCap: "0.8T",
    founded: 2004,
  },
  {
    id: 6,
    name: "Netflix",
    logo: "/netflix-inspired-logo.png",
    elo: 1620,
    votes: 7500,
    winPercentage: 45,
    marketCap: "0.2T",
    founded: 1997,
  },
  {
    id: 7,
    name: "Tesla",
    logo: "/tesla-logo.png",
    elo: 1700,
    votes: 9500,
    winPercentage: 55,
    marketCap: "0.6T",
    founded: 2003,
  },
  {
    id: 8,
    name: "Nvidia",
    logo: "/placeholder-wio4y.png",
    elo: 1800,
    votes: 8000,
    winPercentage: 65,
    marketCap: "1.1T",
    founded: 1993,
  },
]

export default function ComparisonSection() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [hasVotedToday, setHasVotedToday] = useState(false)
  const [dailyCompanies, setDailyCompanies] = useState<typeof companies>([])
  const [showResults, setShowResults] = useState(false)
  const [dailyTheme, setDailyTheme] = useState("")

  // Get today's date in YYYY-MM-DD format for consistent daily pairs
  const getTodayString = () => {
    const today = new Date()
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  }

  // Generate a pair of companies based on the date
  const getDailyCompanyPair = () => {
    const dateStr = getTodayString()
    // Use the date string to create a deterministic "random" selection
    // This ensures everyone sees the same pair on the same day
    const dateHash = dateStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

    // Use the hash to select two companies
    const firstIndex = dateHash % companies.length
    let secondIndex = (dateHash * 13) % companies.length // Use a different factor to get a different index

    // Make sure we don't select the same company twice
    if (secondIndex === firstIndex) {
      secondIndex = (secondIndex + 1) % companies.length
    }

    return [companies[firstIndex], companies[secondIndex]]
  }

  useEffect(() => {
    // Set today's company pair
    const pair = getDailyCompanyPair()
    setDailyCompanies(pair)
    setDailyTheme(getDailyTheme())

    // Check if user has already voted today
    const lastVoteDate = localStorage.getItem("lastVoteDate")
    const todayString = getTodayString()

    if (lastVoteDate === todayString) {
      const savedSelectedId = Number(localStorage.getItem("selectedCompanyId"))
      setSelectedId(savedSelectedId)
      setHasVotedToday(true)
      setShowResults(true)
    }
  }, [])

  function handleSelection(id: number) {
    if (hasVotedToday) return

    // Save the vote
    setSelectedId(id)
    localStorage.setItem("selectedCompanyId", id.toString())
    localStorage.setItem("lastVoteDate", getTodayString())
    setHasVotedToday(true)

    // Show results with a slight delay for animation
    setTimeout(() => {
      setShowResults(true)
    }, 300)
  }

  // If we don't have the daily companies yet, show loading
  if (dailyCompanies.length !== 2) {
    return <div className="text-center py-12">Loading today's comparison...</div>
  }

  const selectedCompany = dailyCompanies.find((c) => c.id === selectedId)
  const otherCompany = dailyCompanies.find((c) => c.id !== selectedId)

  // Calculate the comparison percentage
  const totalVotes = dailyCompanies[0].votes + dailyCompanies[1].votes
  const firstPercentage = Math.round((dailyCompanies[0].votes / totalVotes) * 100)
  const secondPercentage = 100 - firstPercentage

  return (
    <div className="space-y-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Today's Comparison</h2>
        <div className="inline-block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-medium mb-4">
          Theme: {dailyTheme}
        </div>
        <p className="text-gray-500">
          {hasVotedToday
            ? "You've already voted today. Here are the results."
            : "Which company do you think is more prestigious?"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                  !hasVotedToday ? "hover:scale-105 cursor-pointer" : ""
                } ${showResults && selectedId === company.id ? "ring-2 ring-yellow-400 shadow-lg" : ""}`}
                onClick={() => !hasVotedToday && handleSelection(company.id)}
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
                  <h2 className="text-2xl font-bold">{company.name}</h2>
                  {!hasVotedToday && <Button className="w-full">Select</Button>}

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

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{dailyCompanies[0].name}</span>
                      <span>{firstPercentage}%</span>
                    </div>
                    <Progress value={firstPercentage} className="h-3" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{dailyCompanies[1].name}</span>
                      <span>{secondPercentage}%</span>
                    </div>
                    <Progress value={secondPercentage} className="h-3" />
                  </div>

                  <div className="pt-4 text-sm text-gray-500 text-center">
                    Based on {totalVotes.toLocaleString()} total votes
                  </div>
                </div>

                {selectedCompany && otherCompany && (
                  <div className="grid gap-8 md:grid-cols-2 pt-6 border-t mt-6">
                    <div>
                      <h4 className="text-lg font-medium mb-4">Your Choice</h4>
                      <CompanyStats company={selectedCompany} />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium mb-4">Alternative</h4>
                      <CompanyStats company={otherCompany} />
                    </div>
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
