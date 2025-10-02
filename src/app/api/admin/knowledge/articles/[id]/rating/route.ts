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
    const { rating } = await request.json()

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
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

    // Track analytics
    await prisma.contentAnalytics.create({
      data: {
        contentType: 'ARTICLE',
        contentId: articleId,
        userId: session.user.id,
        action: 'RATE',
        metadata: { rating }
      }
    })

    // Update article rating (simplified - in production you'd want a separate ratings table)
    const currentRating = article.rating || 0
    const currentCount = article.ratingCount || 0
    const newCount = currentCount + 1
    const newRating = ((currentRating * currentCount) + rating) / newCount

    await prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: {
        rating: newRating,
        ratingCount: newCount
      }
    })

    return NextResponse.json({ 
      message: "Rating submitted successfully",
      rating: newRating,
      count: newCount
    })
  } catch (error) {
    console.error('Error submitting rating:', error)
    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 }
    )
  }
}
