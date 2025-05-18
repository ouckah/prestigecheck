import Link from "next/link"
import { Trophy, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="text-xl font-bold">Prestige Check</span>
          </Link>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="/stats" className="text-sm font-medium hover:underline underline-offset-4">
              Global Stats
            </Link>
            <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4">
              About
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">About Prestige Check</h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">Learn how we measure company prestige</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Prestige Check uses a combination of user votes and an ELO rating system to determine the perceived
                    prestige of tech companies.
                  </p>
                  <p>
                    Every time you choose between two companies, our system updates their ratings based on your
                    selection. Companies that are selected more frequently rise in the rankings, while those that are
                    selected less often fall.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>The ELO Rating System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    We use an adaptation of the ELO rating system, originally developed for chess rankings. Each company
                    starts with a base rating of 1500.
                  </p>
                  <p>When two companies are compared:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The winner gains points based on the loser's rating</li>
                    <li>The loser loses points based on the winner's rating</li>
                    <li>A higher-rated company winning against a lower-rated one results in fewer points exchanged</li>
                    <li>A lower-rated company winning against a higher-rated one results in more points exchanged</li>
                  </ul>
                  <p>
                    This creates a dynamic ranking system that adjusts based on the collective opinions of all users.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data & Privacy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Prestige Check only collects anonymous voting data. We don't track personal information or require
                    user accounts. Your selections help improve our rankings, but are never tied to your identity.
                  </p>
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
