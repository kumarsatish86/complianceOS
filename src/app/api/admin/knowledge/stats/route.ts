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

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const framework = searchParams.get('framework')
    const status = searchParams.get('status')

    // Build where conditions
    const whereConditions: any = {}
    
    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }

    if (framework) {
      whereConditions.framework = {
        name: { contains: framework, mode: 'insensitive' }
      }
    }

    if (status) {
      whereConditions.status = status
    }

    // Get statistics
    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      totalTerms,
      totalCategories,
      totalViews,
      averageRating,
      totalBookmarks
    ] = await Promise.all([
      // Total articles
      prisma.knowledgeArticle.count({
        where: whereConditions
      }),
      
      // Published articles
      prisma.knowledgeArticle.count({
        where: {
          ...whereConditions,
          status: 'PUBLISHED'
        }
      }),
      
      // Draft articles
      prisma.knowledgeArticle.count({
        where: {
          ...whereConditions,
          status: 'DRAFT'
        }
      }),
      
      // Total terms
      prisma.knowledgeTerm.count({
        where: search ? {
          OR: [
            { term: { contains: search, mode: 'insensitive' } },
            { definition: { contains: search, mode: 'insensitive' } },
            { synonyms: { has: search } }
          ]
        } : {}
      }),
      
      // Total categories
      prisma.knowledgeCategory.count(),
      
      // Total views
      prisma.knowledgeArticle.aggregate({
        where: whereConditions,
        _sum: { viewCount: true }
      }).then(result => result._sum.viewCount || 0),
      
      // Average rating
      prisma.knowledgeArticle.aggregate({
        where: {
          ...whereConditions,
          rating: { not: null }
        },
        _avg: { rating: true }
      }).then(result => result._avg.rating || 0),
      
      // Total bookmarks
      prisma.userBookmark.count()
    ])

    const stats = {
      totalArticles,
      totalTerms,
      totalCategories,
      publishedArticles,
      draftArticles,
      totalViews,
      averageRating: Number(averageRating.toFixed(1)),
      totalBookmarks
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching knowledge stats:', error)
    return NextResponse.json(
      { error: "Failed to fetch knowledge statistics" },
      { status: 500 }
    )
  }
}
