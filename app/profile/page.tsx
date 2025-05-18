"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trophy, User, Calendar, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { AuthButton } from "@/components/auth/auth-button"

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [voteHistory, setVoteHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVoteHistory = async () => {
      if (authLoading) return

      // If not authenticated, redirect to sign in
      if (!user) {
        router.push("/auth/signin")
        return
      }

      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Get user's vote history
        const { data, error } = await supabase
          .from("votes")
          .select(`
            id,
            comparison_date,
            created_at,
            companies (
              id,
              name,
              logo
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setVoteHistory(data || [])
      } catch (error) {
        console.error("Error fetching vote history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVoteHistory()
  }, [user, authLoading, router])

  // If still loading auth, show loading state
  if (authLoading) {
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
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </main>
      </div>
    )
  }

  // If not authenticated, redirect handled in useEffect

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="text-xl font-bold">Prestige Check</span>
          </Link>
          <nav className="flex gap-4 sm:gap-6 items-center">
            <Link href="/stats" className="text-sm font-medium hover:underline underline-offset-4">
              Global Stats
            </Link>
            <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4">
              About
            </Link>
            <AuthButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">
          <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Your Profile</h1>
              <Button variant="outline" asChild>
                <Link href="/" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Email:</span>
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Account Created:</span>
                    <span>{new Date(user?.created_at || "").toLocaleDateString()}</span>
                  </div>
                  {user?.user_metadata?.role === "admin" && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium">Role:</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">Admin</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Your Vote History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                  </div>
                ) : voteHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">You haven't voted on any comparisons yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Voted On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voteHistory.map((vote) => (
                        <TableRow key={vote.id}>
                          <TableCell>{formatDate(vote.comparison_date)}</TableCell>
                          <TableCell className="font-medium">{vote.companies.name}</TableCell>
                          <TableCell className="text-right">{new Date(vote.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto px-6 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Prestige Check. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
