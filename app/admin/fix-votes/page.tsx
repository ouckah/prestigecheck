"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trophy, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export default function FixVotesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [voteData, setVoteData] = useState<any>(null)

  // Check if user is admin
  const isAdmin = user?.user_metadata?.role === "admin"

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
    }
  }, [authLoading, isAdmin, router])

  const checkVoteCounts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/fix-vote-counts")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check vote counts")
      }

      setVoteData(data)
    } catch (error) {
      console.error("Error checking vote counts:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fixVoteCounts = async () => {
    try {
      setIsFixing(true)
      const response = await fetch("/api/fix-vote-counts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fix: true }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix vote counts")
      }

      toast({
        title: "Success",
        description: "Vote counts have been fixed successfully",
      })

      // Refresh the data
      await checkVoteCounts()
    } catch (error) {
      console.error("Error fixing vote counts:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="text-xl font-bold">Prestige Check</span>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">Fix Vote Counts</h1>
              <Button variant="outline" asChild>
                <Link href="/admin" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin
                </Link>
              </Button>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Vote Count Checker</CardTitle>
                <CardDescription>
                  This tool checks for discrepancies between the vote counts stored in the companies table and the
                  actual number of votes in the votes table.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button onClick={checkVoteCounts} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        "Check Vote Counts"
                      )}
                    </Button>
                    {voteData && voteData.discrepancies && voteData.discrepancies.length > 0 && (
                      <Button onClick={fixVoteCounts} disabled={isFixing} variant="destructive">
                        {isFixing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Fixing...
                          </>
                        ) : (
                          "Fix Vote Counts"
                        )}
                      </Button>
                    )}
                  </div>

                  {voteData && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4">Results</h3>

                      {voteData.discrepancies && voteData.discrepancies.length > 0 ? (
                        <>
                          <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Discrepancies Found</AlertTitle>
                            <AlertDescription>
                              Found {voteData.discrepancies.length} companies with incorrect vote counts.
                            </AlertDescription>
                          </Alert>

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Company ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Current Votes</TableHead>
                                <TableHead className="text-right">Actual Votes</TableHead>
                                <TableHead className="text-right">Difference</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {voteData.discrepancies.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.id}</TableCell>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell className="text-right">{item.currentVotes}</TableCell>
                                  <TableCell className="text-right">{item.actualVotes}</TableCell>
                                  <TableCell
                                    className={`text-right font-medium ${
                                      item.difference > 0 ? "text-red-600" : "text-green-600"
                                    }`}
                                  >
                                    {item.difference > 0 ? "+" : ""}
                                    {item.difference}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </>
                      ) : voteData.discrepancies ? (
                        <Alert className="bg-green-50 border-green-200">
                          <AlertTitle>No Discrepancies</AlertTitle>
                          <AlertDescription>All vote counts are correct.</AlertDescription>
                        </Alert>
                      ) : null}

                      <div className="mt-6">
                        <h4 className="font-medium mb-2">All Companies</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Company ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead className="text-right">Current Votes</TableHead>
                              <TableHead className="text-right">Actual Votes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {voteData.companies.map((company) => (
                              <TableRow key={company.id}>
                                <TableCell>{company.id}</TableCell>
                                <TableCell>{company.name}</TableCell>
                                <TableCell className="text-right">{company.votes}</TableCell>
                                <TableCell className="text-right">
                                  {voteData.actualVoteCounts[company.id] || 0}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Prestige Check. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
