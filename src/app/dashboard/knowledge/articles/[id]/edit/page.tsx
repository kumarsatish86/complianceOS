"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import { Label } from "@/components/ui/label"
import { ArrowLeft, 
  Save, 
  Eye,
  AlertCircle,
  CheckCircle,
  Trash2 } from "lucide-react"

interface ComplianceFramework {
  id: string
  name: string
  version: string
}

interface KnowledgeCategory {
  id: string
  name: string
  description: string
}

// interface KnowledgeArticle {
//   id: string
//   title: string
//   slug: string
//   summary: string
//   content: string
//   contentType: string
//   status: string
//   version: number
//   categoryId: string
//   frameworkId: string
//   clauseId: string
//   tags: string[]
//   mediaUrls: string[]
// }

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    contentType: "ARTICLE",
    status: "DRAFT",
    categoryId: "",
    frameworkId: "",
    clauseId: "",
    tags: [] as string[],
    mediaUrls: [] as string[]
  })
  
  // Options
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([])
  const [categories, setCategories] = useState<KnowledgeCategory[]>([])
  const [newTag, setNewTag] = useState("")
  const [newMediaUrl, setNewMediaUrl] = useState("")

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/knowledge/articles/${articleId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch article')
      }

      const data = await response.json()
      const article = data.article
      
      setFormData({
        title: article.title,
        summary: article.summary || "",
        content: article.content,
        contentType: article.contentType,
        status: article.status,
        categoryId: article.categoryId || "",
        frameworkId: article.frameworkId || "",
        clauseId: article.clauseId || "",
        tags: article.tags || [],
        mediaUrls: article.mediaUrls || []
      })
    } catch (error) {
      console.error('Error fetching article:', error)
      setError('Failed to load article')
    } finally {
      setLoading(false)
    }
  }, [articleId])

  useEffect(() => {
    if (articleId) {
      fetchArticle()
      fetchOptions()
    }
  }, [articleId, fetchArticle])

  const fetchOptions = async () => {
    try {
      const [frameworksResponse, categoriesResponse] = await Promise.all([
        fetch('/api/admin/compliance'),
        fetch('/api/admin/knowledge/categories')
      ])

      if (frameworksResponse.ok) {
        const frameworksData = await frameworksResponse.json()
        setFrameworks(frameworksData.frameworks || [])
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.categories || [])
      }
    } catch (error) {
      console.error('Error fetching options:', error)
    }
  }

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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

  const handleAddMediaUrl = () => {
    if (newMediaUrl.trim() && !formData.mediaUrls.includes(newMediaUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, newMediaUrl.trim()]
      }))
      setNewMediaUrl("")
    }
  }

  const handleRemoveMediaUrl = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter(url => url !== urlToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/knowledge/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update article')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/dashboard/knowledge/articles/${articleId}`)
      }, 2000)
    } catch (error) {
      console.error('Error updating article:', error)
      setError(error instanceof Error ? error.message : 'Failed to update article')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/knowledge/articles/${articleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete article')
      }

      router.push('/dashboard/knowledge')
    } catch (error) {
      console.error('Error deleting article:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete article')
    }
  }

  const handlePreview = () => {
    // Open preview in new tab
    const previewWindow = window.open('', '_blank')
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Preview: ${formData.title}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
              .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .content { line-height: 1.6; }
              .tags { margin-top: 20px; }
              .tag { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; margin-right: 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>${formData.title}</h1>
            ${formData.summary ? `<div class="summary"><strong>Summary:</strong> ${formData.summary}</div>` : ''}
            <div class="content">${formData.content.replace(/\n/g, '<br>')}</div>
            ${formData.tags.length > 0 ? `
              <div class="tags">
                <strong>Tags:</strong><br>
                ${formData.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </body>
        </html>
      `)
    }
  }

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </PlatformAdminLayout>
    )
  }

  return (
    <PlatformAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Knowledge Article</h1>
              <p className="text-gray-600 mt-2">
                {/* Update the article content and settings */}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handlePreview} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Article updated successfully!</span>
                <span>Redirecting to article view...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                {/* Update the basic details for your knowledge article */}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter article title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="summary">Summary</Label>
                <textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder="Brief summary of the article"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contentType">Content Type</Label>
                  <select
                    id="contentType"
                    value={formData.contentType}
                    onChange={(e) => handleInputChange('contentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ARTICLE">Article</option>
                    <option value="GUIDE">Guide</option>
                    <option value="TEMPLATE">Template</option>
                    <option value="CHECKLIST">Checklist</option>
                    <option value="CASE_STUDY">Case Study</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="REVIEW">Under Review</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                {/* Update the main content of your article */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="content">Article Content *</Label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Write your article content here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={15}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Use markdown formatting for rich text. Line breaks will be preserved.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Categorization */}
          <Card>
            <CardHeader>
              <CardTitle>Categorization</CardTitle>
              <CardDescription>
                Organize your article with categories and compliance frameworks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Knowledge Category</Label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="framework">Compliance Framework</Label>
                <select
                  id="framework"
                  value={formData.frameworkId}
                  onChange={(e) => handleInputChange('frameworkId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a framework</option>
                  {frameworks.map((framework) => (
                    <option key={framework.id} value={framework.id}>
                      {framework.name} v{framework.version}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                {/* Update tags to help users find your article */}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add Tag
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media URLs */}
          <Card>
            <CardHeader>
              <CardTitle>Media URLs</CardTitle>
              <CardDescription>
                {/* Update URLs to images, videos, or other media referenced in your article */}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="Enter media URL"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMediaUrl())}
                />
                <Button type="button" onClick={handleAddMediaUrl} variant="outline">
                  Add URL
                </Button>
              </div>
              
              {formData.mediaUrls.length > 0 && (
                <div className="space-y-2">
                  {formData.mediaUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1 text-sm text-gray-700 truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMediaUrl(url)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </PlatformAdminLayout>
  )
}
