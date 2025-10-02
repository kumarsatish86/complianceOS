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
    const contentType = searchParams.get('contentType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

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

    if (contentType) {
      whereConditions.contentType = contentType
    }

    // Get articles with related data
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

    // Get total count for pagination
    const totalCount = await prisma.knowledgeArticle.count({
      where: whereConditions
    })

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching knowledge articles:', error)
    return NextResponse.json(
      { error: "Failed to fetch knowledge articles" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin privileges
    if (!['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(session.user.platformRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      summary,
      content,
      contentType = 'ARTICLE',
      categoryId,
      frameworkId,
      clauseId,
      tags = [],
      mediaUrls = []
    } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingArticle = await prisma.knowledgeArticle.findUnique({
      where: { slug }
    })

    if (existingArticle) {
      return NextResponse.json(
        { error: "An article with this title already exists" },
        { status: 400 }
      )
    }

    // Create article
    const article = await prisma.knowledgeArticle.create({
      data: {
        title,
        slug,
        summary,
        content,
        contentType,
        categoryId,
        frameworkId,
        clauseId,
        tags,
        mediaUrls,
        authorId: session.user.id,
        status: 'DRAFT'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        framework: {
          select: {
            id: true,
            name: true,
            version: true
          }
        }
      }
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error('Error creating knowledge article:', error)
    return NextResponse.json(
      { error: "Failed to create knowledge article" },
      { status: 500 }
    )
  }
}
