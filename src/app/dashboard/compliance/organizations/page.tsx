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
  Building,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Settings,
  ChevronRight,
  ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface ComplianceFramework {
  id: string
  name: string
  version: string
  description: string
  industryTags: string[]
  isActive: boolean
}

interface ComplianceSelection {
  id: string
  frameworkId: string
  clauseId: string | null
  isEnabled: boolean
  internalDeadline: string | null
  riskTolerance: string
  internalOwner: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  framework: ComplianceFramework
  clause: {
    id: string
    clauseId: string
    title: string
    description: string
    riskLevel: string
    component: {
      name: string
      topic: {
        name: string
      }
    }
  } | null
}

interface FrameworkGroup {
  framework: ComplianceFramework
  selections: ComplianceSelection[]
}

interface ComplianceStatistics {
  totalSelections: number
  enabledSelections: number
  disabledSelections: number
  frameworksCount: number
}

export default function OrganizationCompliancePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [frameworkGroups, setFrameworkGroups] = useState<FrameworkGroup[]>([])
  const [statistics, setStatistics] = useState<ComplianceStatistics>({
    totalSelections: 0,
    enabledSelections: 0,
    disabledSelections: 0,
    frameworksCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [expandedFrameworks, setExpandedFrameworks] = useState<Set<string>>(new Set())

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
      
      const response = await fetch("/api/admin/compliance/organizations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch compliance data")
      }

      const data = await response.json()
      setFrameworkGroups(data.selections || [])
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
    router.push("/dashboard/compliance/organizations/add")
  }

  const handleManageFramework = (frameworkId: string) => {
    router.push(`/dashboard/compliance/organizations/${frameworkId}`)
  }

  const handleToggleSelection = async (selectionId: string, isEnabled: boolean) => {
    try {
      const response = await fetch("/api/admin/compliance/organizations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectionId,
          isEnabled: !isEnabled
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update selection")
      }

      // Refresh data
      fetchComplianceData()
    } catch (error) {
      console.error("Error updating selection:", error)
      alert("Failed to update selection: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const handleDeleteSelection = async (selectionId: string) => {
    if (!confirm("Are you sure you want to remove this compliance selection?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/compliance/organizations?selectionId=${selectionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete selection")
      }

      // Refresh data
      fetchComplianceData()
    } catch (error) {
      console.error("Error deleting selection:", error)
      alert("Failed to delete selection: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const toggleFramework = (frameworkId: string) => {
    const newExpanded = new Set(expandedFrameworks)
    if (newExpanded.has(frameworkId)) {
      newExpanded.delete(frameworkId)
    } else {
      newExpanded.add(frameworkId)
    }
    setExpandedFrameworks(newExpanded)
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return "bg-green-100 text-green-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "CRITICAL":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRiskToleranceColor = (riskTolerance: string) => {
    switch (riskTolerance) {
      case "LOW":
        return "bg-blue-100 text-blue-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredFrameworkGroups = frameworkGroups.filter(group => {
    const matchesSearch = group.framework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.framework.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.selections.some(selection => 
                           selection.clause?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           selection.clause?.clauseId.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "enabled" && group.selections.some(s => s.isEnabled)) ||
                         (filterStatus === "disabled" && group.selections.every(s => !s.isEnabled))
    
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
            <h1 className="text-2xl font-bold text-gray-900">Organization Compliance Management</h1>
            <p className="text-gray-600">Manage compliance frameworks and requirements for organizations</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Frameworks</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.frameworksCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Enabled</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.enabledSelections}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Disabled</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.disabledSelections}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalSelections}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search frameworks and clauses..."
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
                  <option value="enabled">Enabled Only</option>
                  <option value="disabled">Disabled Only</option>
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

        {/* Framework Groups */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span>Loading compliance data...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : filteredFrameworkGroups.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No compliance frameworks found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterStatus !== "all" 
                      ? "No frameworks match your search criteria." 
                      : "Get started by adding compliance frameworks for organizations."}
                  </p>
                  {!searchTerm && filterStatus === "all" && (
                    <Button onClick={handleAddFramework}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Framework
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredFrameworkGroups.map((group) => (
              <Card key={group.framework.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleFramework(group.framework.id)}
                        className="flex items-center space-x-2 hover:text-primary transition-colors"
                      >
                        {expandedFrameworks.has(group.framework.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <Shield className="h-5 w-5" />
                        <div className="text-left">
                          <CardTitle className="text-lg">{group.framework.name}</CardTitle>
                          <CardDescription>
                            v{group.framework.version} • {group.selections.length} selections
                          </CardDescription>
                        </div>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        group.framework.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {group.framework.isActive ? "Active" : "Inactive"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageFramework(group.framework.id)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedFrameworks.has(group.framework.id) && (
                  <CardContent>
                    <div className="space-y-4">
                      {/* Framework Description */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{group.framework.description}</p>
                        {group.framework.industryTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {group.framework.industryTags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selections */}
                      {group.selections.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No compliance selections for this framework
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {group.selections.map((selection) => (
                            <div
                              key={selection.id}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-mono text-sm font-medium text-gray-600">
                                    {selection.clause?.clauseId || "Framework Level"}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(selection.clause?.riskLevel || "MEDIUM")}`}>
                                    {selection.clause?.riskLevel || "MEDIUM"}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskToleranceColor(selection.riskTolerance)}`}>
                                    {selection.riskTolerance} Tolerance
                                  </span>
                                </div>
                                <h4 className="font-medium text-gray-900">
                                  {selection.clause?.title || "Framework Selection"}
                                </h4>
                                {selection.clause && (
                                  <p className="text-sm text-gray-600">
                                    {selection.clause.component.topic.name} → {selection.clause.component.name}
                                  </p>
                                )}
                                {selection.internalDeadline && (
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Deadline: {new Date(selection.internalDeadline).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleSelection(selection.id, selection.isEnabled)}
                                  className={selection.isEnabled ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                                >
                                  {selection.isEnabled ? (
                                    <>
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Disable
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Enable
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteSelection(selection.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </PlatformAdminLayout>
  )
}
