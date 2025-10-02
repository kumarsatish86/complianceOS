"use client"

import { useState, useEffect, useCallback } from "react"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, 
  Eye, 
  Star, 
  Bookmark,
  Search,
  FileText,
  BookOpen,
  MessageSquare,
  Users } from "lucide-react"

interface AnalyticsData {
  overview: {
    totalViews: number
    totalSearches: number
    totalBookmarks: number
    totalComments: number
    averageRating: number
    totalArticles: number
    totalTerms: number
  }
  topArticles: Array<{
    id: string
    title: string
    viewCount: number
    rating: number
    ratingCount: number
    author: { name: string }
  }>
  topTerms: Array<{
    id: string
    term: string
    viewCount: number
    framework: { name: string }
  }>
  recentActivity: Array<{
    id: string
    action: string
    contentType: string
    contentId: string
    createdAt: string
    user: { name: string }
    metadata: Record<string, unknown>
  }>
  searchTrends: Array<{
    query: string
    count: number
    lastSearched: string
  }>
}

export default function KnowledgeAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("7d")

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ timeRange })
      const response = await fetch(`/api/admin/knowledge/analytics?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, fetchAnalytics])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'VIEW': return <Eye className="h-4 w-4" />
      case 'SEARCH': return <Search className="h-4 w-4" />
      case 'BOOKMARK': return <Bookmark className="h-4 w-4" />
      case 'COMMENT': return <MessageSquare className="h-4 w-4" />
      case 'RATE': return <Star className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'VIEW': return 'text-blue-600'
      case 'SEARCH': return 'text-green-600'
      case 'BOOKMARK': return 'text-purple-600'
      case 'COMMENT': return 'text-orange-600'
      case 'RATE': return 'text-yellow-600'
      default: return 'text-gray-600'
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

  if (error || !analytics) {
    return (
      <PlatformAdminLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Unavailable</h2>
          <p className="text-gray-600 mb-4">{error || "Unable to load analytics data."}</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Knowledge Base Analytics</h1>
            <p className="text-gray-600 mt-2">
              Insights into knowledge base usage and engagement
            </p>
          </div>
          <div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All-time content views
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalSearches.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Knowledge base searches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalBookmarks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                User bookmarks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Content quality score
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Articles */}
          <Card>
            <CardHeader>
              <CardTitle>Most Viewed Articles</CardTitle>
              <CardDescription>
                Articles with the highest view counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topArticles.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No articles found</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topArticles.map((article) => (
                    <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{article.title}</h4>
                        <p className="text-sm text-gray-600">by {article.author.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{article.viewCount} views</div>
                        {article.rating > 0 && (
                          <div className="text-xs text-gray-600">
                            ⭐ {article.rating.toFixed(1)} ({article.ratingCount})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Most Viewed Terms</CardTitle>
              <CardDescription>
                Compliance terms with the highest view counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topTerms.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No terms found</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topTerms.map((term) => (
                    <div key={term.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{term.term}</h4>
                        <p className="text-sm text-gray-600">{term.framework.name}</p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {term.viewCount} views
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest user interactions with the knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {analytics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${getActionColor(activity.action)} bg-gray-100`}>
                        {getActionIcon(activity.action)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {activity.user.name} {activity.action.toLowerCase()}d
                        </div>
                        <div className="text-xs text-gray-600">
                          {activity.contentType} • {new Date(activity.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Search Terms</CardTitle>
              <CardDescription>
                Most searched terms in the knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.searchTrends.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No search data available</p>
              ) : (
                <div className="space-y-3">
                  {analytics.searchTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">&quot;{trend.query}&quot;</h4>
                        <p className="text-sm text-gray-600">
                          Last searched: {new Date(trend.lastSearched).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {trend.count} searches
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Content Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
            <CardDescription>
              Summary of knowledge base content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">{analytics.overview.totalArticles}</div>
                <div className="text-sm text-blue-700">Knowledge Articles</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">{analytics.overview.totalTerms}</div>
                <div className="text-sm text-green-700">Compliance Terms</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">{analytics.overview.totalComments}</div>
                <div className="text-sm text-purple-700">User Comments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformAdminLayout>
  )
}
