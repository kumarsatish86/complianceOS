/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> }
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

    const { id: organizationId, articleId } = await params;

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Check if article exists
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.userBookmark.findUnique({
      where: {
        userId_articleId: {
          userId: session.user.id,
          articleId: articleId
        }
      }
    })

    if (existingBookmark) {
      return NextResponse.json({ message: "Article already bookmarked" })
    }

    // Create bookmark
    await prisma.userBookmark.create({
      data: {
        userId: session.user.id,
        articleId: articleId
      }
    })

    // Track analytics
    await prisma.contentAnalytics.create({
      data: {
        contentType: 'ARTICLE',
        contentId: articleId,
        userId: session.user.id,
        action: 'BOOKMARK',
        metadata: {
          organizationId: organizationId
        }
      }
    })

    return NextResponse.json({ message: "Article bookmarked successfully" })
  } catch (error) {
    console.error('Error bookmarking article:', error)
    return NextResponse.json(
      { error: "Failed to bookmark article" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> }
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

    const { articleId } = await params;

    // Remove bookmark
    await prisma.userBookmark.deleteMany({
      where: {
        userId: session.user.id,
        articleId: articleId
      }
    })

    return NextResponse.json({ message: "Bookmark removed successfully" })
  } catch (error) {
    console.error('Error removing bookmark:', error)
    return NextResponse.json(
      { error: "Failed to remove bookmark" },
      { status: 500 }
    )
  }
}
