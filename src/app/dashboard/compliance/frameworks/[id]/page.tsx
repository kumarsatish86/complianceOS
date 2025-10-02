"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, 
  Edit, 
  Shield, 
  Calendar,
  AlertCircle,
  Loader2,
  Tag,
  Globe,
  Building,
  FileText,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface ComplianceFramework {
  id: string
  name: string
  version: string
  description: string
  effectiveDate: string | null
  industryTags: string[]
  certificationBody: string | null
  documentationUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  topicCount: number
  clauseCount: number
  organizationCount: number
  topics: Array<{
    id: string
    name: string
    description: string | null
    orderIndex: number
    components: Array<{
      id: string
      name: string
      description: string | null
      orderIndex: number
      clauses: Array<{
        id: string
        clauseId: string
        title: string
        description: string
        riskLevel: string
      }>
    }>
  }>
  organizationSelections: Array<{
    organization: {
      id: string
      name: string
      slug: string
    }
  }>
}

export default function ViewFrameworkPage() {
  const router = useRouter()
  const params = useParams()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, status } = useSession() as any
  
  const [framework, setFramework] = useState<ComplianceFramework | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set())

  const frameworkId = params.id as string

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

  // Fetch framework data
  useEffect(() => {
    const fetchFramework = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/compliance?frameworkId=${frameworkId}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch framework")
        }

        const frameworkData = await response.json()
        setFramework(frameworkData)
      } catch (error) {
        console.error("Error fetching framework:", error)
        router.push("/dashboard/compliance")
      } finally {
        setLoading(false)
      }
    }

    if (frameworkId && session?.user) {
      fetchFramework()
    }
  }, [frameworkId, session, router])

  const handleEditFramework = () => {
    router.push(`/dashboard/compliance/frameworks/${frameworkId}/edit`)
  }

  const handleAddTopic = () => {
    router.push(`/dashboard/compliance/frameworks/${frameworkId}/topics/add`)
  }

  const handleAddComponent = (topicId: string) => {
    router.push(`/dashboard/compliance/frameworks/${frameworkId}/topics/${topicId}/components/add`)
  }

  const handleAddClause = (componentId: string) => {
    router.push(`/dashboard/compliance/frameworks/${frameworkId}/components/${componentId}/clauses/add`)
  }

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics)
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId)
    } else {
      newExpanded.add(topicId)
    }
    setExpandedTopics(newExpanded)
  }

  const toggleComponent = (componentId: string) => {
    const newExpanded = new Set(expandedComponents)
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId)
    } else {
      newExpanded.add(componentId)
    }
    setExpandedComponents(newExpanded)
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

  if (status === "loading" || loading) {
    return (
      <PlatformAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading framework data...</span>
          </div>
        </div>
      </PlatformAdminLayout>
    )
  }

  if (!framework) {
    return (
      <PlatformAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Framework Not Found</h2>
            <p className="text-gray-600 mb-4">The framework you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
            <Button onClick={() => router.push("/dashboard/compliance")}>
              Back to Compliance Management
            </Button>
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
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{framework.name}</h1>
              <p className="text-gray-600">Version {framework.version} • Compliance Framework</p>
            </div>
          </div>
          <Button
            onClick={handleEditFramework}
            className="flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            {/* Edit Framework */}
          </Button>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Dashboard</span>
          <span>/</span>
          <button 
            onClick={() => router.push("/dashboard/compliance")}
            className="hover:text-primary"
          >
            Compliance Management
          </button>
          <span>/</span>
          <span className="text-gray-900">{framework.name}</span>
        </nav>

        {/* Framework Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Framework Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Framework Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{framework.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Effective Date</h4>
                    <p className="text-gray-600 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {framework.effectiveDate ? new Date(framework.effectiveDate).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Certification Body</h4>
                    <p className="text-gray-600">{framework.certificationBody || "Not specified"}</p>
                  </div>
                </div>

                {framework.documentationUrl && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Documentation</h4>
                    <a 
                      href={framework.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      View Documentation
                    </a>
                  </div>
                )}

                {framework.industryTags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Industry Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {framework.industryTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Topics</span>
                  <span className="font-semibold">{framework.topicCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Components</span>
                  <span className="font-semibold">{framework.topics.reduce((total, topic) => total + topic.components.length, 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Clauses</span>
                  <span className="font-semibold">{framework.clauseCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Organizations</span>
                  <span className="font-semibold">{framework.organizationCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    framework.isActive 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {framework.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Organizations */}
            {framework.organizationSelections.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Organizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {framework.organizationSelections.map((selection) => (
                      <div key={selection.organization.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{selection.organization.name}</span>
                        <span className="text-sm text-gray-500">{selection.organization.slug}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Framework Structure */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Framework Structure
                </CardTitle>
                <CardDescription>
                  Topics, components, and clauses hierarchy
                </CardDescription>
              </div>
              <Button
                onClick={handleAddTopic}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {framework.topics.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No topics defined</h3>
                <p className="text-gray-600 mb-4">Start building your framework structure by adding topics.</p>
                <Button onClick={handleAddTopic}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Topic
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {framework.topics.map((topic) => (
                  <div key={topic.id} className="border border-gray-200 rounded-lg">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleTopic(topic.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {expandedTopics.has(topic.id) ? (
                            <ChevronDown className="h-5 w-5 text-gray-400 mr-2" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />
                          )}
                          <h3 className="text-lg font-semibold text-gray-900">{topic.name}</h3>
                          <span className="ml-2 text-sm text-gray-500">
                            ({topic.components.length} components)
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddComponent(topic.id)
                          }}
                          className="flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Component
                        </Button>
                      </div>
                      {topic.description && (
                        <p className="text-gray-600 mt-2 ml-7">{topic.description}</p>
                      )}
                    </div>

                    {expandedTopics.has(topic.id) && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="space-y-3">
                          {topic.components.map((component) => (
                            <div key={component.id} className="bg-white border border-gray-200 rounded-lg">
                              <div 
                                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleComponent(component.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    {expandedComponents.has(component.id) ? (
                                      <ChevronDown className="h-4 w-4 text-gray-400 mr-2" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                                    )}
                                    <h4 className="font-medium text-gray-900">{component.name}</h4>
                                    <span className="ml-2 text-sm text-gray-500">
                                      ({component.clauses.length} clauses)
                                    </span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleAddClause(component.id)
                                    }}
                                    className="flex items-center"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Clause
                                  </Button>
                                </div>
                                {component.description && (
                                  <p className="text-gray-600 mt-1 ml-6 text-sm">{component.description}</p>
                                )}
                              </div>

                              {expandedComponents.has(component.id) && (
                                <div className="border-t border-gray-200 p-3 bg-gray-50">
                                  <div className="space-y-2">
                                    {component.clauses.map((clause) => (
                                      <div key={clause.id} className="bg-white border border-gray-200 rounded p-3">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                              <span className="font-mono text-sm font-medium text-gray-600">
                                                {clause.clauseId}
                                              </span>
                                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(clause.riskLevel)}`}>
                                                {clause.riskLevel}
                                              </span>
                                            </div>
                                            <h5 className="font-medium text-gray-900 mb-1">{clause.title}</h5>
                                            <p className="text-sm text-gray-600">{clause.description}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
