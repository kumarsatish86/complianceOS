"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Shield, Loader2 } from "lucide-react"

// Type assertion for session user with platformRole
type SessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  platformRole?: string
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log('🏠 Home page - Status:', status)
    console.log('🏠 Home page - Session:', session)
    
    if (status === "loading") return // Still loading

    if (session) {
      console.log('🏠 User is signed in, platform role:', (session.user as SessionUser)?.platformRole)
      // User is signed in, redirect based on role
      if ((session.user as SessionUser)?.platformRole === "SUPER_ADMIN" || (session.user as SessionUser)?.platformRole === "PLATFORM_ADMIN") {
        console.log('🏠 Redirecting to dashboard...')
        router.push("/dashboard")
      } else {
        console.log('🏠 Redirecting to organizations...')
        router.push("/organizations")
      }
    } else {
      console.log('🏠 User is not signed in, redirecting to signin...')
      // User is not signed in, redirect to sign in
      router.push("/auth/signin")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">complianceOS</h1>
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}
