/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin privileges
    if (!['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(session.user.platformRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: organizationId } = await params;

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const framework = searchParams.get('framework')
    const status = searchParams.get('status')

    // Build where conditions
    const whereConditions: Record<string, unknown> = {}
    
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

    // Get organization-specific statistics
    const [
      totalArticles,
      organizationArticles,
      totalTerms,
      organizationTerms,
      totalBookmarks,
      totalComments,
      averageRating
    ] = await Promise.all([
      // Total articles (all accessible to organization)
      prisma.knowledgeArticle.count({
        where: {
          ...whereConditions,
          status: 'PUBLISHED'
        }
      }),
      
      // Organization-specific articles (created by organization users)
      prisma.knowledgeArticle.count({
        where: {
          ...whereConditions,
          author: {
            organizationUsers: {
              some: {
                organizationId: organizationId
              }
            }
          }
        }
      }),
      
      // Total terms (all accessible to organization)
      prisma.knowledgeTerm.count({
        where: {
          ...whereConditions,
          isActive: true
        }
      }),
      
      // Organization-specific terms (created by organization users)
      prisma.knowledgeTerm.count({
        where: {
          ...whereConditions,
          isActive: true
        }
      }),
      
      // Total bookmarks by organization users
      prisma.userBookmark.count({
        where: {
          user: {
            organizationUsers: {
              some: {
                organizationId: organizationId
              }
            }
          }
        }
      }),
      
      // Total comments by organization users
      prisma.articleComment.count({
        where: {
          user: {
            organizationUsers: {
              some: {
                organizationId: organizationId
              }
            }
          }
        }
      }),
      
      // Average rating of articles viewed by organization users
      prisma.knowledgeArticle.aggregate({
        where: {
          rating: { not: null },
          status: 'PUBLISHED'
        },
        _avg: { rating: true }
      }).then(result => result._avg.rating || 0)
    ])

    const stats = {
      totalArticles,
      totalTerms,
      totalBookmarks,
      totalComments,
      averageRating: Number(averageRating.toFixed(1)),
      organizationArticles,
      organizationTerms
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching organization knowledge stats:', error)
    return NextResponse.json(
      { error: "Failed to fetch organization knowledge statistics" },
      { status: 500 }
    )
  }
}
