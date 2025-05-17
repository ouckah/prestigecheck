import Image from "next/image"
import { Trophy, TrendingUp } from "lucide-react"

interface CompanyStatsProps {
  company: {
    id: number
    name: string
    logo: string
    elo: number
    votes: number
    winPercentage: number
    marketCap: string
    founded: number
  }
}

export default function CompanyStats({ company }: CompanyStatsProps) {
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
          <p className="text-sm text-gray-500">Ranked #{getCompanyRank(company.elo)} by ELO</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">ELO Rating</p>
            <p className="font-medium">{company.elo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Win Rate</p>
            <p className="font-medium">{company.winPercentage}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get company rank based on ELO
// In a real app, this would be calculated on the server
function getCompanyRank(elo: number): number {
  if (elo >= 1900) return 1
  if (elo >= 1800) return 2
  if (elo >= 1700) return 3
  if (elo >= 1600) return 4
  return 5
}
