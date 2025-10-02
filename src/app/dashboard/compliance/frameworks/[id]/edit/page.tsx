"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, 
  Save, 
  Shield, 
  Globe, 
  Calendar,
  AlertCircle,
  Loader2,
  Tag,
  Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface FrameworkFormData {
  name: string
  version: string
  description: string
  effectiveDate: string
  industryTags: string[]
  certificationBody: string
  documentationUrl: string
  isActive: boolean
}

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
}

const commonIndustryTags = [
  "financial", "healthcare", "technology", "government", "education",
  "retail", "manufacturing", "energy", "telecommunications", "consulting"
]

const commonCertificationBodies = [
  "BSI", "AICPA", "ISO", "PCI Security Standards Council", "NIST",
  "SOC", "GDPR", "HIPAA", "FedRAMP", "FISMA"
]

export default function EditFrameworkPage() {
  const router = useRouter()
  const params = useParams()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, status } = useSession() as any
  
  const [framework, setFramework] = useState<ComplianceFramework | null>(null)
  const [formData, setFormData] = useState<FrameworkFormData>({
    name: "",
    version: "",
    description: "",
    effectiveDate: "",
    industryTags: [],
    certificationBody: "",
    documentationUrl: "",
    isActive: true
  })
  const [errors, setErrors] = useState<Partial<FrameworkFormData>>({})
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [newTag, setNewTag] = useState("")

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
        setInitialLoading(true)
        const response = await fetch(`/api/admin/compliance?frameworkId=${frameworkId}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch framework")
        }

        const frameworkData = await response.json()
        setFramework(frameworkData)
        setFormData({
          name: frameworkData.name || "",
          version: frameworkData.version || "",
          description: frameworkData.description || "",
          effectiveDate: frameworkData.effectiveDate ? frameworkData.effectiveDate.split('T')[0] : "",
          industryTags: frameworkData.industryTags || [],
          certificationBody: frameworkData.certificationBody || "",
          documentationUrl: frameworkData.documentationUrl || "",
          isActive: frameworkData.isActive !== undefined ? frameworkData.isActive : true
        })
      } catch (error) {
        console.error("Error fetching framework:", error)
        router.push("/dashboard/compliance")
      } finally {
        setInitialLoading(false)
      }
    }

    if (frameworkId && session?.user) {
      fetchFramework()
    }
  }, [frameworkId, session, router])

  const validateForm = (): boolean => {
    const newErrors: Partial<FrameworkFormData> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Framework name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Framework name must be at least 2 characters"
    }

    // Version validation
    if (!formData.version.trim()) {
      newErrors.version = "Version is required"
    } else if (formData.version.trim().length < 1) {
      newErrors.version = "Version must be at least 1 character"
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    }

    // Effective date validation
    if (formData.effectiveDate && new Date(formData.effectiveDate) < new Date()) {
      newErrors.effectiveDate = "Effective date cannot be in the past"
    }

    // Documentation URL validation
    if (formData.documentationUrl && !isValidUrl(formData.documentationUrl)) {
      newErrors.documentationUrl = "Please enter a valid URL"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch("/api/admin/compliance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frameworkId: frameworkId,
          name: formData.name.trim(),
          version: formData.version.trim(),
          description: formData.description.trim(),
          effectiveDate: formData.effectiveDate || null,
          industryTags: formData.industryTags,
          certificationBody: formData.certificationBody.trim() || null,
          documentationUrl: formData.documentationUrl.trim() || null,
          isActive: formData.isActive
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update framework")
      }

      // Redirect back to Redirect back to compliance management page
      router.push("/dashboard/compliance")
    } catch (error) {
      console.error("Error updating framework:", error)
      alert("Failed to update framework: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this framework? This action cannot be undone.")) {
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/compliance?frameworkId=${frameworkId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete framework")
      }

      // Redirect back to Redirect back to compliance management page
      router.push("/dashboard/compliance")
    } catch (error) {
      console.error("Error deleting framework:", error)
      alert("Failed to delete framework: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FrameworkFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.industryTags.includes(newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        industryTags: [...prev.industryTags, newTag.trim().toLowerCase()]
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      industryTags: prev.industryTags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleAddCommonTag = (tag: string) => {
    if (!formData.industryTags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        industryTags: [...prev.industryTags, tag]
      }))
    }
  }

  if (status === "loading" || initialLoading) {
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Compliance Framework</h1>
              <p className="text-gray-600">Update framework information and settings</p>
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
          <span className="text-gray-900">Edit Framework</span>
        </nav>

        {/* Framework Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h3 className="font-medium text-blue-800">Framework Details</h3>
                <p className="text-sm text-blue-700">
                  {framework.topicCount} topics • {framework.clauseCount} clauses • {framework.organizationCount} organizations • Created {new Date(framework.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                framework.isActive 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                {framework.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                {/* Update basic information about the compliance framework */}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Framework Name</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter framework name (e.g., ISO 27001, PCI DSS)"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`pl-10 ${errors.name ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                </div>
                {errors.name && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Version Field */}
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  type="text"
                  placeholder="Enter version (e.g., 2022, 3.2.1)"
                  value={formData.version}
                  onChange={(e) => handleInputChange("version", e.target.value)}
                  className={errors.version ? "border-red-500" : ""}
                  disabled={loading}
                />
                {errors.version && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.version}
                  </div>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Enter detailed description of the framework"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.description ? "border-red-500" : ""}`}
                  rows={4}
                  disabled={loading}
                />
                {errors.description && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.description}
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <select
                  id="isActive"
                  value={formData.isActive ? "active" : "inactive"}
                  onChange={(e) => handleInputChange("isActive", e.target.value === "active")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={loading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Dates and Certification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Dates and Certification
              </CardTitle>
              <CardDescription>
                {/* Update effective dates and certification information */}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Effective Date Field */}
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => handleInputChange("effectiveDate", e.target.value)}
                    className={`pl-10 ${errors.effectiveDate ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                </div>
                {errors.effectiveDate && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.effectiveDate}
                  </div>
                )}
              </div>

              {/* Certification Body Field */}
              <div className="space-y-2">
                <Label htmlFor="certificationBody">Certification Body</Label>
                <div className="space-y-2">
                  <Input
                    id="certificationBody"
                    type="text"
                    placeholder="Enter certification body (e.g., BSI, AICPA)"
                    value={formData.certificationBody}
                    onChange={(e) => handleInputChange("certificationBody", e.target.value)}
                    disabled={loading}
                  />
                  <div className="flex flex-wrap gap-2">
                    {commonCertificationBodies.map((body) => (
                      <button
                        key={body}
                        type="button"
                        onClick={() => handleInputChange("certificationBody", body)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        disabled={loading}
                      >
                        {body}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Documentation URL Field */}
              <div className="space-y-2">
                <Label htmlFor="documentationUrl">Documentation URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="documentationUrl"
                    type="url"
                    placeholder="Enter documentation URL (optional)"
                    value={formData.documentationUrl}
                    onChange={(e) => handleInputChange("documentationUrl", e.target.value)}
                    className={`pl-10 ${errors.documentationUrl ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                </div>
                {errors.documentationUrl && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.documentationUrl}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Industry Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Industry Tags
              </CardTitle>
              <CardDescription>
                {/* Update industry tags to categorize this framework */}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Tag */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter industry tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={loading || !newTag.trim()}
                >
                  Add Tag
                </Button>
              </div>

              {/* Common Tags */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Common Industry Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {commonIndustryTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddCommonTag(tag)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        formData.industryTags.includes(tag)
                          ? "bg-blue-100 text-blue-800 cursor-not-allowed"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                      disabled={loading || formData.industryTags.includes(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Tags */}
              {formData.industryTags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Selected Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.industryTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          disabled={loading}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || framework.organizationCount > 0}
              className="flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {/* Delete Framework */}
            </Button>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    {/* Update Framework */}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </PlatformAdminLayout>
  )
}
