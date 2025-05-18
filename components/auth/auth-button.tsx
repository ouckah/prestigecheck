"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export function AuthButton() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignIn = async () => {
    router.push("/auth/signin")
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    )
  }

  if (!user) {
    return (
      <Button variant="ghost" size="sm" onClick={handleSignIn}>
        <LogIn className="h-4 w-4 mr-2" />
        Sign In
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden md:inline">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
        {user.user_metadata?.role === "admin" && (
          <DropdownMenuItem onClick={() => router.push("/admin")}>Admin Dashboard</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
