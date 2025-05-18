"use client"

import { useState } from "react"
import Link from "next/link"
import { Trophy, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function EloUpdatePage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState("")
  const [result, setResult] = useState<any>(null)

  const handleUpdateElo = async () => {
    try {
      setIsLoading(true)
      setResult(null)

      const response = await fetch("/api/update-daily-elo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: date || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update ELO ratings")
      }

      setResult(data)
      toast({
        title: "ELO Update Successful",
        description: `Successfully processed ELO updates for ${data.message.split("for ")[1]}`,
      })
    } catch (error) {
      console.error("Error updating ELO ratings:", error)
      toast({
        title: "Error Updating ELO Ratings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">ELO Rating Updates</h1>
              <Button variant="outline" asChild>
                <Link href="/admin" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin
                </Link>
              </Button>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Process Daily ELO Updates</CardTitle>
                <CardDescription>
                  This will process all votes for a specific date and update the ELO history. If no date is specified,
                  yesterday's date will be used.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date (Optional)</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                    />
                    <p className="text-sm text-gray-500">
                      Leave blank to process yesterday's data (recommended for daily updates).
                    </p>
                  </div>

                  <Button onClick={handleUpdateElo} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Process ELO Updates"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {result && (
              <Alert className="bg-green-50 border-green-200">
                <AlertTitle>Update Successful</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">{result.message}</p>
                  {result.updates && result.updates.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Updated Companies:</p>
                      <ul className="space-y-1 text-sm">
                        {result.updates.map((update: any, index: number) => (
                          <li key={index}>
                            Company #{update.company_id}: {update.previous_elo} → {update.current_elo} (
                            {update.daily_change > 0 ? "+" : ""}
                            {update.daily_change})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
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
