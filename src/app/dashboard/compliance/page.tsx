"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

// Type assertion for session user with platformRole
type SessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  platformRole?: string
}
import { Plus, 
  Search, 
  Filter, 
  Download,
  Shield,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  ClipboardCheck,
  Building,
  Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface ComplianceFramework {
  id: string
  name: string
  version: string
  description: string
  effectiveDate: string
  industryTags: string[]
  certificationBody: string
  documentationUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  topicCount: number
  clauseCount: number
  organizationCount: number
}

interface ComplianceStatistics {
  totalFrameworks: number
  activeFrameworks: number
  totalOrganizations: number
  compliantOrganizations: number
  pendingAssessments: number
  overdueItems: number
}

export default function ComplianceManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([])
  const [statistics, setStatistics] = useState<ComplianceStatistics>({
    totalFrameworks: 0,
    activeFrameworks: 0,
    totalOrganizations: 0,
    compliantOrganizations: 0,
    pendingAssessments: 0,
    overdueItems: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if ((session.user as SessionUser)?.platformRole !== "SUPER_ADMIN" && (session.user as SessionUser)?.platformRole !== "PLATFORM_ADMIN") {
      router.push("/dashboard")
      return
    }
  }, [session, status, router])

  const fetchComplianceData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/admin/compliance", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch compliance data")
      }

      const data = await response.json()
      setFrameworks(data.frameworks || [])
      setStatistics(data.statistics || statistics)
    } catch (error) {
      console.error("Error fetching compliance data:", error)
      setError("Failed to load compliance data")
    } finally {
      setLoading(false)
    }
  }, [statistics])

  useEffect(() => {
    if (session?.user) {
      fetchComplianceData()
    }
  }, [session, fetchComplianceData])

  const handleAddFramework = () => {
    router.push("/dashboard/compliance/frameworks/add")
  }

  const handleEditFramework = (frameworkId: string) => {
    router.push(`/dashboard/compliance/frameworks/${frameworkId}/edit`)
  }

  const handleViewFramework = (frameworkId: string) => {
    router.push(`/dashboard/compliance/frameworks/${frameworkId}`)
  }

  const handleManageOrganizations = () => {
    router.push("/dashboard/compliance/organizations")
  }

  const handleManageSettings = () => {
    router.push("/dashboard/compliance/settings")
  }

  const filteredFrameworks = frameworks.filter(framework => {
    const matchesSearch = framework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         framework.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         framework.industryTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && framework.isActive) ||
                         (filterStatus === "inactive" && !framework.isActive)
    
    return matchesSearch && matchesStatus
  })

  if (status === "loading") {
    return (
      <PlatformAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </PlatformAdminLayout>
    )
  }

  return (
    <PlatformAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Management</h1>
            <p className="text-gray-600">Manage compliance frameworks, requirements, and organizational compliance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => fetchComplianceData()}
              disabled={loading}
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleAddFramework}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Framework
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Frameworks</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalFrameworks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Frameworks</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.activeFrameworks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Organizations</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalOrganizations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Compliant</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.compliantOrganizations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.pendingAssessments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.overdueItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardCheck className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common compliance management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={handleAddFramework}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Plus className="h-6 w-6" />
                <span>Add Framework</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleManageOrganizations}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Building className="h-6 w-6" />
                <span>Manage Organizations</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleManageSettings}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Settings className="h-6 w-6" />
                <span>Compliance Settings</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Download className="h-6 w-6" />
                <span>Export Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search frameworks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Frameworks List */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Frameworks</CardTitle>
            <CardDescription>
              {/* Manage compliance frameworks and their requirements */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span>Loading frameworks...</span>
                </div>
              </div>
            ) : filteredFrameworks.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No frameworks found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== "all" 
                    ? "No frameworks match your search criteria." 
                    : "Get started by adding your first compliance framework."}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <Button onClick={handleAddFramework}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Framework
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFrameworks.map((framework) => (
                  <div
                    key={framework.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {framework.name}
                          </h3>
                          <span className="text-sm text-gray-500">v{framework.version}</span>
                          {framework.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{framework.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{framework.topicCount} topics</span>
                          <span>{framework.clauseCount} clauses</span>
                          <span>{framework.organizationCount} organizations</span>
                          {framework.certificationBody && (
                            <span>Certified by {framework.certificationBody}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          {framework.industryTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewFramework(framework.id)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditFramework(framework.id)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PlatformAdminLayout>
  )
}
