"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Shield, Building, LogOut, Plus, Users, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OrganizationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-xl font-bold text-gray-900">complianceOS</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {session?.user?.name || 'User'}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Your Organizations</h2>
            <p className="mt-2 text-gray-600">
              {/* Manage compliance across your organizations */}
            </p>
          </div>

          {/* Organizations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Organization Card */}
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {/* Create New Organization */}
                </h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Set up a new organization for compliance management
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {/* Create Organization */}
                </Button>
              </CardContent>
            </Card>

            {/* Placeholder for existing organizations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <CardTitle className="text-lg">Sample Organization</CardTitle>
                      <CardDescription>Compliance management</CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Role:</span>
                    <span className="font-medium">Org Admin</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Department:</span>
                    <span className="font-medium">Administration</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Active:</span>
                    <span className="font-medium">Just now</span>
                  </div>
                </div>
                <Button className="w-full mt-4">
                  Enter Organization
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Empty State */}
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No organizations yet
            </h3>
            <p className="text-gray-500 mb-6">
              {/* Create your first organization to start managing compliance */}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {/* Create Your First Organization */}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
