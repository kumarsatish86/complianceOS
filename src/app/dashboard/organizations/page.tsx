"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"

// Type assertion for session user with platformRole
type SessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  platformRole?: string
}
import { Building, 
  Plus, 
  Search,
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users,
  Shield,
  Settings,
  Calendar,
  CheckCircle,
  XCircle,
  Globe,
  BookOpen,
  RefreshCw,
  AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface Organization {
  id: string
  name: string
  slug: string
  domain: string
  status: "active" | "inactive" | "suspended"
  plan: "free" | "pro" | "enterprise"
  userCount: number
  adminCount: number
  createdAt: string
  updatedAt: string
}

interface OrganizationStatistics {
  totalOrganizations: number
  activeOrganizations: number
  enterpriseOrganizations: number
  totalUsers: number
}

export default function OrganizationManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPlan, setSelectedPlan] = useState("all")
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [statistics, setStatistics] = useState<OrganizationStatistics>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    enterpriseOrganizations: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch organizations from API
  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedStatus !== "all") params.append("status", selectedStatus)
      if (selectedPlan !== "all") params.append("plan", selectedPlan)
      
      const response = await fetch(`/api/admin/organizations?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch organizations")
      }
      
      const data = await response.json()
      setOrganizations(data.organizations)
      setStatistics(data.statistics)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching organizations:", err)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedStatus, selectedPlan])

  // Handle add organization - navigate to add page
  const handleAddOrganization = () => {
    router.push("/dashboard/organizations/add")
  }

  // Handle edit organization - navigate to edit page
  const handleEditOrganization = (organization: Organization) => {
    router.push(`/dashboard/organizations/${organization.id}/edit`)
  }

  // Handle delete organization
  const handleDeleteOrganization = async (organizationId: string) => {
    if (!confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/organizations?organizationId=${organizationId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete organization")
      }

      await fetchOrganizations()
    } catch (error) {
      console.error("Error deleting organization:", error)
      alert("Failed to delete organization: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  // Handle view organization users
  const handleViewUsers = (organizationId: string) => {
    router.push(`/dashboard/organizations/${organizationId}/users`)
  }

  // Handle view organization settings
  const handleViewSettings = (organizationId: string) => {
    router.push(`/dashboard/organizations/${organizationId}/settings`)
  }

  // Handle view organization knowledge base
  const handleViewKnowledge = (organizationId: string) => {
    router.push(`/dashboard/organizations/${organizationId}/knowledge`)
  }

  // Fetch organizations when component mounts or filters change
  useEffect(() => {
    if (session?.user) {
      fetchOrganizations()
    }
  }, [session, searchTerm, selectedStatus, selectedPlan, fetchOrganizations])

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
      <PlatformAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PlatformAdminLayout>
    )
  }

  if (!session) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-500" />
      case "suspended":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      case "pro":
        return "bg-blue-100 text-blue-800"
      case "free":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organization Management</h1>
              <p className="mt-2 text-gray-600">
                Manage organizations and their settings
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={fetchOrganizations} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button className="flex items-center" onClick={handleAddOrganization}>
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h3 className="font-medium text-red-800">Error Loading Organizations</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalOrganizations}</div>
              <p className="text-xs text-muted-foreground">
                Registered organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.activeOrganizations}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.totalOrganizations > 0 
                  ? Math.round((statistics.activeOrganizations / statistics.totalOrganizations) * 100)
                  : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Across all organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enterprise Plans</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.enterpriseOrganizations}</div>
              <p className="text-xs text-muted-foreground">
                Premium customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Organizations</CardTitle>
            <CardDescription>
              Search and filter organizations by name, domain, status, or plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search organizations by name or domain..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading organizations...</span>
            </div>
          </div>
        )}

        {/* Organizations Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Card key={org.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Building className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <div className="flex items-center text-sm text-gray-500">
                          <Globe className="h-3 w-3 mr-1" />
                          {org.domain}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditOrganization(org)}
                        title="Edit Organization"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteOrganization(org.id)}
                        title="Delete Organization"
                        className="text-red-600 hover:text-red-700"
                        disabled={org.userCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="More Options">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Status and Plan */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(org.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(org.status)}`}>
                          {org.status}
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPlanBadgeColor(org.plan)}`}>
                        {org.plan}
                      </span>
                    </div>

                    {/* User Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900">{org.userCount}</div>
                        <div className="text-xs text-gray-500">Total Users</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900">{org.adminCount}</div>
                        <div className="text-xs text-gray-500">Admins</div>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Created: {new Date(org.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewUsers(org.id)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Users
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewKnowledge(org.id)}
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        Knowledge
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewSettings(org.id)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && organizations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedStatus !== "all" || selectedPlan !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first organization"
                }
              </p>
              <Button onClick={handleAddOrganization}>
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PlatformAdminLayout>
  )
}
