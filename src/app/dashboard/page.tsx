"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

// Type assertion for session user with platformRole
type SessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  platformRole?: string
}
import { Shield, Users, Building, Settings, BarChart3, Activity, AlertTriangle, CheckCircle, Clock, } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"
import { IntegrationStatusWidget } from "@/components/integrations/integration-status-widget"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if ((session.user as SessionUser)?.platformRole !== "SUPER_ADMIN" && (session.user as SessionUser)?.platformRole !== "PLATFORM_ADMIN") {
      router.push("/organizations")
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

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of your compliance management platform
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Compliance</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">100%</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Integration Status */}
          <IntegrationStatusWidget />

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                System Status
              </CardTitle>
              <CardDescription>
                Current platform health and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Database</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Authentication</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">API Services</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm">Backup System</span>
                </div>
                <span className="text-sm text-yellow-600 font-medium">Pending</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest platform activities and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-gray-500 py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Platform activities will appear here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <Users className="h-6 w-6 text-blue-500 mb-2" />
                  <div className="text-sm font-medium">Users</div>
                  <div className="text-xs text-gray-500">Manage users</div>
                </div>
                <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <Building className="h-6 w-6 text-green-500 mb-2" />
                  <div className="text-sm font-medium">Organizations</div>
                  <div className="text-xs text-gray-500">Manage orgs</div>
                </div>
                <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <Settings className="h-6 w-6 text-purple-500 mb-2" />
                  <div className="text-sm font-medium">Settings</div>
                  <div className="text-xs text-gray-500">Platform config</div>
                </div>
                <Link href="/dashboard/assets-management">
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <Shield className="h-6 w-6 text-indigo-500 mb-2" />
                    <div className="text-sm font-medium">Asset Management</div>
                    <div className="text-xs text-gray-500">IT assets & access</div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Notifications */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                Platform Alerts
              </CardTitle>
              <CardDescription>
                Important notifications and system alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No active alerts</p>
                <p className="text-xs text-gray-400 mt-1">
                  System is running smoothly
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformAdminLayout>
  )
}
