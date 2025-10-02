"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, 
  Upload, 
  FileText, 
  AlertCircle,
  Loader2,
  X,
  Plus,
  Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface ComplianceClause {
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
        id: string
        name: string
        version: string
      }
    }
  }
}

interface UploadFormData {
  clauseId: string
  description: string
  tags: string[]
  file: File | null
}

interface ValidationErrors {
  clauseId?: string
  description?: string
  file?: string
}

export default function UploadEvidencePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, status } = useSession() as any
  const router = useRouter()
  
  const [clauses, setClauses] = useState<ComplianceClause[]>([])
  const [formData, setFormData] = useState<UploadFormData>({
    clauseId: "",
    description: "",
    tags: [],
    file: null
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [newTag, setNewTag] = useState("")
  const [dragActive, setDragActive] = useState(false)

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

  // Fetch available clauses
  useEffect(() => {
    const fetchClauses = async () => {
      try {
        setInitialLoading(true)
        const response = await fetch("/api/admin/compliance/organizations")
        
        if (!response.ok) {
          throw new Error("Failed to fetch clauses")
        }

        const data = await response.json()
        // Flatten all clauses from all framework groups
        const allClauses: ComplianceClause[] = []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.selections.forEach((group: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          group.selections.forEach((selection: any) => {
            if (selection.clause) {
              allClauses.push(selection.clause)
            }
          })
        })
        setClauses(allClauses)
      } catch (error) {
        console.error("Error fetching clauses:", error)
        router.push("/dashboard/compliance/evidence")
      } finally {
        setInitialLoading(false)
      }
    }

    if (session?.user) {
      fetchClauses()
    }
  }, [session, router])

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Clause validation
    if (!formData.clauseId) {
      newErrors.clauseId = "Please select a compliance clause"
    }

    // File validation
    if (!formData.file) {
      newErrors.file = "Please select a file to upload"
    } else if (formData.file.size > 50 * 1024 * 1024) { // 50MB limit
      newErrors.file = "File size must be less than 50MB"
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      // Create FormData for file upload
      const uploadData = new FormData()
      uploadData.append("file", formData.file!)
      uploadData.append("clauseId", formData.clauseId)
      uploadData.append("description", formData.description.trim())
      uploadData.append("tags", JSON.stringify(formData.tags))
      uploadData.append("organizationId", "default") // This would be dynamic in a real implementation

      const response = await fetch("/api/admin/compliance/evidence", {
        method: "POST",
        body: uploadData
      })

      if (!response.ok) {
        throw new Error("Failed to upload evidence")
      }

      // Redirect back to evidence management page
      router.push("/dashboard/compliance/evidence")
    } catch (error) {
      console.error("Error uploading evidence:", error)
      alert("Failed to upload evidence: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UploadFormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (field === 'clauseId' && errors.clauseId) {
      setErrors(prev => ({ ...prev, clauseId: undefined }))
    } else if (field === 'description' && errors.description) {
      setErrors(prev => ({ ...prev, description: undefined }))
    } else if (field === 'file' && errors.file) {
      setErrors(prev => ({ ...prev, file: undefined }))
    }
  }

  const handleFileSelect = (file: File) => {
    handleInputChange("file", file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
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
              <h1 className="text-2xl font-bold text-gray-900">Upload Evidence</h1>
              <p className="text-gray-600">Upload compliance evidence for review</p>
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
            onClick={() => router.push("/dashboard/compliance/evidence")}
            className="hover:text-primary"
          >
            Evidence Management
          </button>
          <span>/</span>
          <span className="text-gray-900">Upload Evidence</span>
        </nav>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Clause Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Compliance Clause
              </CardTitle>
              <CardDescription>
                {/* Select the compliance clause this evidence relates to */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="clauseId">Clause</Label>
                <select
                  id="clauseId"
                  value={formData.clauseId}
                  onChange={(e) => handleInputChange("clauseId", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.clauseId ? "border-red-500" : ""}`}
                  disabled={loading}
                >
                  <option value="">Select a compliance clause</option>
                  {clauses.map((clause) => (
                    <option key={clause.id} value={clause.id}>
                      {clause.clauseId} - {clause.title} ({clause.component.topic.framework.name})
                    </option>
                  ))}
                </select>
                {errors.clauseId && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.clauseId}
                  </div>
                )}
              </div>

              {/* Selected Clause Details */}
              {formData.clauseId && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  {(() => {
                    const selectedClause = clauses.find(c => c.id === formData.clauseId)
                    if (!selectedClause) return null
                    
                    return (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-mono text-sm font-medium text-blue-800">
                            {selectedClause.clauseId}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(selectedClause.riskLevel)}`}>
                            {selectedClause.riskLevel}
                          </span>
                        </div>
                        <h4 className="font-medium text-blue-800 mb-1">{selectedClause.title}</h4>
                        <p className="text-sm text-blue-700 mb-2">{selectedClause.description}</p>
                        <p className="text-xs text-blue-600">
                          {selectedClause.component.topic.framework.name} v{selectedClause.component.topic.framework.version} • 
                          {selectedClause.component.topic.name} → {selectedClause.component.name}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                File Upload
              </CardTitle>
              <CardDescription>
                Upload the evidence file (PDF, DOC, XLS, images, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? "border-blue-400 bg-blue-50" 
                    : formData.file 
                      ? "border-green-400 bg-green-50" 
                      : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {formData.file ? (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 text-green-600 mx-auto" />
                    <div>
                      <p className="font-medium text-green-800">{formData.file.name}</p>
                      <p className="text-sm text-green-600">{formatFileSize(formData.file.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange("file", null)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">Drop your file here</p>
                      <p className="text-sm text-gray-600">or click to browse</p>
                    </div>
                    <input
                      type="file"
                      onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      {/* Choose File */}
                    </Button>
                  </div>
                )}
              </div>
              {errors.file && (
                <div className="flex items-center text-sm text-red-600 mt-2">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.file}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, GIF, ZIP, RAR (Max 50MB)
              </p>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence Description</CardTitle>
              <CardDescription>
                Provide a detailed description of the evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Enter detailed description of the evidence..."
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
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Tags
              </CardTitle>
              <CardDescription>
                Add tags to categorize this evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add New Tag */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter tag"
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
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Selected Tags */}
                {formData.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Selected Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
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
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
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
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Evidence
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PlatformAdminLayout>
  )
}
