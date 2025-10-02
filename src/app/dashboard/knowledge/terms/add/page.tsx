"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, 
  Save,
  AlertCircle,
  CheckCircle,
  Plus,
  X } from "lucide-react"

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

export default function AddTermPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    term: "",
    definition: "",
    shortDefinition: "",
    categoryId: "",
    frameworkId: "",
    clauseId: "",
    synonyms: [] as string[],
    acronyms: [] as string[],
    examples: [] as string[],
    relatedTerms: [] as string[]
  })
  
  // Options
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([])
  const [categories, setCategories] = useState<KnowledgeCategory[]>([])
  
  // Dynamic arrays
  const [newSynonym, setNewSynonym] = useState("")
  const [newAcronym, setNewAcronym] = useState("")
  const [newExample, setNewExample] = useState("")
  const [newRelatedTerm, setNewRelatedTerm] = useState("")

  useEffect(() => {
    fetchOptions()
  }, [])

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

  const handleAddToArray = (field: string, value: string, setter: (value: string) => void) => {
    if (value.trim() && !formData[field as keyof typeof formData].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof typeof formData] as string[]), value.trim()]
      }))
      setter("")
    }
  }

  const handleRemoveFromArray = (field: string, valueToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof formData] as string[]).filter(item => item !== valueToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.term.trim() || !formData.definition.trim()) {
      setError("Term and definition are required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/knowledge/terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create term')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/knowledge')
      }, 2000)
    } catch (error) {
      console.error('Error creating term:', error)
      setError(error instanceof Error ? error.message : 'Failed to create term')
    } finally {
      setLoading(false)
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Add Knowledge Term</h1>
              <p className="text-gray-600 mt-2">
                Add a new compliance term to the knowledge base
              </p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Term"}
          </Button>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Term created successfully!</span>
                <span>Redirecting to knowledge base...</span>
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
              <CardTitle>Term Information</CardTitle>
              <CardDescription>
                Define the compliance term and its meaning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="term">Term *</Label>
                <Input
                  id="term"
                  value={formData.term}
                  onChange={(e) => handleInputChange('term', e.target.value)}
                  placeholder="Enter the compliance term"
                  required
                />
              </div>

              <div>
                <Label htmlFor="definition">Definition *</Label>
                <textarea
                  id="definition"
                  value={formData.definition}
                  onChange={(e) => handleInputChange('definition', e.target.value)}
                  placeholder="Provide a comprehensive definition"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="shortDefinition">Short Definition</Label>
                <Input
                  id="shortDefinition"
                  value={formData.shortDefinition}
                  onChange={(e) => handleInputChange('shortDefinition', e.target.value)}
                  placeholder="Brief definition for tooltips and quick reference"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be used in tooltips and quick reference displays
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Categorization */}
          <Card>
            <CardHeader>
              <CardTitle>Categorization</CardTitle>
              <CardDescription>
                Organize the term with categories and compliance frameworks
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

          {/* Synonyms */}
          <Card>
            <CardHeader>
              <CardTitle>Synonyms</CardTitle>
              <CardDescription>
                Add alternative terms that mean the same thing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSynonym}
                  onChange={(e) => setNewSynonym(e.target.value)}
                  placeholder="Enter a synonym"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddToArray('synonyms', newSynonym, setNewSynonym))}
                />
                <Button 
                  type="button" 
                  onClick={() => handleAddToArray('synonyms', newSynonym, setNewSynonym)} 
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.synonyms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.synonyms.map((synonym, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {synonym}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromArray('synonyms', synonym)}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acronyms */}
          <Card>
            <CardHeader>
              <CardTitle>Acronyms</CardTitle>
              <CardDescription>
                Add acronym variations of this term
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newAcronym}
                  onChange={(e) => setNewAcronym(e.target.value)}
                  placeholder="Enter an acronym"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddToArray('acronyms', newAcronym, setNewAcronym))}
                />
                <Button 
                  type="button" 
                  onClick={() => handleAddToArray('acronyms', newAcronym, setNewAcronym)} 
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.acronyms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.acronyms.map((acronym, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                    >
                      {acronym}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromArray('acronyms', acronym)}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Examples</CardTitle>
              <CardDescription>
                Provide practical examples of how this term is used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="Enter a usage example"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddToArray('examples', newExample, setNewExample))}
                />
                <Button 
                  type="button" 
                  onClick={() => handleAddToArray('examples', newExample, setNewExample)} 
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.examples.length > 0 && (
                <div className="space-y-2">
                  {formData.examples.map((example, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      <span className="flex-1 text-sm text-blue-800">{example}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromArray('examples', example)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Related Terms</CardTitle>
              <CardDescription>
                Link to other terms that are related or connected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newRelatedTerm}
                  onChange={(e) => setNewRelatedTerm(e.target.value)}
                  placeholder="Enter a related term"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddToArray('relatedTerms', newRelatedTerm, setNewRelatedTerm))}
                />
                <Button 
                  type="button" 
                  onClick={() => handleAddToArray('relatedTerms', newRelatedTerm, setNewRelatedTerm)} 
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.relatedTerms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.relatedTerms.map((term, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full"
                    >
                      {term}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromArray('relatedTerms', term)}
                        className="ml-1 text-orange-600 hover:text-orange-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
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
