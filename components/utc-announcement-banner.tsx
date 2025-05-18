"use client"

import { useState, useEffect } from "react"
import { X, Clock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { getSupabaseBrowserClient } from "@/lib/supabase"

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
}

export function UtcAnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [sections, setSections] = useState<AnnouncementSection[]>([])
  const bannerKey = "utc-announcement-dismissed"

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from("system_announcements")
          .select("*")
          .eq("key", "utc-announcement")
          .eq("is_active", true)
          .single()

        if (error) {
          if (error.code !== "PGRST116") {
            // PGRST116 is "Results contain 0 rows"
            console.error("Error fetching announcement:", error)
          }
          return
        }

        if (data) {
          setAnnouncement(data)

          // Parse the full_description JSON if it exists
          if (data.full_description) {
            try {
              const parsed = JSON.parse(data.full_description)
              if (parsed.sections && Array.isArray(parsed.sections)) {
                setSections(parsed.sections)
              }
            } catch (e) {
              console.error("Error parsing announcement full_description:", e)
            }
          }

          // Check if the user has already dismissed this announcement
          const isDismissed = localStorage.getItem(`${bannerKey}-${data.id}`) === "true"
          if (!isDismissed) {
            setIsVisible(true)
          }
        }
      } catch (error) {
        console.error("Error in fetchAnnouncement:", error)
      }
    }

    fetchAnnouncement()
  }, [])

  const dismissBanner = () => {
    setIsVisible(false)
    if (announcement) {
      localStorage.setItem(`${bannerKey}-${announcement.id}`, "true")
    }
  }

  if (!isVisible || !announcement) return null

  const getBgColorClass = () => {
    switch (announcement.bg_color) {
      case "blue":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800"
      case "green":
        return "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800"
      case "yellow":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800"
      case "red":
        return "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
      case "purple":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800"
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800"
    }
  }

  const getTextColorClass = () => {
    switch (announcement.bg_color) {
      case "blue":
        return "text-blue-800 dark:text-blue-200"
      case "green":
        return "text-green-800 dark:text-green-200"
      case "yellow":
        return "text-yellow-800 dark:text-yellow-200"
      case "red":
        return "text-red-800 dark:text-red-200"
      case "purple":
        return "text-purple-800 dark:text-purple-200"
      default:
        return "text-blue-800 dark:text-blue-200"
    }
  }

  const getIconColorClass = () => {
    switch (announcement.bg_color) {
      case "blue":
        return "text-blue-500"
      case "green":
        return "text-green-500"
      case "yellow":
        return "text-yellow-500"
      case "red":
        return "text-red-500"
      case "purple":
        return "text-purple-500"
      default:
        return "text-blue-500"
    }
  }

  const getLinkColorClass = () => {
    switch (announcement.bg_color) {
      case "blue":
        return "text-blue-600 dark:text-blue-300"
      case "green":
        return "text-green-600 dark:text-green-300"
      case "yellow":
        return "text-yellow-600 dark:text-yellow-300"
      case "red":
        return "text-red-600 dark:text-red-300"
      case "purple":
        return "text-purple-600 dark:text-purple-300"
      default:
        return "text-blue-600 dark:text-blue-300"
    }
  }

  const getExpandedBgClass = () => {
    switch (announcement.bg_color) {
      case "blue":
        return "bg-white dark:bg-blue-950/30"
      case "green":
        return "bg-white dark:bg-green-950/30"
      case "yellow":
        return "bg-white dark:bg-yellow-950/30"
      case "red":
        return "bg-white dark:bg-red-950/30"
      case "purple":
        return "bg-white dark:bg-purple-950/30"
      default:
        return "bg-white dark:bg-blue-950/30"
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full border-b ${getBgColorClass()}`}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 flex-shrink-0 ${getIconColorClass()}`} />
              <p className={`text-sm ${getTextColorClass()}`}>
                <span className="font-medium">{announcement.title}</span>{" "}
                <span className="hidden sm:inline">{announcement.short_description}</span>
                {sections.length > 0 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`${getLinkColorClass()} underline underline-offset-2 ml-1 sm:ml-2 font-medium`}
                  >
                    {isExpanded ? "Show less" : "Learn more"}
                  </button>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${getIconColorClass()} hover:bg-${announcement.bg_color}-100`}
              onClick={dismissBanner}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>

          <AnimatePresence>
            {isExpanded && sections.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 overflow-hidden"
              >
                <div
                  className={`${getExpandedBgClass()} rounded-lg p-4 text-sm space-y-3 text-gray-700 dark:text-gray-300`}
                >
                  {sections.map((section, index) => (
                    <div key={index} className="flex gap-2">
                      <Info className={`h-5 w-5 flex-shrink-0 mt-0.5 ${getIconColorClass()}`} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{section.title}</p>
                        <p>{section.content}</p>
                        {section.list && section.list.length > 0 && (
                          <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                            {section.list.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
