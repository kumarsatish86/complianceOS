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

    const { id: articleId } = await params;

    const comments = await prisma.articleComment.findMany({
      where: { 
        articleId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: articleId } = await params;
    const { content, parentId } = await request.json()

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      )
    }

    // Check if article exists
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Create comment
    const comment = await prisma.articleComment.create({
      data: {
        articleId,
        userId: session.user.id,
        content: content.trim(),
        parentId: parentId || null,
        isApproved: false // Comments need approval by default
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Track analytics
    await prisma.contentAnalytics.create({
      data: {
        contentType: 'ARTICLE',
        contentId: articleId,
        userId: session.user.id,
        action: 'COMMENT',
        metadata: { commentId: comment.id }
      }
    })

    return NextResponse.json({ 
      message: "Comment submitted successfully",
      comment 
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}
