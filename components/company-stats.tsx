import Image from "next/image"
import { Trophy, TrendingUp, TrendingDown, Users } from "lucide-react"

interface CompanyStatsProps {
  company: {
    id: number
    name: string
    logo: string
    elo: number
    votes: number
    win_percentage: number
  }
  eloChange?: number
}

export default function CompanyStats({ company, eloChange }: CompanyStatsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <Image
            src={company.logo || "/placeholder.svg"}
            alt={`${company.name} logo`}
            fill
            className="object-contain"
          />
        </div>
        <div>
          <h3 className="text-xl font-bold">{company.name}</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">Ranked #{getCompanyRank(company.elo)} by ELO</p>
            {eloChange !== undefined && eloChange !== 0 && (
              <span
                className={`flex items-center gap-1 text-sm font-medium ${
                  eloChange > 0 ? "text-green-600" : eloChange < 0 ? "text-red-600" : "text-gray-500"
                }`}
              >
                {eloChange > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : eloChange < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {eloChange > 0 ? "+" : ""}
                {eloChange} ELO
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">ELO Rating</p>
            <div className="flex items-center gap-2">
              <p className="font-medium">{company.elo}</p>
              {eloChange !== undefined && eloChange !== 0 && (
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    eloChange > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {eloChange > 0 ? "+" : ""}
                  {eloChange}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Win Rate</p>
            <p className="font-medium">{company.win_percentage}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">Total Votes</p>
            <p className="font-medium">{company.votes.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get company rank based on ELO
function getCompanyRank(elo: number): number {
  if (elo >= 1900) return 1
  if (elo >= 1800) return 2
  if (elo >= 1700) return 3
  if (elo >= 1600) return 4
  return 5
}
