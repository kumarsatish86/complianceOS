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

    // Build where conditions
    const whereConditions: any = {
      isActive: true
    }
    
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (framework) {
      whereConditions.framework = {
        name: { contains: framework, mode: 'insensitive' }
      }
    }

    // Get categories with hierarchical structure
    const categories = await prisma.knowledgeCategory.findMany({
      where: whereConditions,
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            description: true,
            orderIndex: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        },
        framework: {
          select: {
            id: true,
            name: true,
            version: true
          }
        },
        topic: {
          select: {
            id: true,
            name: true
          }
        },
        component: {
          select: {
            id: true,
            name: true
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
            articles: true,
            terms: true
          }
        }
      },
      orderBy: [
        { orderIndex: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching knowledge categories:', error)
    return NextResponse.json(
      { error: "Failed to fetch knowledge categories" },
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
      name,
      description,
      parentId,
      frameworkId,
      topicId,
      componentId,
      clauseId,
      orderIndex = 0
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      )
    }

    // Check if category name already exists at the same level
    const existingCategory = await prisma.knowledgeCategory.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        parentId: parentId || null,
        frameworkId: frameworkId || null
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this name already exists at this level" },
        { status: 400 }
      )
    }

    // Create category
    const category = await prisma.knowledgeCategory.create({
      data: {
        name,
        description,
        parentId,
        frameworkId,
        topicId,
        componentId,
        clauseId,
        orderIndex
      },
      include: {
        parent: {
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
        topic: {
          select: {
            id: true,
            name: true
          }
        },
        component: {
          select: {
            id: true,
            name: true
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

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating knowledge category:', error)
    return NextResponse.json(
      { error: "Failed to create knowledge category" },
      { status: 500 }
    )
  }
}
