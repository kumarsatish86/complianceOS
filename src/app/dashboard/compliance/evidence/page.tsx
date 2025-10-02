"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Search,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  Trash2,
  Tag,
  User,
  Filter,
  Calendar } from "lucide-react"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface EvidenceSubmission {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  description: string | null
  tags: string[]
  version: number
  isLatest: boolean
  submittedBy: string
  submittedAt: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewStatus: string
  reviewNotes: string | null
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
        framework: {
          name: string
          version: string
        }
      }
    }
  }
}

interface EvidenceGroup {
  clause: EvidenceSubmission["clause"]
  evidence: EvidenceSubmission[]
}

interface EvidenceStatistics {
  totalEvidence: number
  pendingEvidence: number
  approvedEvidence: number
  rejectedEvidence: number
}

export default function EvidenceManagementPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, status } = useSession() as any
  const router = useRouter()
  
  const [evidenceGroups, setEvidenceGroups] = useState<EvidenceGroup[]>([])
  const [statistics, setStatistics] = useState<EvidenceStatistics>({
    totalEvidence: 0,
    pendingEvidence: 0,
    approvedEvidence: 0,
    rejectedEvidence: 0
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

    if (session.user?.platformRole !== "SUPER_ADMIN" && session.user?.platformRole !== "PLATFORM_ADMIN") {
      router.push("/dashboard")
      return
    }
  }, [session, status, router])

  const fetchEvidenceData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/admin/compliance/evidence", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch evidence data")
      }

      const data = await response.json()
      setEvidenceGroups(data.evidenceGroups || [])
      setStatistics(data.statistics || statistics)
    } catch (error) {
      console.error("Error fetching evidence data:", error)
      setError("Failed to load evidence data")
    } finally {
      setLoading(false)
    }
  }, [statistics])

  useEffect(() => {
    if (session?.user) {
      fetchEvidenceData()
    }
  }, [session, fetchEvidenceData])

  const handleUploadEvidence = () => {
    router.push("/dashboard/compliance/evidence/upload")
  }

  const handleReviewEvidence = async (evidenceId: string, reviewStatus: string, reviewNotes?: string) => {
    try {
      const response = await fetch("/api/admin/compliance/evidence", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evidenceId,
          reviewStatus,
          reviewNotes
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update evidence review")
      }

      // Refresh data
      fetchEvidenceData()
    } catch (error) {
      console.error("Error updating evidence review:", error)
      alert("Failed to update evidence review: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm("Are you sure you want to delete this evidence submission?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/compliance/evidence?evidenceId=${evidenceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete evidence")
      }

      // Refresh data
      fetchEvidenceData()
    } catch (error) {
      console.error("Error deleting evidence:", error)
      alert("Failed to delete evidence: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "REQUIRES_REVISION":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const filteredEvidenceGroups = evidenceGroups.filter(group => {
    const matchesSearch = group.clause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.clause.clauseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.evidence.some(evidence => 
                           evidence.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           evidence.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           evidence.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                         )
    
    const matchesStatus = filterStatus === "all" || 
                         group.evidence.some(evidence => evidence.reviewStatus === filterStatus.toUpperCase())
    
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
            <h1 className="text-2xl font-bold text-gray-900">Evidence Management</h1>
            <p className="text-gray-600">Manage compliance evidence submissions and reviews</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => fetchEvidenceData()}
              disabled={loading}
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleUploadEvidence}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Evidence
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Evidence</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalEvidence}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.pendingEvidence}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.approvedEvidence}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.rejectedEvidence}</p>
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
                    placeholder="Search evidence and clauses..."
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="requires_revision">Requires Revision</option>
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

        {/* Evidence Groups */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span>Loading evidence data...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : filteredEvidenceGroups.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No evidence submissions found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterStatus !== "all" 
                      ? "No evidence matches your search criteria." 
                      : "Get started by uploading compliance evidence."}
                  </p>
                  {!searchTerm && filterStatus === "all" && (
                    <Button onClick={handleUploadEvidence}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Evidence
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredEvidenceGroups.map((group) => (
              <Card key={group.clause.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-medium text-gray-600">
                          {group.clause.clauseId}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(group.clause.riskLevel)}`}>
                          {group.clause.riskLevel}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {group.clause.title} • {group.evidence.length} submission{group.evidence.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <div className="text-sm text-gray-500">
                      {group.clause.component.topic.framework.name} v{group.clause.component.topic.framework.version}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {group.evidence.map((evidence) => (
                      <div
                        key={evidence.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900 truncate">
                                {evidence.fileName}
                              </h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReviewStatusColor(evidence.reviewStatus)}`}>
                                {evidence.reviewStatus}
                              </span>
                              {evidence.isLatest && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  Latest
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                v{evidence.version}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{formatFileSize(evidence.fileSize)}</span>
                              <span>{evidence.mimeType}</span>
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(evidence.submittedAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {evidence.submittedBy}
                              </span>
                            </div>
                            {evidence.description && (
                              <p className="text-sm text-gray-600 mt-1">{evidence.description}</p>
                            )}
                            {evidence.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {evidence.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {evidence.reviewNotes && (
                              <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
                                <strong>Review Notes:</strong> {evidence.reviewNotes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(evidence.filePath, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(evidence.filePath, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          {evidence.reviewStatus === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReviewEvidence(evidence.id, "APPROVED")}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const notes = prompt("Enter rejection reason:")
                                  if (notes) {
                                    handleReviewEvidence(evidence.id, "REJECTED", notes)
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEvidence(evidence.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PlatformAdminLayout>
  )
}
