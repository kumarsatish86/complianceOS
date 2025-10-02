"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from '@/components/ui/input'
import { BookOpen, 
  FileText, 
  Search, 
  Eye,
  Star,
  RefreshCw,
  TrendingUp,
  Plus } from "lucide-react"
import KnowledgeSearchComponent from "@/components/knowledge/search-component"

interface KnowledgeStats {
  totalArticles: number
  totalTerms: number
  totalCategories: number
  publishedArticles: number
  draftArticles: number
  totalViews: number
  averageRating: number
  totalBookmarks: number
}

interface KnowledgeArticle {
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
}

interface KnowledgeTerm {
  id: string
  term: string
  definition: string
  shortDefinition: string
  framework: {
    name: string
  }
  viewCount: number
  synonyms: string[]
}

export default function KnowledgeBasePage() {
  const router = useRouter()
  const [stats, setStats] = useState<KnowledgeStats>({
    totalArticles: 0,
    totalTerms: 0,
    totalCategories: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalViews: 0,
    averageRating: 0,
    totalBookmarks: 0
  })
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [terms, setTerms] = useState<KnowledgeTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm] = useState("")
  const [selectedFramework, setSelectedFramework] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  const fetchKnowledgeData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedFramework) params.append('framework', selectedFramework)
      if (selectedStatus) params.append('status', selectedStatus)

      const [statsResponse, articlesResponse, termsResponse] = await Promise.all([
        fetch(`/api/admin/knowledge/stats?${params}`),
        fetch(`/api/admin/knowledge/articles?${params}`),
        fetch(`/api/admin/knowledge/terms?${params}`)
      ])

      if (!statsResponse.ok || !articlesResponse.ok || !termsResponse.ok) {
        throw new Error('Failed to fetch knowledge data')
      }

      const [statsData, articlesData, termsData] = await Promise.all([
        statsResponse.json(),
        articlesResponse.json(),
        termsResponse.json()
      ])

      setStats(statsData)
      setArticles(articlesData.articles || [])
      setTerms(termsData.terms || [])
    } catch (error) {
      console.error('Error fetching knowledge data:', error)
      setError('Failed to load knowledge base data')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedFramework, selectedStatus])

  useEffect(() => {
    fetchKnowledgeData()
  }, [searchTerm, selectedFramework, selectedStatus, fetchKnowledgeData])

  const handleAddArticle = () => {
    router.push("/dashboard/knowledge/articles/add")
  }

  const handleAddTerm = () => {
    router.push("/dashboard/knowledge/terms/add")
  }

  const handleViewArticle = (articleId: string) => {
    router.push(`/dashboard/knowledge/articles/${articleId}`)
  }

  const handleEditArticle = (articleId: string) => {
    router.push(`/dashboard/knowledge/articles/${articleId}/edit`)
  }

  const handleEditTerm = (termId: string) => {
    router.push(`/dashboard/knowledge/terms/${termId}/edit`)
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

  return (
    <PlatformAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Knowledge Base Management</h1>
            <p className="text-gray-600 mt-2">
              {/* Manage compliance knowledge articles, terminology, and documentation */}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/dashboard/knowledge/analytics')} variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button onClick={() => router.push('/dashboard/knowledge/search')} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Advanced Search
            </Button>
            <Button onClick={handleAddTerm} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Term
            </Button>
            <Button onClick={handleAddArticle}>
              <Plus className="h-4 w-4 mr-2" />
              Add Article
            </Button>
          </div>
        </div>

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
                {stats.publishedArticles} published, {stats.draftArticles} drafts
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
                Compliance terminology
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All-time content views
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

        {/* Quick Search */}
        <KnowledgeSearchComponent />

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{/* Filter Content */}</CardTitle>
            <CardDescription>
              {/* Filter articles and terms by framework and status */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
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
                <Button onClick={fetchKnowledgeData} variant="outline" size="sm">
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
              Latest knowledge articles and documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading articles...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first knowledge article.</p>
                <Button onClick={handleAddArticle}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Article
                </Button>
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
                          onClick={() => handleViewArticle(article.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditArticle(article.id)}
                        >
                          Edit
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
              Latest compliance terminology and definitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading terms...</p>
              </div>
            ) : terms.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No terms found</h3>
                <p className="text-gray-600 mb-4">Get started by adding compliance terminology.</p>
                <Button onClick={handleAddTerm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Term
                </Button>
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
                          onClick={() => handleEditTerm(term.id)}
                        >
                          Edit
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
