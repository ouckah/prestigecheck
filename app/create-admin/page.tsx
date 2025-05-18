"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function CreateAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const createAdmin = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin user")
      }

      setResult({
        success: true,
        message:
          "Admin user created successfully! You can now log in with the following credentials:\n\nEmail: aidan.ouckama@gmail.com\nPassword: prestigehunt214!",
      })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Admin User</CardTitle>
          <CardDescription>Create an admin user with the email aidan.ouckama@gmail.com</CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription className="whitespace-pre-line">{result.message || result.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={createAdmin} disabled={isLoading || result?.success}>
            {isLoading ? "Creating..." : "Create Admin User"}
          </Button>
          {result?.success && (
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Go to Login</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
