/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user has admin privileges
    if (!['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(session.user.platformRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get time range parameter
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get overview statistics
    const [
      totalViews,
      totalSearches,
      totalBookmarks,
      totalComments,
      averageRating,
      totalArticles,
      totalTerms
    ] = await Promise.all([
      // Total views
      prisma.knowledgeArticle.aggregate({
        _sum: { viewCount: true }
      }).then(result => result._sum.viewCount || 0),
      
      // Total searches
      prisma.contentAnalytics.count({
        where: {
          action: 'SEARCH',
          createdAt: { gte: startDate }
        }
      }),
      
      // Total bookmarks
      prisma.userBookmark.count(),
      
      // Total comments
      prisma.articleComment.count(),
      
      // Average rating
      prisma.knowledgeArticle.aggregate({
        where: {
          rating: { not: null }
        },
        _avg: { rating: true }
      }).then(result => result._avg.rating || 0),
      
      // Total articles
      prisma.knowledgeArticle.count(),
      
      // Total terms
      prisma.knowledgeTerm.count({
        where: { isActive: true }
      })
    ])

    // Get top articles
    const topArticles = await prisma.knowledgeArticle.findMany({
      where: {
        status: 'PUBLISHED'
      },
      include: {
        author: {
          select: { name: true }
        }
      },
      orderBy: { viewCount: 'desc' },
      take: 10
    })

    // Get top terms
    const topTerms = await prisma.knowledgeTerm.findMany({
      where: { isActive: true },
      include: {
        framework: {
          select: { name: true }
        }
      },
      orderBy: { viewCount: 'desc' },
      take: 10
    })

    // Get recent activity
    const recentActivity = await prisma.contentAnalytics.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Get search trends
    const searchAnalytics = await prisma.contentAnalytics.findMany({
      where: {
        action: 'SEARCH',
        createdAt: { gte: startDate }
      },
      select: {
        metadata: true,
        createdAt: true
      }
    })

    // Process search trends
    const searchTrendsMap = new Map()
    searchAnalytics.forEach(analytics => {
      const query = (analytics.metadata as any)?.query
      if (query) {
        if (searchTrendsMap.has(query)) {
          const existing = searchTrendsMap.get(query)
          existing.count += 1
          if (new Date(analytics.createdAt) > new Date(existing.lastSearched)) {
            existing.lastSearched = analytics.createdAt
          }
        } else {
          searchTrendsMap.set(query, {
            query,
            count: 1,
            lastSearched: analytics.createdAt
          })
        }
      }
    })

    const searchTrends = Array.from(searchTrendsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const analyticsData = {
      overview: {
        totalViews,
        totalSearches,
        totalBookmarks,
        totalComments,
        averageRating: Number(averageRating.toFixed(1)),
        totalArticles,
        totalTerms
      },
      topArticles,
      topTerms,
      recentActivity,
      searchTrends
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching knowledge analytics:', error)
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    )
  }
}
