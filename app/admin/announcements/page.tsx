"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trophy, ArrowLeft, X, Edit, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import {
  getAnnouncements,
  updateAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
} from "@/app/actions/announcement-actions"

interface AnnouncementSection {
  title: string
  content: string
  list?: string[]
}

interface Announcement {
  id: number
  key: string
  title: string
  short_description: string
  full_description: string | null
  is_active: boolean
  bg_color: string
  created_at: string
  updated_at: string
}

export default function AnnouncementsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({
    key: "",
    title: "",
    short_description: "",
    full_description: null,
    is_active: true,
    bg_color: "blue",
  })
  const [sections, setSections] = useState<AnnouncementSection[]>([])
  const [newSection, setNewSection] = useState<AnnouncementSection>({ title: "", content: "", list: [] })
  const [newListItem, setNewListItem] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if user is admin
  const isAdmin = user?.user_metadata?.role === "admin"

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
    }
  }, [authLoading, isAdmin, router])

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true)
        const result = await getAnnouncements()
        if (result.success) {
          setAnnouncements(result.data || [])
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to fetch announcements",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching announcements:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isAdmin) {
      fetchAnnouncements()
    }
  }, [isAdmin, toast])

  const handleEditStart = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)

    // Parse the full_description JSON if it exists
    if (announcement.full_description) {
      try {
        const parsed = JSON.parse(announcement.full_description)
        if (parsed.sections && Array.isArray(parsed.sections)) {
          setSections(parsed.sections)
        } else {
          setSections([])
        }
      } catch (e) {
        console.error("Error parsing announcement full_description:", e)
        setSections([])
      }
    } else {
      setSections([])
    }
  }

  const handleAddSection = () => {
    if (newSection.title && newSection.content) {
      setSections([...sections, { ...newSection }])
      setNewSection({ title: "", content: "", list: [] })
    }
  }

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  const handleAddListItem = (sectionIndex: number) => {
    if (newListItem) {
      const updatedSections = [...sections]
      if (!updatedSections[sectionIndex].list) {
        updatedSections[sectionIndex].list = []
      }
      updatedSections[sectionIndex].list!.push(newListItem)
      setSections(updatedSections)
      setNewListItem("")
    }
  }

  const handleRemoveListItem = (sectionIndex: number, itemIndex: number) => {
    const updatedSections = [...sections]
    updatedSections[sectionIndex].list = updatedSections[sectionIndex].list!.filter((_, i) => i !== itemIndex)
    setSections(updatedSections)
  }

  const handleSaveEdit = async () => {
    if (!editingAnnouncement) return

    try {
      setIsEditing(true)

      // Prepare the full_description JSON
      const fullDescription = sections.length > 0 ? JSON.stringify({ sections }) : null

      const result = await updateAnnouncement({
        ...editingAnnouncement,
        full_description: fullDescription,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Announcement updated successfully",
        })

        // Update the local state
        setAnnouncements(
          announcements.map((a) =>
            a.id === editingAnnouncement.id ? { ...editingAnnouncement, full_description: fullDescription } : a,
          ),
        )

        setEditingAnnouncement(null)
        setSections([])
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update announcement",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating announcement:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.key || !newAnnouncement.title || !newAnnouncement.short_description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)

      // Prepare the full_description JSON
      const fullDescription = sections.length > 0 ? JSON.stringify({ sections }) : null

      const result = await createAnnouncement({
        ...newAnnouncement,
        key: newAnnouncement.key!,
        title: newAnnouncement.title!,
        short_description: newAnnouncement.short_description!,
        full_description: fullDescription,
        is_active: newAnnouncement.is_active ?? true,
        bg_color: newAnnouncement.bg_color || "blue",
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Announcement created successfully",
        })

        // Refresh the announcements list
        const refreshResult = await getAnnouncements()
        if (refreshResult.success) {
          setAnnouncements(refreshResult.data || [])
        }

        // Reset the form
        setNewAnnouncement({
          key: "",
          title: "",
          short_description: "",
          full_description: null,
          is_active: true,
          bg_color: "blue",
        })
        setSections([])
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create announcement",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating announcement:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      setIsDeleting(true)

      const result = await deleteAnnouncement(id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Announcement deleted successfully",
        })

        // Update the local state
        setAnnouncements(announcements.filter((a) => a.id !== id))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete announcement",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleAnnouncementStatus = async (announcement: Announcement) => {
    try {
      const result = await updateAnnouncement({
        ...announcement,
        is_active: !announcement.is_active,
      })

      if (result.success) {
        // Update the local state
        setAnnouncements(
          announcements.map((a) =>
            a.id === announcement.id ? { ...announcement, is_active: !announcement.is_active } : a,
          ),
        )

        toast({
          title: "Success",
          description: `Announcement ${announcement.is_active ? "disabled" : "enabled"} successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update announcement status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating announcement status:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
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
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">Manage Announcements</h1>
              <Button variant="outline" asChild>
                <Link href="/admin" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin
                </Link>
              </Button>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Current Announcements</CardTitle>
                <CardDescription>Manage system-wide announcements that appear at the top of the page</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No announcements found. Create one below.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.map((announcement) => (
                        <TableRow key={announcement.id}>
                          <TableCell className="font-mono text-sm">{announcement.key}</TableCell>
                          <TableCell>{announcement.title}</TableCell>
                          <TableCell className="max-w-xs truncate">{announcement.short_description}</TableCell>
                          <TableCell>
                            <div className={`w-6 h-6 rounded-full bg-${announcement.bg_color}-500`}></div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Switch
                                checked={announcement.is_active}
                                onCheckedChange={() => toggleAnnouncementStatus(announcement)}
                                disabled={isDeleting}
                              />
                              <span className="ml-2 text-sm">{announcement.is_active ? "Active" : "Inactive"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => handleEditStart(announcement)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Edit Announcement</DialogTitle>
                                  </DialogHeader>
                                  {editingAnnouncement && (
                                    <div className="grid gap-4 py-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-key">Key (Unique Identifier)</Label>
                                          <Input
                                            id="edit-key"
                                            value={editingAnnouncement.key}
                                            onChange={(e) =>
                                              setEditingAnnouncement({
                                                ...editingAnnouncement,
                                                key: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-bg-color">Background Color</Label>
                                          <Select
                                            value={editingAnnouncement.bg_color}
                                            onValueChange={(value) =>
                                              setEditingAnnouncement({
                                                ...editingAnnouncement,
                                                bg_color: value,
                                              })
                                            }
                                          >
                                            <SelectTrigger id="edit-bg-color">
                                              <SelectValue placeholder="Select a color" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="blue">Blue</SelectItem>
                                              <SelectItem value="green">Green</SelectItem>
                                              <SelectItem value="yellow">Yellow</SelectItem>
                                              <SelectItem value="red">Red</SelectItem>
                                              <SelectItem value="purple">Purple</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-title">Title</Label>
                                        <Input
                                          id="edit-title"
                                          value={editingAnnouncement.title}
                                          onChange={(e) =>
                                            setEditingAnnouncement({
                                              ...editingAnnouncement,
                                              title: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-short-description">Short Description</Label>
                                        <Textarea
                                          id="edit-short-description"
                                          value={editingAnnouncement.short_description}
                                          onChange={(e) =>
                                            setEditingAnnouncement({
                                              ...editingAnnouncement,
                                              short_description: e.target.value,
                                            })
                                          }
                                          rows={2}
                                        />
                                        <p className="text-xs text-gray-500">
                                          This text appears in the banner. Keep it short and concise.
                                        </p>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label>Detailed Content Sections</Label>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSections([])}
                                            className="h-7 px-2 text-xs"
                                          >
                                            Clear All
                                          </Button>
                                        </div>
                                        <div className="space-y-4">
                                          {sections.map((section, index) => (
                                            <div key={index} className="border rounded-md p-4 space-y-3">
                                              <div className="flex justify-between items-center">
                                                <h4 className="font-medium">Section {index + 1}</h4>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => handleRemoveSection(index)}
                                                  className="h-7 w-7 text-red-500"
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              <div className="space-y-2">
                                                <Label>Title</Label>
                                                <Input
                                                  value={section.title}
                                                  onChange={(e) => {
                                                    const updatedSections = [...sections]
                                                    updatedSections[index].title = e.target.value
                                                    setSections(updatedSections)
                                                  }}
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>Content</Label>
                                                <Textarea
                                                  value={section.content}
                                                  onChange={(e) => {
                                                    const updatedSections = [...sections]
                                                    updatedSections[index].content = e.target.value
                                                    setSections(updatedSections)
                                                  }}
                                                  rows={3}
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>List Items (Optional)</Label>
                                                {section.list && section.list.length > 0 && (
                                                  <ul className="space-y-1 mb-2">
                                                    {section.list.map((item, itemIndex) => (
                                                      <li key={itemIndex} className="flex items-center gap-2">
                                                        <span className="flex-1 text-sm">{item}</span>
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="icon"
                                                          onClick={() => handleRemoveListItem(index, itemIndex)}
                                                          className="h-6 w-6 text-red-500"
                                                        >
                                                          <X className="h-3 w-3" />
                                                        </Button>
                                                      </li>
                                                    ))}
                                                  </ul>
                                                )}
                                                <div className="flex gap-2">
                                                  <Input
                                                    placeholder="Add a list item"
                                                    value={newListItem}
                                                    onChange={(e) => setNewListItem(e.target.value)}
                                                    onKeyDown={(e) => {
                                                      if (e.key === "Enter" && newListItem) {
                                                        e.preventDefault()
                                                        handleAddListItem(index)
                                                      }
                                                    }}
                                                  />
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => handleAddListItem(index)}
                                                    disabled={!newListItem}
                                                  >
                                                    Add
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                          <div className="border border-dashed rounded-md p-4">
                                            <div className="space-y-3">
                                              <div className="space-y-2">
                                                <Label>New Section Title</Label>
                                                <Input
                                                  placeholder="e.g., What changed?"
                                                  value={newSection.title}
                                                  onChange={(e) =>
                                                    setNewSection({ ...newSection, title: e.target.value })
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>New Section Content</Label>
                                                <Textarea
                                                  placeholder="e.g., Daily comparisons now change at the same time for everyone worldwide..."
                                                  value={newSection.content}
                                                  onChange={(e) =>
                                                    setNewSection({ ...newSection, content: e.target.value })
                                                  }
                                                  rows={3}
                                                />
                                              </div>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleAddSection}
                                                disabled={!newSection.title || !newSection.content}
                                                className="w-full"
                                              >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Section
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <Switch
                                            id="edit-is-active"
                                            checked={editingAnnouncement.is_active}
                                            onCheckedChange={(checked) =>
                                              setEditingAnnouncement({
                                                ...editingAnnouncement,
                                                is_active: checked,
                                              })
                                            }
                                          />
                                          <Label htmlFor="edit-is-active">Active</Label>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          When active, this announcement will be shown to users.
                                        </p>
                                      </div>
                                      <div className="flex justify-end gap-2 mt-4">
                                        <DialogClose asChild>
                                          <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button onClick={handleSaveEdit} disabled={isEditing}>
                                          {isEditing ? "Saving..." : "Save Changes"}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                disabled={isDeleting}
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

            <Card>
              <CardHeader>
                <CardTitle>Create New Announcement</CardTitle>
                <CardDescription>Create a new system-wide announcement to display to users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-key">Key (Unique Identifier)</Label>
                      <Input
                        id="new-key"
                        placeholder="e.g., new-feature-announcement"
                        value={newAnnouncement.key}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, key: e.target.value })}
                      />
                      <p className="text-xs text-gray-500">
                        A unique identifier for this announcement. Use lowercase letters, numbers, and hyphens.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-bg-color">Background Color</Label>
                      <Select
                        value={newAnnouncement.bg_color || "blue"}
                        onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, bg_color: value })}
                      >
                        <SelectTrigger id="new-bg-color">
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="yellow">Yellow</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-title">Title</Label>
                    <Input
                      id="new-title"
                      placeholder="e.g., We've updated our daily comparisons!"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-short-description">Short Description</Label>
                    <Textarea
                      id="new-short-description"
                      placeholder="e.g., All comparisons now change at midnight UTC for everyone worldwide."
                      value={newAnnouncement.short_description}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, short_description: e.target.value })}
                      rows={2}
                    />
                    <p className="text-xs text-gray-500">This text appears in the banner. Keep it short and concise.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Detailed Content Sections</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSections([])}
                        className="h-7 px-2 text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {sections.map((section, index) => (
                        <div key={index} className="border rounded-md p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Section {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSection(index)}
                              className="h-7 w-7 text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={section.title}
                              onChange={(e) => {
                                const updatedSections = [...sections]
                                updatedSections[index].title = e.target.value
                                setSections(updatedSections)
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Content</Label>
                            <Textarea
                              value={section.content}
                              onChange={(e) => {
                                const updatedSections = [...sections]
                                updatedSections[index].content = e.target.value
                                setSections(updatedSections)
                              }}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>List Items (Optional)</Label>
                            {section.list && section.list.length > 0 && (
                              <ul className="space-y-1 mb-2">
                                {section.list.map((item, itemIndex) => (
                                  <li key={itemIndex} className="flex items-center gap-2">
                                    <span className="flex-1 text-sm">{item}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveListItem(index, itemIndex)}
                                      className="h-6 w-6 text-red-500"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a list item"
                                value={newListItem}
                                onChange={(e) => setNewListItem(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && newListItem) {
                                    e.preventDefault()
                                    handleAddListItem(index)
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleAddListItem(index)}
                                disabled={!newListItem}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="border border-dashed rounded-md p-4">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>New Section Title</Label>
                            <Input
                              placeholder="e.g., What changed?"
                              value={newSection.title}
                              onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>New Section Content</Label>
                            <Textarea
                              placeholder="e.g., Daily comparisons now change at the same time for everyone worldwide..."
                              value={newSection.content}
                              onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddSection}
                            disabled={!newSection.title || !newSection.content}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Section
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="new-is-active"
                        checked={newAnnouncement.is_active ?? true}
                        onCheckedChange={(checked) => setNewAnnouncement({ ...newAnnouncement, is_active: checked })}
                      />
                      <Label htmlFor="new-is-active">Active</Label>
                    </div>
                    <p className="text-xs text-gray-500">When active, this announcement will be shown to users.</p>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={handleCreateAnnouncement}
                      disabled={
                        isCreating ||
                        !newAnnouncement.key ||
                        !newAnnouncement.title ||
                        !newAnnouncement.short_description
                      }
                    >
                      {isCreating ? "Creating..." : "Create Announcement"}
                    </Button>
                  </div>
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
