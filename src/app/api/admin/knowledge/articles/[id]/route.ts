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

    const { id: articleId } = await params;

    const article = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId },
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
        versions: {
          select: {
            id: true,
            version: true,
            title: true,
            createdAt: true,
            author: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            version: 'desc'
          }
        },
        _count: {
          select: {
            bookmarks: true,
            comments: true
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { id: articleId } = await params;
    const body = await request.json()
    const {
      title,
      summary,
      content,
      contentType,
      status,
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

    // Check if article exists
    const existingArticle = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId }
    })

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Generate new slug if title changed
    let slug = existingArticle.slug
    if (title !== existingArticle.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check if new slug already exists
      const slugExists = await prisma.knowledgeArticle.findFirst({
        where: {
          slug,
          id: { not: articleId }
        }
      })

      if (slugExists) {
        slug = `${slug}-${Date.now()}`
      }
    }

    // Create new version if content changed significantly
    const shouldCreateVersion = 
      content !== existingArticle.content || 
      title !== existingArticle.title ||
      summary !== existingArticle.summary

    if (shouldCreateVersion) {
      await prisma.articleContentVersion.create({
        data: {
          articleId,
          version: existingArticle.version + 1,
          title: existingArticle.title,
          content: existingArticle.content,
          summary: existingArticle.summary,
          changeLog: `Updated: ${new Date().toISOString()}`,
          authorId: session.user.id
        }
      })
    }

    // Update article
    const updatedArticle = await prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: {
        title,
        slug,
        summary,
        content,
        contentType,
        status,
        categoryId: categoryId || null,
        frameworkId: frameworkId || null,
        clauseId: clauseId || null,
        tags,
        mediaUrls,
        version: shouldCreateVersion ? existingArticle.version + 1 : existingArticle.version,
        publishedAt: status === 'PUBLISHED' && existingArticle.status !== 'PUBLISHED' 
          ? new Date() 
          : existingArticle.publishedAt
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

    return NextResponse.json(updatedArticle)
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { id: articleId } = await params;

    // Check if article exists
    const existingArticle = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId }
    })

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Delete article (cascade will handle related records)
    await prisma.knowledgeArticle.delete({
      where: { id: articleId }
    })

    return NextResponse.json({ message: "Article deleted successfully" })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    )
  }
}
