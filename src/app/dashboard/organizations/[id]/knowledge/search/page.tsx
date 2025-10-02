"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import { Search, 
  FileText, 
  BookOpen, 
  Tag,
  Eye,
  Star,
  User,
  ExternalLink,
  Building,
  ArrowLeft,
  Calendar } from "lucide-react"

interface SearchResult {
  type: 'article' | 'term' | 'category'
  id: string
  title: string
  summary: string
  contentType?: string
  author?: string
  category?: string
  framework?: string
  viewCount?: number
  rating?: number
  publishedAt?: string
  tags?: string[]
  definition?: string
  synonyms?: string[]
  acronyms?: string[]
  articleCount?: number
  termCount?: number
  url: string
  isBookmarked?: boolean
}

interface SearchResponse {
  results: SearchResult[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  query: string
  type: string
  framework: string
  category: string
}

interface Organization {
  id: string
  name: string
  domain: string
}

export default function OrganizationKnowledgeSearchPage() {
  const router = useRouter()
  const params = useParams()
  const organizationId = params.id as string
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [query, setQuery] = useState("")
  const [searchType, setSearchType] = useState("all")
  const [framework, setFramework] = useState("")
  const [category, setCategory] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const fetchOrganization = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setOrganization(data.organization)
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }, [organizationId])

  useEffect(() => {
    if (organizationId) {
      fetchOrganization()
    }
  }, [organizationId, fetchOrganization])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim() || query.trim().length < 2) {
      setError("Please enter at least 2 characters to search")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        type: searchType,
        page: '1',
        limit: '20',
        organizationId: organizationId
      })

      if (framework) params.append('framework', framework)
      if (category) params.append('category', category)

      const response = await fetch(`/api/admin/knowledge/search?${params}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data: SearchResponse = await response.json()
      setResults(data.results)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setError('Failed to search knowledge base')
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'article') {
      router.push(`/dashboard/organizations/${organizationId}/knowledge/articles/${result.id}`)
    } else if (result.type === 'term') {
      router.push(`/dashboard/organizations/${organizationId}/knowledge/terms/${result.id}`)
    } else {
      router.push(result.url)
    }
  }

  const handleBookmark = async (result: SearchResult) => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/knowledge/articles/${result.id}/bookmark`, {
        method: 'POST'
      })

      if (response.ok) {
        // Update local state
        setResults(prev => prev.map(r => 
          r.id === result.id && r.type === result.type
            ? { ...r, isBookmarked: !r.isBookmarked }
            : r
        ))
      }
    } catch (error) {
      console.error('Error bookmarking:', error)
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4" />
      case 'term': return <BookOpen className="h-4 w-4" />
      case 'category': return <Tag className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800'
      case 'term': return 'bg-green-100 text-green-800'
      case 'category': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
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
              onClick={() => router.push(`/dashboard/organizations/${organizationId}/knowledge`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {organization?.name} Knowledge Search
              </h1>
              <p className="text-gray-600 mt-2">
                Search compliance knowledge articles and terminology for {organization?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Organization Info */}
        {organization && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Building className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{organization.name}</h3>
                  <div className="text-sm text-gray-600">
                    Domain: {organization.domain}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle>Search Knowledge Base</CardTitle>
            <CardDescription>
              Find articles, terms, and categories relevant to {organization?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search articles, terms, categories..."
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Type
                  </label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Content</option>
                    <option value="articles">Articles Only</option>
                    <option value="terms">Terms Only</option>
                    <option value="categories">Categories Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Framework
                  </label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Frameworks</option>
                    <option value="ISO27001">ISO 27001</option>
                    <option value="PCIDSS">PCI DSS</option>
                    <option value="SOC2">SOC 2</option>
                    <option value="GDPR">GDPR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    <option value="Security">Security</option>
                    <option value="Privacy">Privacy</option>
                    <option value="Risk">Risk Management</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-800">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {showResults && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                Found {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot; in {organization?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms or filters to find what you&apos;re looking for.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getResultIcon(result.type)}
                            <h3 className="font-semibold text-gray-900">{result.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getResultTypeColor(result.type)}`}>
                              {result.type}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3">{result.summary}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {result.author && (
                              <>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {result.author}
                                </span>
                              </>
                            )}
                            
                            {result.category && (
                              <>
                                <span>•</span>
                                <span>{result.category}</span>
                              </>
                            )}
                            
                            {result.framework && (
                              <>
                                <span>•</span>
                                <span>{result.framework}</span>
                              </>
                            )}
                            
                            {result.viewCount && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {result.viewCount}
                                </span>
                              </>
                            )}
                            
                            {result.rating && result.rating > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-current text-yellow-400" />
                                  {result.rating.toFixed(1)}
                                </span>
                              </>
                            )}
                            
                            {result.publishedAt && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(result.publishedAt).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>

                          {result.tags && result.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.tags.slice(0, 3).map((tag, tagIndex) => (
                                <span key={tagIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                              {result.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  +{result.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {result.synonyms && result.synonyms.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Synonyms: </span>
                              <span className="text-xs text-gray-600">
                                {result.synonyms.slice(0, 3).join(', ')}
                                {result.synonyms.length > 3 && ` +${result.synonyms.length - 3} more`}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          {result.type === 'article' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBookmark(result)
                              }}
                              className={result.isBookmarked ? "bg-blue-100 text-blue-800" : ""}
                            >
                              <Tag className={`h-4 w-4 ${result.isBookmarked ? "fill-current" : ""}`} />
                            </Button>
                          )}
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PlatformAdminLayout>
  )
}
