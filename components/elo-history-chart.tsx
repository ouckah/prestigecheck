"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { AlertCircle } from "lucide-react"

interface EloHistoryProps {
  companyId?: number
  limit?: number
}

export default function EloHistoryChart({ companyId, limit = 30 }: EloHistoryProps) {
  const [eloHistory, setEloHistory] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>(companyId ? [companyId] : [])
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d")
  const [hasEnoughData, setHasEnoughData] = useState(false)

  // Generate colors for companies
  const colors = [
    "#2563eb", // blue
    "#dc2626", // red
    "#16a34a", // green
    "#9333ea", // purple
    "#ea580c", // orange
    "#0891b2", // cyan
    "#4f46e5", // indigo
    "#db2777", // pink
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Fetch all companies first
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("id, name, logo, elo")
        if (companiesError) throw companiesError

        setCompanies(companiesData || [])

        // If no company is selected yet, select the top 5 by ELO
        if (selectedCompanies.length === 0 && !companyId) {
          const topCompanies =
            companiesData
              ?.sort((a, b) => b.elo - a.elo)
              .slice(0, 5)
              .map((c) => c.id) || []

          if (topCompanies.length > 0) {
            setSelectedCompanies(topCompanies)
          }
        }

        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        if (timeRange === "7d") {
          startDate.setDate(endDate.getDate() - 7)
        } else if (timeRange === "30d") {
          startDate.setDate(endDate.getDate() - 30)
        } else {
          startDate.setDate(endDate.getDate() - 365) // Get up to a year of data
        }

        // Check if we have at least one day of data
        // For this simulated data, we'll check if there are votes in the system
        const { count, error: votesError } = await supabase.from("votes").select("*", { count: "exact" })

        if (votesError) throw votesError

        // Consider we have enough data if there are any votes
        // In a real system, you might want to check if there are votes from at least yesterday
        setHasEnoughData(count !== null && count > 0)

        // If we don't have enough data, don't bother generating the chart data
        if (!hasEnoughData && timeRange === "7d") {
          setEloHistory([])
          return
        }

        // Since we don't have an elo_history table, we'll use the current ELO ratings
        // and generate some mock historical data based on the current values
        const historyByDate = {}

        // Initialize dates
        const allDates = []
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split("T")[0]
          allDates.push(dateStr)
          historyByDate[dateStr] = { date: dateStr }
          currentDate.setDate(currentDate.getDate() + 1)
        }

        // Generate simulated ELO history for each company
        companiesData?.forEach((company) => {
          // Only generate data for selected companies
          if (selectedCompanies.includes(company.id)) {
            const currentElo = company.elo

            // Generate historical data with small random variations
            allDates.forEach((dateStr, index) => {
              // The closer to today, the closer to current ELO
              const daysFromStart = index
              const totalDays = allDates.length
              const randomFactor = Math.random() * 20 - 10 // Random value between -10 and 10

              // Calculate a simulated historical ELO
              // Newer dates are closer to current ELO, older dates have more variation
              const historicalElo = Math.round(
                currentElo - (50 * (totalDays - daysFromStart)) / totalDays + randomFactor,
              )

              historyByDate[dateStr][`company_${company.id}`] = historicalElo

              // Add a small daily change
              const prevDate = index > 0 ? allDates[index - 1] : null
              if (prevDate && historyByDate[prevDate][`company_${company.id}`]) {
                const prevElo = historyByDate[prevDate][`company_${company.id}`]
                historyByDate[dateStr][`change_${company.id}`] = historicalElo - prevElo
              } else {
                historyByDate[dateStr][`change_${company.id}`] = 0
              }
            })
          }
        })

        // Convert to array and sort by date
        const chartData = Object.values(historyByDate).sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )

        setEloHistory(chartData)
      } catch (error) {
        console.error("Error fetching ELO history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [companyId, selectedCompanies, timeRange, hasEnoughData])

  const handleCompanyToggle = (id: number) => {
    if (selectedCompanies.includes(id)) {
      setSelectedCompanies(selectedCompanies.filter((cid) => cid !== id))
    } else {
      setSelectedCompanies([...selectedCompanies, id])
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ELO Rating History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={timeRange} className="mb-6" onValueChange={(value) => setTimeRange(value as any)}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {!companyId && (
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Select Companies to Compare:</div>
            <div className="flex flex-wrap gap-2">
              {companies.map((company, index) => (
                <button
                  key={company.id}
                  onClick={() => handleCompanyToggle(company.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCompanies.includes(company.id)
                      ? `bg-${colors[index % colors.length].replace("#", "")}-100 text-${colors[
                          index % colors.length
                        ].replace("#", "")}-800 border border-${colors[index % colors.length].replace("#", "")}-300`
                      : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                  }`}
                  style={
                    selectedCompanies.includes(company.id)
                      ? {
                          backgroundColor: `${colors[index % colors.length]}20`,
                          color: colors[index % colors.length],
                          borderColor: `${colors[index % colors.length]}40`,
                        }
                      : {}
                  }
                >
                  {company.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {!hasEnoughData && timeRange === "7d" ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Not Enough Data</h3>
            <p className="text-gray-500 max-w-md">
              There isn't enough ELO rating history yet. As more votes are collected, historical data will become
              available.
            </p>
          </div>
        ) : eloHistory.length > 0 ? (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={eloHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis domain={["dataMin - 100", "dataMax + 100"]} />
                <Tooltip
                  formatter={(value, name) => {
                    const companyId = name.split("_")[1]
                    const company = companies.find((c) => c.id.toString() === companyId)
                    return [value, company ? company.name : name]
                  }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend
                  formatter={(value) => {
                    const companyId = value.split("_")[1]
                    const company = companies.find((c) => c.id.toString() === companyId)
                    return company ? company.name : value
                  }}
                />
                {selectedCompanies.map((companyId, index) => (
                  <Line
                    key={companyId}
                    type="monotone"
                    dataKey={`company_${companyId}`}
                    stroke={colors[index % colors.length]}
                    activeDot={{ r: 8 }}
                    name={`company_${companyId}`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No ELO history data available for the selected time range.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
