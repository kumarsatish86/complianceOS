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
    const contentType = searchParams.get('contentType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where conditions
    const whereConditions: Record<string, unknown> = {
      status: 'PUBLISHED' // Only show published articles to organization users
    }
    
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

    if (contentType) {
      whereConditions.contentType = contentType
    }

    // Get articles with related data and bookmark status
    const articles = await prisma.knowledgeArticle.findMany({
      where: whereConditions,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        framework: {
          select: {
            id: true,
            name: true,
            version: true
          }
        },
        clause: {
          select: {
            id: true,
            title: true,
            clauseId: true
          }
        },
        bookmarks: {
          where: {
            user: {
              organizationUsers: {
                some: {
                  organizationId: organizationId
                }
              }
            }
          },
          select: {
            userId: true
          }
        },
        _count: {
          select: {
            bookmarks: true,
            comments: true
          }
        }
      },
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    })

    // Transform articles to include bookmark status
    const transformedArticles = articles.map(article => ({
      ...article,
      isBookmarked: article.bookmarks.length > 0
    }))

    // Get total count for pagination
    const totalCount = await prisma.knowledgeArticle.count({
      where: whereConditions
    })

    return NextResponse.json({
      articles: transformedArticles,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching organization knowledge articles:', error)
    return NextResponse.json(
      { error: "Failed to fetch organization knowledge articles" },
      { status: 500 }
    )
  }
}
