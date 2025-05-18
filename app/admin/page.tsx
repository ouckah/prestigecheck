"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trophy, Plus, Pencil, Trash2, Lock, LogOut, Calendar, Check, Database, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { getTodayString, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import {
  addCompany,
  deleteCompany,
  updateCompany,
  scheduleComparison,
  deleteComparison,
} from "@/app/actions/admin-actions"
import { RefreshCw } from "lucide-react"

interface Company {
  id: number
  name: string
  logo: string
  elo: number
  votes: number
  win_percentage: number
}

interface ScheduledComparison {
  id: number
  date: string
  theme: string
  companyIds?: number[]
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [companies, setCompanies] = useState<Company[]>([])
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    name: "",
    logo: "",
    elo: 1500,
    votes: 0,
    win_percentage: 50,
  })
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Scheduled comparisons state
  const [scheduledComparisons, setScheduledComparisons] = useState<ScheduledComparison[]>([])
  const [newComparison, setNewComparison] = useState<Partial<ScheduledComparison>>({
    date: getTodayString(),
    theme: "",
  })
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([])

  // Check if user is admin
  const isAdmin = user?.user_metadata?.role === "admin"

  // Load companies and scheduled comparisons
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return

      // If not authenticated or not admin, redirect to home
      if (!user || !isAdmin) {
        router.push("/")
        return
      }

      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Fetch companies
        const { data: companiesData, error: companiesError } = await supabase.from("companies").select("*")

        if (companiesError) throw companiesError
        setCompanies(companiesData || [])

        // Fetch scheduled comparisons
        const { data: comparisonsData, error: comparisonsError } = await supabase
          .from("scheduled_comparisons")
          .select("id, date, theme")

        if (comparisonsError) throw comparisonsError

        // For each comparison, fetch the associated companies
        const comparisonsWithCompanies = await Promise.all(
          (comparisonsData || []).map(async (comparison) => {
            const { data: companyLinks } = await supabase
              .from("comparison_companies")
              .select("company_id")
              .eq("comparison_id", comparison.id)

            return {
              ...comparison,
              companyIds: companyLinks?.map((link) => link.company_id) || [],
            }
          }),
        )

        setScheduledComparisons(comparisonsWithCompanies)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error loading data",
          description: "Could not load companies or scheduled comparisons.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, isAdmin, authLoading, router, toast])

  // Add a new company
  const handleAddCompany = async () => {
    if (!newCompany.name || !newCompany.logo) {
      return
    }

    try {
      // Create a FormData object to pass to the server action
      const formData = new FormData()
      formData.append("name", newCompany.name)
      formData.append("logo", newCompany.logo)
      formData.append("elo", String(newCompany.elo || 1500))
      formData.append("votes", String(newCompany.votes || 0))
      formData.append("win_percentage", String(newCompany.win_percentage || 50))

      const result = await addCompany(formData)

      if (!result.success) {
        throw new Error(result.error)
      }

      // Refresh companies list
      const supabase = getSupabaseBrowserClient()
      const { data: updatedCompanies, error: fetchError } = await supabase.from("companies").select("*")

      if (fetchError) throw fetchError

      setCompanies(updatedCompanies || [])
      setNewCompany({
        name: "",
        logo: "",
        elo: 1500,
        votes: 0,
        win_percentage: 50,
      })

      setSuccessMessage("Company added successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Error adding company:", error)
      toast({
        title: "Error adding company",
        description: error instanceof Error ? error.message : "Could not add the company. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete a company
  const handleDeleteCompany = async (id: number) => {
    try {
      const result = await deleteCompany(id)

      if (!result.success) {
        throw new Error(result.error)
      }

      setCompanies(companies.filter((company) => company.id !== id))
      setSuccessMessage("Company deleted successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Error deleting company:", error)
      toast({
        title: "Error deleting company",
        description: error instanceof Error ? error.message : "Could not delete the company. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Start editing a company
  const handleEditStart = (company: Company) => {
    setEditingCompany({ ...company })
  }

  // Save edited company
  const handleSaveEdit = async () => {
    if (!editingCompany) return

    try {
      const result = await updateCompany(editingCompany)

      if (!result.success) {
        throw new Error(result.error)
      }

      setCompanies(companies.map((company) => (company.id === editingCompany.id ? editingCompany : company)))
      setEditingCompany(null)
      setSuccessMessage("Company updated successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Error updating company:", error)
      toast({
        title: "Error updating company",
        description: error instanceof Error ? error.message : "Could not update the company. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCompany(null)
  }

  // Toggle company selection for comparison
  const toggleCompanySelection = (id: number) => {
    if (selectedCompanyIds.includes(id)) {
      setSelectedCompanyIds(selectedCompanyIds.filter((companyId) => companyId !== id))
    } else {
      setSelectedCompanyIds([...selectedCompanyIds, id])
    }
  }

  // Schedule a new comparison
  const handleScheduleComparison = async () => {
    if (!newComparison.date || !newComparison.theme || selectedCompanyIds.length < 2) {
      return
    }

    try {
      // Create a FormData object to pass to the server action
      const formData = new FormData()
      formData.append("date", newComparison.date)
      formData.append("theme", newComparison.theme)
      formData.append("companyIds", JSON.stringify(selectedCompanyIds))

      const result = await scheduleComparison(formData)

      if (!result.success) {
        throw new Error(result.error)
      }

      // Refresh the scheduled comparisons list
      const supabase = getSupabaseBrowserClient()
      const { data: updatedComparisons, error: fetchError } = await supabase
        .from("scheduled_comparisons")
        .select("id, date, theme")

      if (fetchError) throw fetchError

      // For each comparison, fetch the associated companies
      const comparisonsWithCompanies = await Promise.all(
        (updatedComparisons || []).map(async (comparison) => {
          const { data: companyLinks } = await supabase
            .from("comparison_companies")
            .select("company_id")
            .eq("comparison_id", comparison.id)

          return {
            ...comparison,
            companyIds: companyLinks?.map((link) => link.company_id) || [],
          }
        }),
      )

      setScheduledComparisons(comparisonsWithCompanies)
      setNewComparison({
        date: getTodayString(),
        theme: "",
      })
      setSelectedCompanyIds([])

      setSuccessMessage("Comparison scheduled successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Error scheduling comparison:", error)
      toast({
        title: "Error scheduling comparison",
        description: error instanceof Error ? error.message : "Could not schedule the comparison. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete a scheduled comparison
  const handleDeleteComparison = async (id: number) => {
    try {
      const result = await deleteComparison(id)

      if (!result.success) {
        throw new Error(result.error)
      }

      setScheduledComparisons(scheduledComparisons.filter((comparison) => comparison.id !== id))
      setSuccessMessage("Scheduled comparison deleted!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Error deleting comparison:", error)
      toast({
        title: "Error deleting comparison",
        description:
          error instanceof Error ? error.message : "Could not delete the scheduled comparison. Please try again.",
        variant: "destructive",
      })
    }
  }

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

  // If not admin, show access denied
  if (!isAdmin) {
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
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">You do not have permission to access the admin dashboard.</p>
              <Button asChild>
                <Link href="/">Return to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="text-xl font-bold">Prestige Check</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500">Admin Panel</span>
            <Button variant="outline" size="sm" onClick={() => router.push("/")} className="gap-1">
              <LogOut className="h-4 w-4" />
              Exit Admin
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">
          <div className="flex flex-col gap-8">
            {successMessage && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="companies" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="companies">Manage Companies</TabsTrigger>
                <TabsTrigger value="comparisons">Schedule Comparisons</TabsTrigger>
                <TabsTrigger value="tools">Admin Tools</TabsTrigger>
              </TabsList>

              <TabsContent value="companies" className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Add New Company</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Company Name</Label>
                          <Input
                            id="name"
                            value={newCompany.name}
                            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="logo">Logo URL</Label>
                          <Input
                            id="logo"
                            value={newCompany.logo}
                            onChange={(e) => setNewCompany({ ...newCompany, logo: e.target.value })}
                            placeholder="/company-logo.png"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="elo">Initial ELO</Label>
                          <Input
                            id="elo"
                            type="number"
                            value={newCompany.elo}
                            onChange={(e) => setNewCompany({ ...newCompany, elo: Number(e.target.value) })}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={handleAddCompany} className="gap-1">
                            <Plus className="h-4 w-4" />
                            Add Company
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Manage Companies</h2>
                  <Card>
                    <CardContent className="pt-6">
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Logo</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>ELO</TableHead>
                              <TableHead>Win %</TableHead>
                              <TableHead>Votes</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {companies.map((company) => (
                              <TableRow key={company.id}>
                                <TableCell>{company.id}</TableCell>
                                <TableCell>
                                  <div className="relative w-10 h-10">
                                    <Image
                                      src={company.logo || "/placeholder.svg"}
                                      alt={`${company.name} logo`}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell>{company.elo}</TableCell>
                                <TableCell>{company.win_percentage}%</TableCell>
                                <TableCell>{company.votes.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => handleEditStart(company)}>
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Edit Company</DialogTitle>
                                        </DialogHeader>
                                        {editingCompany && (
                                          <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-name">Company Name</Label>
                                              <Input
                                                id="edit-name"
                                                value={editingCompany.name}
                                                onChange={(e) =>
                                                  setEditingCompany({ ...editingCompany, name: e.target.value })
                                                }
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-logo">Logo URL</Label>
                                              <Input
                                                id="edit-logo"
                                                value={editingCompany.logo}
                                                onChange={(e) =>
                                                  setEditingCompany({ ...editingCompany, logo: e.target.value })
                                                }
                                              />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-elo">ELO Rating</Label>
                                                <Input
                                                  id="edit-elo"
                                                  type="number"
                                                  value={editingCompany.elo}
                                                  onChange={(e) =>
                                                    setEditingCompany({
                                                      ...editingCompany,
                                                      elo: Number(e.target.value),
                                                    })
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-win">Win %</Label>
                                                <Input
                                                  id="edit-win"
                                                  type="number"
                                                  value={editingCompany.win_percentage}
                                                  onChange={(e) =>
                                                    setEditingCompany({
                                                      ...editingCompany,
                                                      win_percentage: Number(e.target.value),
                                                    })
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-votes">Votes</Label>
                                                <Input
                                                  id="edit-votes"
                                                  type="number"
                                                  value={editingCompany.votes}
                                                  onChange={(e) =>
                                                    setEditingCompany({
                                                      ...editingCompany,
                                                      votes: Number(e.target.value),
                                                    })
                                                  }
                                                />
                                              </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-4">
                                              <DialogClose asChild>
                                                <Button variant="outline" onClick={handleCancelEdit}>
                                                  Cancel
                                                </Button>
                                              </DialogClose>
                                              <DialogClose asChild>
                                                <Button onClick={handleSaveEdit}>Save Changes</Button>
                                              </DialogClose>
                                            </div>
                                          </div>
                                        )}
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteCompany(company.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="comparisons" className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Schedule New Comparison</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid gap-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="comparison-date">Date</Label>
                            <Input
                              id="comparison-date"
                              type="date"
                              value={newComparison.date}
                              onChange={(e) => setNewComparison({ ...newComparison, date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="comparison-theme">Theme</Label>
                            <Input
                              id="comparison-theme"
                              value={newComparison.theme}
                              onChange={(e) => setNewComparison({ ...newComparison, theme: e.target.value })}
                              placeholder="e.g. Innovation Leaders"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Select Companies (minimum 2)</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                            {companies.map((company) => (
                              <div
                                key={company.id}
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                  selectedCompanyIds.includes(company.id)
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : "hover:border-gray-400"
                                }`}
                                onClick={() => toggleCompanySelection(company.id)}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <div className="relative w-16 h-16">
                                    <Image
                                      src={company.logo || "/placeholder.svg"}
                                      alt={`${company.name} logo`}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-center">{company.name}</span>
                                  {selectedCompanyIds.includes(company.id) && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                      <Check className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={handleScheduleComparison}
                            className="gap-1"
                            disabled={selectedCompanyIds.length < 2 || !newComparison.date || !newComparison.theme}
                          >
                            <Calendar className="h-4 w-4" />
                            Schedule Comparison
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Scheduled Comparisons</h2>
                  <Card>
                    <CardContent className="pt-6">
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                        </div>
                      ) : scheduledComparisons.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No comparisons scheduled yet. Create one above.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Theme</TableHead>
                              <TableHead>Companies</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {scheduledComparisons
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map((comparison) => (
                                <TableRow key={comparison.id}>
                                  <TableCell>{formatDate(comparison.date)}</TableCell>
                                  <TableCell>{comparison.theme}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-2">
                                      {comparison.companyIds?.map((id) => {
                                        const company = companies.find((c) => c.id === id)
                                        return company ? (
                                          <div
                                            key={id}
                                            className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full"
                                          >
                                            <div className="relative w-4 h-4">
                                              <Image
                                                src={company.logo || "/placeholder.svg"}
                                                alt={`${company.name} logo`}
                                                fill
                                                className="object-contain"
                                              />
                                            </div>
                                            <span className="text-xs">{company.name}</span>
                                          </div>
                                        ) : null
                                      })}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteComparison(comparison.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="tools" className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Admin Tools</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium">Fix Vote Counts</h3>
                            <p className="text-sm text-gray-500">
                              Check and fix discrepancies between stored vote counts and actual votes
                            </p>
                          </div>
                          <Button asChild>
                            <Link href="/admin/fix-votes" className="gap-2">
                              <Database className="h-4 w-4" />
                              Open Tool
                            </Link>
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium">ELO Updates</h3>
                            <p className="text-sm text-gray-500">Process daily ELO updates and manage ELO history</p>
                          </div>
                          <Button asChild>
                            <Link href="/admin/elo-update" className="gap-2">
                              <RefreshCw className="h-4 w-4" />
                              Open Tool
                            </Link>
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium">Manage Announcements</h3>
                            <p className="text-sm text-gray-500">Create, edit, and remove system-wide announcements</p>
                          </div>
                          <Button asChild>
                            <Link href="/admin/announcements" className="gap-2">
                              <Bell className="h-4 w-4" />
                              Open Tool
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto px-6 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Prestige Check. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:underline underline-offset-4">
              Back to Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
