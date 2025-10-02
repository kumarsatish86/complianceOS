/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Check if article exists
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Increment view count
    await prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: {
        viewCount: { increment: 1 }
      }
    })

    // Track analytics
    await prisma.contentAnalytics.create({
      data: {
        contentType: 'ARTICLE',
        contentId: articleId,
        userId: session.user.id,
        action: 'VIEW',
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer')
        }
      }
    })

    return NextResponse.json({ message: "View tracked successfully" })
  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    )
  }
}
