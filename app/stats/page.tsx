import Link from "next/link"
import { Trophy, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample company data with stats
const companies = [
  {
    id: 1,
    name: "Google",
    elo: 1850,
    votes: 12500,
    winPercentage: 68,
    rank: 3,
  },
  {
    id: 2,
    name: "Apple",
    elo: 1920,
    votes: 15000,
    winPercentage: 75,
    rank: 1,
  },
  {
    id: 3,
    name: "Microsoft",
    elo: 1780,
    votes: 11000,
    winPercentage: 62,
    rank: 4,
  },
  {
    id: 4,
    name: "Amazon",
    elo: 1750,
    votes: 10500,
    winPercentage: 58,
    rank: 5,
  },
  {
    id: 5,
    name: "Meta",
    elo: 1680,
    votes: 9000,
    winPercentage: 52,
    rank: 7,
  },
  {
    id: 6,
    name: "Netflix",
    elo: 1620,
    votes: 7500,
    winPercentage: 45,
    rank: 8,
  },
  {
    id: 7,
    name: "Tesla",
    elo: 1700,
    votes: 9500,
    winPercentage: 55,
    rank: 6,
  },
  {
    id: 8,
    name: "Nvidia",
    elo: 1800,
    votes: 8000,
    winPercentage: 65,
    rank: 2,
  },
].sort((a, b) => a.rank - b.rank)

export default function StatsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="text-xl font-bold">Prestige Check</span>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Global Statistics</h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                See how all companies rank based on user votes
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Company Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Rank</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">ELO Rating</TableHead>
                        <TableHead className="text-right">Win Rate</TableHead>
                        <TableHead className="text-right">Total Votes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">
                            {company.rank === 1 ? (
                              <span className="flex items-center gap-1">
                                1 <Trophy className="h-4 w-4 text-yellow-500" />
                              </span>
                            ) : (
                              company.rank
                            )}
                          </TableCell>
                          <TableCell>{company.name}</TableCell>
                          <TableCell className="text-right">{company.elo}</TableCell>
                          <TableCell className="text-right">{company.winPercentage}%</TableCell>
                          <TableCell className="text-right">{company.votes.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="mt-8 flex justify-center">
                <Link href="/">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Comparisons
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Prestige Check. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
