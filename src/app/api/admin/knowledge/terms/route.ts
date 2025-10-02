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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where conditions
    const whereConditions: any = {
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

    // Get terms with related data
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

    // Get total count for pagination
    const totalCount = await prisma.knowledgeTerm.count({
      where: whereConditions
    })

    return NextResponse.json({
      terms,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching knowledge terms:', error)
    return NextResponse.json(
      { error: "Failed to fetch knowledge terms" },
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
      term,
      definition,
      shortDefinition,
      categoryId,
      frameworkId,
      clauseId,
      synonyms = [],
      acronyms = [],
      examples = [],
      relatedTerms = []
    } = body

    // Validate required fields
    if (!term || !definition) {
      return NextResponse.json(
        { error: "Term and definition are required" },
        { status: 400 }
      )
    }

    // Check if term already exists for this framework
    const existingTerm = await prisma.knowledgeTerm.findFirst({
      where: {
        term: { equals: term, mode: 'insensitive' },
        frameworkId: frameworkId || null
      }
    })

    if (existingTerm) {
      return NextResponse.json(
        { error: "This term already exists for the selected framework" },
        { status: 400 }
      )
    }

    // Create term
    const knowledgeTerm = await prisma.knowledgeTerm.create({
      data: {
        term,
        definition,
        shortDefinition,
        categoryId,
        frameworkId,
        clauseId,
        synonyms,
        acronyms,
        examples,
        relatedTerms
      },
      include: {
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
        },
        clause: {
          select: {
            id: true,
            title: true,
            clauseId: true
          }
        }
      }
    })

    return NextResponse.json(knowledgeTerm, { status: 201 })
  } catch (error) {
    console.error('Error creating knowledge term:', error)
    return NextResponse.json(
      { error: "Failed to create knowledge term" },
      { status: 500 }
    )
  }
}
