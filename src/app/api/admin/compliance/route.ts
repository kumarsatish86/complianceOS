/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper function to check platform admin privileges
const checkPlatformAdmin = async (session: any) => {
  if (!session?.user) {
    return { error: "Unauthorized", status: 401 }
  }
  if (session.user.platformRole !== "SUPER_ADMIN" && session.user.platformRole !== "PLATFORM_ADMIN") {
    return { error: "Forbidden", status: 403 }
  }
  return null
}

// GET - Fetch compliance frameworks and statistics
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPlatformAdmin(await getServerSession(authOptions) as any)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const frameworkId = searchParams.get("frameworkId")

    // If frameworkId is provided, fetch individual framework
    if (frameworkId) {
      const framework = await prisma.complianceFramework.findUnique({
        where: { id: frameworkId },
        include: {
          topics: {
            include: {
              components: {
                include: {
                  clauses: true
                }
              }
            },
            orderBy: { orderIndex: "asc" }
          },
          organizationSelections: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        }
      })

      if (!framework) {
        return NextResponse.json({ error: "Framework not found" }, { status: 404 })
      }

      const topicCount = framework.topics.length
      const clauseCount = framework.topics.reduce((total, topic) => 
        total + topic.components.reduce((compTotal, component) => 
          compTotal + component.clauses.length, 0), 0)
      const organizationCount = framework.organizationSelections.length

      return NextResponse.json({
        ...framework,
        topicCount,
        clauseCount,
        organizationCount,
        effectiveDate: framework.effectiveDate?.toISOString(),
        createdAt: framework.createdAt.toISOString(),
        updatedAt: framework.updatedAt.toISOString(),
      })
    }

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { industryTags: { has: search } },
        { certificationBody: { contains: search, mode: "insensitive" } }
      ]
    }
    if (status !== "all") {
      where.isActive = status === "active"
    }

    const frameworks = await prisma.complianceFramework.findMany({
      where,
      include: {
        topics: {
          include: {
            components: {
              include: {
                clauses: true
              }
            }
          }
        },
        organizationSelections: {
          select: {
            organizationId: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    const frameworksWithCounts = frameworks.map(framework => {
      const topicCount = framework.topics.length
      const clauseCount = framework.topics.reduce((total, topic) => 
        total + topic.components.reduce((compTotal, component) => 
          compTotal + component.clauses.length, 0), 0)
      const organizationCount = framework.organizationSelections.length

      return {
        ...framework,
        topicCount,
        clauseCount,
        organizationCount,
        effectiveDate: framework.effectiveDate?.toISOString(),
        createdAt: framework.createdAt.toISOString(),
        updatedAt: framework.updatedAt.toISOString(),
      }
    })

    // Calculate statistics
    const totalFrameworks = await prisma.complianceFramework.count()
    const activeFrameworks = await prisma.complianceFramework.count({ where: { isActive: true } })
    const totalOrganizations = await prisma.organization.count()
    
    // Calculate compliant organizations (organizations with at least one active compliance selection)
    const compliantOrganizations = await prisma.organizationComplianceSelection.count({
      where: {
        isEnabled: true,
        organization: {
          status: "active"
        }
      }
    })

    // Calculate pending assessments
    const pendingAssessments = await prisma.complianceAssessment.count({
      where: {
        status: "IN_PROGRESS"
      }
    })

    // Calculate overdue items (assessments past due date)
    const overdueItems = await prisma.complianceAssessment.count({
      where: {
        status: "IN_PROGRESS",
        nextReviewDate: {
          lt: new Date()
        }
      }
    })

    return NextResponse.json({
      frameworks: frameworksWithCounts,
      statistics: {
        totalFrameworks,
        activeFrameworks,
        totalOrganizations,
        compliantOrganizations,
        pendingAssessments,
        overdueItems,
      },
    })
  } catch (error) {
    console.error("Error fetching compliance data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new compliance framework
export async function POST(request: NextRequest) {
  try {
    const authError = await checkPlatformAdmin(await getServerSession(authOptions) as any)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const body = await request.json()
    const { 
      name, 
      version, 
      description, 
      effectiveDate, 
      industryTags, 
      certificationBody, 
      documentationUrl 
    } = body

    if (!name || !version) {
      return NextResponse.json({ error: "Name and version are required" }, { status: 400 })
    }

    // Check for uniqueness
    const existingFramework = await prisma.complianceFramework.findUnique({
      where: { 
        name_version: {
          name,
          version
        }
      }
    })

    if (existingFramework) {
      return NextResponse.json({ error: "Framework with this name and version already exists" }, { status: 409 })
    }

    const newFramework = await prisma.complianceFramework.create({
      data: {
        name,
        version,
        description,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        industryTags: industryTags || [],
        certificationBody,
        documentationUrl,
      },
    })

    return NextResponse.json(newFramework, { status: 201 })
  } catch (error) {
    console.error("Error creating compliance framework:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update an existing compliance framework
export async function PUT(request: NextRequest) {
  try {
    const authError = await checkPlatformAdmin(await getServerSession(authOptions) as any)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const body = await request.json()
    const { 
      frameworkId,
      name, 
      version, 
      description, 
      effectiveDate, 
      industryTags, 
      certificationBody, 
      documentationUrl,
      isActive
    } = body

    if (!frameworkId) {
      return NextResponse.json({ error: "Framework ID is required" }, { status: 400 })
    }

    if (!name || !version) {
      return NextResponse.json({ error: "Name and version are required" }, { status: 400 })
    }

    // Check for uniqueness on update, excluding the current framework
    const existingFramework = await prisma.complianceFramework.findFirst({
      where: { 
        name,
        version,
        id: { not: frameworkId }
      }
    })

    if (existingFramework) {
      return NextResponse.json({ error: "Framework with this name and version already exists" }, { status: 409 })
    }

    const updatedFramework = await prisma.complianceFramework.update({
      where: { id: frameworkId },
      data: {
        name,
        version,
        description,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        industryTags: industryTags || [],
        certificationBody,
        documentationUrl,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(updatedFramework, { status: 200 })
  } catch (error) {
    console.error("Error updating compliance framework:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a compliance framework
export async function DELETE(request: NextRequest) {
  try {
    const authError = await checkPlatformAdmin(await getServerSession(authOptions) as any)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const { searchParams } = new URL(request.url)
    const frameworkId = searchParams.get("frameworkId")

    if (!frameworkId) {
      return NextResponse.json({ error: "Framework ID is required" }, { status: 400 })
    }

    // Check if the framework has unknown organization selections
    const organizationCount = await prisma.organizationComplianceSelection.count({
      where: { frameworkId }
    })

    if (organizationCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete framework. ${organizationCount} organizations are using this framework.` },
        { status: 400 }
      )
    }

    await prisma.complianceFramework.delete({
      where: { id: frameworkId },
    })

    return NextResponse.json({ message: "Framework deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting compliance framework:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
