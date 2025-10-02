"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BookOpen, 
  FileText, 
  Search,
  Eye,
  Star,
  RefreshCw,
  Bookmark,
  Building,
  TrendingUp } from "lucide-react"

interface OrganizationKnowledgeStats {
  totalArticles: number
  totalTerms: number
  totalBookmarks: number
  totalComments: number
  averageRating: number
  organizationArticles: number
  organizationTerms: number
}

interface OrganizationArticle {
  id: string
  title: string
  summary: string
  contentType: string
  status: string
  viewCount: number
  rating: number
  ratingCount: number
  author: {
    name: string
  }
  category: {
    name: string
  }
  framework: {
    name: string
  }
  publishedAt: string
  tags: string[]
  isBookmarked: boolean
}

interface OrganizationTerm {
  id: string
  term: string
  definition: string
  shortDefinition: string
  framework: {
    name: string
  }
  viewCount: number
  synonyms: string[]
  isBookmarked: boolean
}

interface Organization {
  id: string
  name: string
  domain: string
  plan: string
  status: string
}

export default function OrganizationKnowledgePage() {
  const router = useRouter()
  const params = useParams()
  const organizationId = params.id as string
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [stats, setStats] = useState<OrganizationKnowledgeStats>({
    totalArticles: 0,
    totalTerms: 0,
    totalBookmarks: 0,
    totalComments: 0,
    averageRating: 0,
    organizationArticles: 0,
    organizationTerms: 0
  })
  const [articles, setArticles] = useState<OrganizationArticle[]>([])
  const [terms, setTerms] = useState<OrganizationTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFramework, setSelectedFramework] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  const fetchOrganizationData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedFramework) params.append('framework', selectedFramework)
      if (selectedStatus) params.append('status', selectedStatus)

      const [orgResponse, statsResponse, articlesResponse, termsResponse] = await Promise.all([
        fetch(`/api/admin/organizations/${organizationId}`),
        fetch(`/api/admin/organizations/${organizationId}/knowledge/stats?${params}`),
        fetch(`/api/admin/organizations/${organizationId}/knowledge/articles?${params}`),
        fetch(`/api/admin/organizations/${organizationId}/knowledge/terms?${params}`)
      ])

      if (!orgResponse.ok || !statsResponse.ok || !articlesResponse.ok || !termsResponse.ok) {
        throw new Error('Failed to fetch organization knowledge data')
      }

      const [orgData, statsData, articlesData, termsData] = await Promise.all([
        orgResponse.json(),
        statsResponse.json(),
        articlesResponse.json(),
        termsResponse.json()
      ])

      setOrganization(orgData.organization)
      setStats(statsData)
      setArticles(articlesData.articles || [])
      setTerms(termsData.terms || [])
    } catch (error) {
      console.error('Error fetching organization knowledge data:', error)
      setError('Failed to load organization knowledge data')
    } finally {
      setLoading(false)
    }
  }, [organizationId, searchTerm, selectedFramework, selectedStatus])

  useEffect(() => {
    if (organizationId) {
      fetchOrganizationData()
    }
  }, [organizationId, searchTerm, selectedFramework, selectedStatus, fetchOrganizationData])

  const handleViewArticle = (articleId: string) => {
    router.push(`/dashboard/organizations/${organizationId}/knowledge/articles/${articleId}`)
  }

  const handleViewTerm = (termId: string) => {
    router.push(`/dashboard/organizations/${organizationId}/knowledge/terms/${termId}`)
  }

  const handleBookmarkArticle = async (articleId: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/knowledge/articles/${articleId}/bookmark`, {
        method: 'POST'
      })

      if (response.ok) {
        // Update local state
        setArticles(prev => prev.map(article => 
          article.id === articleId 
            ? { ...article, isBookmarked: !article.isBookmarked }
            : article
        ))
      }
    } catch (error) {
      console.error('Error bookmarking article:', error)
    }
  }

  const handleBookmarkTerm = async (termId: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/knowledge/terms/${termId}/bookmark`, {
        method: 'POST'
      })

      if (response.ok) {
        // Update local state
        setTerms(prev => prev.map(term => 
          term.id === termId 
            ? { ...term, isBookmarked: !term.isBookmarked }
            : term
        ))
      }
    } catch (error) {
      console.error('Error bookmarking term:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'REVIEW': return 'bg-blue-100 text-blue-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'ARTICLE': return <FileText className="h-4 w-4" />
      case 'GUIDE': return <BookOpen className="h-4 w-4" />
      case 'TEMPLATE': return <FileText className="h-4 w-4" />
      case 'CHECKLIST': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
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

  if (error || !organization) {
    return (
      <PlatformAdminLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600 mb-4">{error || "The requested organization could not be found."}</p>
          <Button onClick={() => router.push('/dashboard/organizations')}>
            Back to Organizations
          </Button>
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
            <h1 className="text-3xl font-bold text-gray-900">{organization.name} Knowledge Base</h1>
            <p className="text-gray-600 mt-2">
              Organization-specific compliance knowledge and documentation
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push(`/dashboard/organizations/${organizationId}/knowledge/analytics`)} variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button onClick={() => router.push(`/dashboard/organizations/${organizationId}/knowledge/search`)} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Organization Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{organization.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Domain: {organization.domain}</span>
                  <span>•</span>
                  <span>Plan: {organization.plan}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    organization.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {organization.status}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalArticles}</div>
              <p className="text-xs text-muted-foreground">
                {stats.organizationArticles} organization-specific
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Terms</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTerms}</div>
              <p className="text-xs text-muted-foreground">
                {stats.organizationTerms} organization-specific
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookmarks</CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookmarks}</div>
              <p className="text-xs text-muted-foreground">
                Organization bookmarks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Content quality score
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>
              Find specific articles and terms for this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search articles and terms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedFramework}
                  onChange={(e) => setSelectedFramework(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Frameworks</option>
                  <option value="ISO27001">ISO 27001</option>
                  <option value="PCIDSS">PCI DSS</option>
                  <option value="SOC2">SOC 2</option>
                  <option value="GDPR">GDPR</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Status</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">Under Review</option>
                </select>
                <Button onClick={fetchOrganizationData} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
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

        {/* Recent Articles */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Articles</CardTitle>
            <CardDescription>
              Latest knowledge articles relevant to this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {articles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600 mb-4">No articles match your current filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => (
                  <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getContentTypeIcon(article.contentType)}
                          <h3 className="font-semibold text-gray-900">{article.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(article.status)}`}>
                            {article.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{article.summary}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>By {article.author.name}</span>
                          <span>•</span>
                          <span>{article.category?.name || 'Uncategorized'}</span>
                          <span>•</span>
                          <span>{article.framework?.name || 'General'}</span>
                          <span>•</span>
                          <span>{article.viewCount} views</span>
                          {article.rating > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current text-yellow-400" />
                                {article.rating.toFixed(1)} ({article.ratingCount})
                              </span>
                            </>
                          )}
                        </div>
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookmarkArticle(article.id)}
                          className={article.isBookmarked ? "bg-blue-100 text-blue-800" : ""}
                        >
                          <Bookmark className={`h-4 w-4 ${article.isBookmarked ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewArticle(article.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Terms</CardTitle>
            <CardDescription>
              Latest compliance terminology relevant to this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {terms.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No terms found</h3>
                <p className="text-gray-600 mb-4">No terms match your current filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {terms.map((term) => (
                  <div key={term.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{term.term}</h3>
                          <span className="text-sm text-gray-500">
                            {term.framework?.name || 'General'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          {term.shortDefinition || term.definition}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{term.viewCount} views</span>
                          {term.synonyms.length > 0 && (
                            <>
                              <span>•</span>
                              <span>Synonyms: {term.synonyms.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookmarkTerm(term.id)}
                          className={term.isBookmarked ? "bg-blue-100 text-blue-800" : ""}
                        >
                          <Bookmark className={`h-4 w-4 ${term.isBookmarked ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTerm(term.id)}
                        >
                          <Eye className="h-4 w-4" />
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
