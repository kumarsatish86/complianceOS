"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, 
  Save, 
  Shield, 
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface ComplianceFramework {
  id: string
  name: string
  version: string
  description: string
  industryTags: string[]
  isActive: boolean
  topics: Array<{
    id: string
    name: string
    description: string | null
    components: Array<{
      id: string
      name: string
      description: string | null
      clauses: Array<{
        id: string
        clauseId: string
        title: string
        description: string
        riskLevel: string
      }>
    }>
  }>
}

interface SelectedClause {
  clauseId: string
  isSelected: boolean
  internalDeadline?: string
  riskTolerance: string
  internalOwner?: string
  notes?: string
}

export default function AddFrameworkSelectionPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, status } = useSession() as any
  const router = useRouter()
  
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([])
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null)
  const [selectedClauses, setSelectedClauses] = useState<Map<string, SelectedClause>>(new Map())
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set())

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

  // Fetch available frameworks
  useEffect(() => {
    const fetchFrameworks = async () => {
      try {
        setInitialLoading(true)
        const response = await fetch("/api/admin/compliance")
        
        if (!response.ok) {
          throw new Error("Failed to fetch frameworks")
        }

        const data = await response.json()
        setFrameworks(data.frameworks || [])
      } catch (error) {
        console.error("Error fetching frameworks:", error)
        router.push("/dashboard/compliance/organizations")
      } finally {
        setInitialLoading(false)
      }
    }

    if (session?.user) {
      fetchFrameworks()
    }
  }, [session, router])

  const handleFrameworkSelect = (framework: ComplianceFramework) => {
    setSelectedFramework(framework)
    setExpandedTopics(new Set())
    setExpandedComponents(new Set())
    setSelectedClauses(new Map())
  }

  const handleClauseToggle = (clauseId: string, isSelected: boolean) => {
    const newSelectedClauses = new Map(selectedClauses)
    
    if (isSelected) {
      newSelectedClauses.set(clauseId, {
        clauseId,
        isSelected: true,
        riskTolerance: "MEDIUM"
      })
    } else {
      newSelectedClauses.delete(clauseId)
    }
    
    setSelectedClauses(newSelectedClauses)
  }

  const handleClauseUpdate = (clauseId: string, field: keyof SelectedClause, value: string) => {
    const newSelectedClauses = new Map(selectedClauses)
    const clause = newSelectedClauses.get(clauseId)
    
    if (clause) {
      newSelectedClauses.set(clauseId, {
        ...clause,
        [field]: value
      })
      setSelectedClauses(newSelectedClauses)
    }
  }

  const handleSubmit = async () => {
    if (!selectedFramework || selectedClauses.size === 0) {
      alert("Please select a framework and at least one clause")
      return
    }

    try {
      setLoading(true)
      
      const clauseIds = Array.from(selectedClauses.keys())
      const selections = Array.from(selectedClauses.values())
      
      const response = await fetch("/api/admin/compliance/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: "default", // This would be dynamic in a real implementation
          frameworkId: selectedFramework.id,
          clauseIds: clauseIds,
          selections: selections
        })
      })

      if (!response.ok) {
        throw new Error("Failed to create compliance selections")
      }

      // Redirect back to Redirect back to organizations page
      router.push("/dashboard/compliance/organizations")
    } catch (error) {
      console.error("Error creating compliance selections:", error)
      alert("Failed to create compliance selections: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
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

  const filteredFrameworks = frameworks.filter(framework =>
    framework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    framework.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    framework.industryTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (status === "loading" || initialLoading) {
    return (
      <PlatformAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
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
              <h1 className="text-2xl font-bold text-gray-900">Add Compliance Framework</h1>
              <p className="text-gray-600">Select a framework and configure compliance requirements</p>
            </div>
          </div>
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
          <button 
            onClick={() => router.push("/dashboard/compliance/organizations")}
            className="hover:text-primary"
          >
            Organizations
          </button>
          <span>/</span>
          <span className="text-gray-900">Add Framework</span>
        </nav>

        {!selectedFramework ? (
          /* Framework Selection */
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search frameworks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Available Frameworks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFrameworks.map((framework) => (
                <Card 
                  key={framework.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleFrameworkSelect(framework)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      {framework.name}
                    </CardTitle>
                    <CardDescription>
                      Version {framework.version}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{framework.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {framework.industryTags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {framework.industryTags.length > 2 && (
                          <span className="text-xs text-gray-500">+{framework.industryTags.length - 2}</span>
                        )}
                      </div>
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
              ))}
            </div>
          </div>
        ) : (
          /* Clause Selection */
          <div className="space-y-6">
            {/* Selected Framework Info */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-800">{selectedFramework.name}</h3>
                      <p className="text-sm text-blue-700">Version {selectedFramework.version}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFramework(null)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    Change Framework
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Clause Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Compliance Clauses</CardTitle>
                <CardDescription>
                  {/* Choose the specific clauses that apply to your organization */}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedFramework.topics.map((topic) => (
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
                              ({topic.components.reduce((total, comp) => total + comp.clauses.length, 0)} clauses)
                            </span>
                          </div>
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
                                  </div>
                                  {component.description && (
                                    <p className="text-gray-600 mt-1 ml-6 text-sm">{component.description}</p>
                                  )}
                                </div>

                                {expandedComponents.has(component.id) && (
                                  <div className="border-t border-gray-200 p-3 bg-gray-50">
                                    <div className="space-y-2">
                                      {component.clauses.map((clause) => {
                                        const isSelected = selectedClauses.has(clause.id)
                                        const clauseData = selectedClauses.get(clause.id)
                                        
                                        return (
                                          <div key={clause.id} className="bg-white border border-gray-200 rounded p-3">
                                            <div className="flex items-start space-x-3">
                                              <button
                                                onClick={() => handleClauseToggle(clause.id, !isSelected)}
                                                className={`mt-1 p-1 rounded ${
                                                  isSelected 
                                                    ? "text-green-600 hover:text-green-700" 
                                                    : "text-gray-400 hover:text-gray-600"
                                                }`}
                                              >
                                                {isSelected ? (
                                                  <CheckCircle className="h-5 w-5" />
                                                ) : (
                                                  <XCircle className="h-5 w-5" />
                                                )}
                                              </button>
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
                                                <p className="text-sm text-gray-600 mb-2">{clause.description}</p>
                                                
                                                {isSelected && (
                                                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                      <div>
                                                        <Label htmlFor={`deadline-${clause.id}`} className="text-xs">Internal Deadline</Label>
                                                        <Input
                                                          id={`deadline-${clause.id}`}
                                                          type="date"
                                                          value={clauseData?.internalDeadline || ""}
                                                          onChange={(e) => handleClauseUpdate(clause.id, "internalDeadline", e.target.value)}
                                                          className="text-sm"
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label htmlFor={`tolerance-${clause.id}`} className="text-xs">Risk Tolerance</Label>
                                                        <select
                                                          id={`tolerance-${clause.id}`}
                                                          value={clauseData?.riskTolerance || "MEDIUM"}
                                                          onChange={(e) => handleClauseUpdate(clause.id, "riskTolerance", e.target.value)}
                                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                                        >
                                                          <option value="LOW">Low</option>
                                                          <option value="MEDIUM">Medium</option>
                                                          <option value="HIGH">High</option>
                                                        </select>
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <Label htmlFor={`owner-${clause.id}`} className="text-xs">Internal Owner</Label>
                                                      <Input
                                                        id={`owner-${clause.id}`}
                                                        type="text"
                                                        placeholder="Enter owner name or email"
                                                        value={clauseData?.internalOwner || ""}
                                                        onChange={(e) => handleClauseUpdate(clause.id, "internalOwner", e.target.value)}
                                                        className="text-sm"
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label htmlFor={`notes-${clause.id}`} className="text-xs">Notes</Label>
                                                      <textarea
                                                        id={`notes-${clause.id}`}
                                                        placeholder="Enter any additional notes"
                                                        value={clauseData?.notes || ""}
                                                        onChange={(e) => handleClauseUpdate(clause.id, "notes", e.target.value)}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                                        rows={2}
                                                      />
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
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
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <div className="text-sm text-gray-600">
                {selectedClauses.size} clause{selectedClauses.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedFramework(null)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || selectedClauses.size === 0}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      {/* Create Selections */}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PlatformAdminLayout>
  )
}
