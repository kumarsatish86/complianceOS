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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where conditions
    const whereConditions: Record<string, unknown> = {
      isActive: true
    }
    
    if (search) {
      whereConditions.OR = [
        { term: { contains: search, mode: 'insensitive' } },
        { definition: { contains: search, mode: 'insensitive' } },
        { shortDefinition: { contains: search, mode: 'insensitive' } },
        { synonyms: { has: search } },
        { acronyms: { has: search } }
      ]
    }

    if (framework) {
      whereConditions.framework = {
        name: { contains: framework, mode: 'insensitive' }
      }
    }

    // Get terms with related data and bookmark status
    const terms = await prisma.knowledgeTerm.findMany({
      where: whereConditions,
      include: {
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
        }
      },
      orderBy: [
        { viewCount: 'desc' },
        { term: 'asc' }
      ],
      skip,
      take: limit
    })

    // Check bookmark status for each term (simplified - in production you'd want a proper bookmark system for terms)
    const transformedTerms = terms.map(term => ({
      ...term,
      isBookmarked: false // Placeholder - would need to implement term bookmarks
    }))

    // Get total count for pagination
    const totalCount = await prisma.knowledgeTerm.count({
      where: whereConditions
    })

    return NextResponse.json({
      terms: transformedTerms,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching organization knowledge terms:', error)
    return NextResponse.json(
      { error: "Failed to fetch organization knowledge terms" },
      { status: 500 }
    )
  }
}
