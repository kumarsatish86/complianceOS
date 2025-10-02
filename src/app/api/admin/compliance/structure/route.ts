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

// GET - Fetch framework structure (topics, components, clauses)
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPlatformAdmin(await getServerSession(authOptions) as any)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const { searchParams } = new URL(request.url)
    const frameworkId = searchParams.get("frameworkId")
    const topicId = searchParams.get("topicId")
    const componentId = searchParams.get("componentId")
    const clauseId = searchParams.get("clauseId")

    if (!frameworkId) {
      return NextResponse.json({ error: "Framework ID is required" }, { status: 400 })
    }

    // Fetch individual clause
    if (clauseId) {
      const clause = await prisma.complianceClause.findUnique({
        where: { id: clauseId },
        include: {
          component: {
            include: {
              topic: {
                include: {
                  framework: true
                }
              }
            }
          }
        }
      })

      if (!clause) {
        return NextResponse.json({ error: "Clause not found" }, { status: 404 })
      }

      return NextResponse.json({
        ...clause,
        createdAt: clause.createdAt.toISOString(),
        updatedAt: clause.updatedAt.toISOString(),
      })
    }

    // Fetch individual component
    if (componentId) {
      const component = await prisma.complianceComponent.findUnique({
        where: { id: componentId },
        include: {
          topic: {
            include: {
              framework: true
            }
          },
          clauses: {
            orderBy: { clauseId: "asc" }
          }
        }
      })

      if (!component) {
        return NextResponse.json({ error: "Component not found" }, { status: 404 })
      }

      return NextResponse.json({
        ...component,
        createdAt: component.createdAt.toISOString(),
        updatedAt: component.updatedAt.toISOString(),
        clauses: component.clauses.map(clause => ({
          ...clause,
          createdAt: clause.createdAt.toISOString(),
          updatedAt: clause.updatedAt.toISOString(),
        }))
      })
    }

    // Fetch individual topic
    if (topicId) {
      const topic = await prisma.complianceTopic.findUnique({
        where: { id: topicId },
        include: {
          framework: true,
          components: {
            include: {
              clauses: {
                orderBy: { clauseId: "asc" }
              }
            },
            orderBy: { orderIndex: "asc" }
          }
        }
      })

      if (!topic) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 })
      }

      return NextResponse.json({
        ...topic,
        createdAt: topic.createdAt.toISOString(),
        updatedAt: topic.updatedAt.toISOString(),
        components: topic.components.map(component => ({
          ...component,
          createdAt: component.createdAt.toISOString(),
          updatedAt: component.updatedAt.toISOString(),
          clauses: component.clauses.map(clause => ({
            ...clause,
            createdAt: clause.createdAt.toISOString(),
            updatedAt: clause.updatedAt.toISOString(),
          }))
        }))
      })
    }

    // Fetch all topics for framework
    const topics = await prisma.complianceTopic.findMany({
      where: { frameworkId },
      include: {
        components: {
          include: {
            clauses: {
              orderBy: { clauseId: "asc" }
            }
          },
          orderBy: { orderIndex: "asc" }
        }
      },
      orderBy: { orderIndex: "asc" }
    })

    const topicsWithTimestamps = topics.map(topic => ({
      ...topic,
      createdAt: topic.createdAt.toISOString(),
      updatedAt: topic.updatedAt.toISOString(),
      components: topic.components.map(component => ({
        ...component,
        createdAt: component.createdAt.toISOString(),
        updatedAt: component.updatedAt.toISOString(),
        clauses: component.clauses.map(clause => ({
          ...clause,
          createdAt: clause.createdAt.toISOString(),
          updatedAt: clause.updatedAt.toISOString(),
        }))
      }))
    }))

    return NextResponse.json({ topics: topicsWithTimestamps })
  } catch (error) {
    console.error("Error fetching framework structure:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create topic, component, or clause
export async function POST(request: NextRequest) {
  try {
    const authError = await checkPlatformAdmin(await getServerSession(authOptions) as any)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const body = await request.json()
    const { type, frameworkId, topicId, componentId, ...data } = body

    if (!type || !frameworkId) {
      return NextResponse.json({ error: "Type and framework ID are required" }, { status: 400 })
    }

    switch (type) {
      case "topic":
        if (!data.name) {
          return NextResponse.json({ error: "Topic name is required" }, { status: 400 })
        }

        // Get next order index
        const lastTopic = await prisma.complianceTopic.findFirst({
          where: { frameworkId },
          orderBy: { orderIndex: "desc" }
        })
        const nextOrderIndex = lastTopic ? lastTopic.orderIndex + 1 : 0

        const newTopic = await prisma.complianceTopic.create({
          data: {
            frameworkId,
            name: data.name.trim(),
            description: data.description?.trim() || null,
            orderIndex: nextOrderIndex,
          }
        })

        return NextResponse.json({
          ...newTopic,
          createdAt: newTopic.createdAt.toISOString(),
          updatedAt: newTopic.updatedAt.toISOString(),
        }, { status: 201 })

      case "component":
        if (!topicId || !data.name) {
          return NextResponse.json({ error: "Topic ID and component name are required" }, { status: 400 })
        }

        // Get next order index
        const lastComponent = await prisma.complianceComponent.findFirst({
          where: { topicId },
          orderBy: { orderIndex: "desc" }
        })
        const nextComponentOrderIndex = lastComponent ? lastComponent.orderIndex + 1 : 0

        const newComponent = await prisma.complianceComponent.create({
          data: {
            topicId,
            name: data.name.trim(),
            description: data.description?.trim() || null,
            orderIndex: nextComponentOrderIndex,
          }
        })

        return NextResponse.json({
          ...newComponent,
          createdAt: newComponent.createdAt.toISOString(),
          updatedAt: newComponent.updatedAt.toISOString(),
        }, { status: 201 })

      case "clause":
        if (!componentId || !data.clauseId || !data.title || !data.description) {
          return NextResponse.json({ error: "Component ID, clause ID, title, and description are required" }, { status: 400 })
        }

        // Check for uniqueness
        const existingClause = await prisma.complianceClause.findFirst({
          where: {
            componentId,
            clauseId: data.clauseId
          }
        })

        if (existingClause) {
          return NextResponse.json({ error: "Clause ID already exists in this component" }, { status: 409 })
        }

        const newClause = await prisma.complianceClause.create({
          data: {
            componentId,
            clauseId: data.clauseId.trim(),
            title: data.title.trim(),
            description: data.description.trim(),
            implementationGuidance: data.implementationGuidance?.trim() || null,
            evidenceRequirements: data.evidenceRequirements?.trim() || null,
            riskLevel: data.riskLevel || "MEDIUM",
            testingProcedures: data.testingProcedures?.trim() || null,
          }
        })

        return NextResponse.json({
          ...newClause,
          createdAt: newClause.createdAt.toISOString(),
          updatedAt: newClause.updatedAt.toISOString(),
        }, { status: 201 })

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error creating framework structure:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update topic, component, or clause
export async function PUT(request: NextRequest) {
  try {
    const authError = await checkPlatformAdmin(await getServerSession(authOptions) as any)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const body = await request.json()
    const { type, id, ...data } = body

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 })
    }

    switch (type) {
      case "topic":
        if (!data.name) {
          return NextResponse.json({ error: "Topic name is required" }, { status: 400 })
        }

        const updatedTopic = await prisma.complianceTopic.update({
          where: { id },
          data: {
            name: data.name.trim(),
            description: data.description?.trim() || null,
            orderIndex: data.orderIndex !== undefined ? data.orderIndex : undefined,
          }
        })

        return NextResponse.json({
          ...updatedTopic,
          createdAt: updatedTopic.createdAt.toISOString(),
          updatedAt: updatedTopic.updatedAt.toISOString(),
        })

      case "component":
        if (!data.name) {
          return NextResponse.json({ error: "Component name is required" }, { status: 400 })
        }

        const updatedComponent = await prisma.complianceComponent.update({
          where: { id },
          data: {
            name: data.name.trim(),
            description: data.description?.trim() || null,
            orderIndex: data.orderIndex !== undefined ? data.orderIndex : undefined,
          }
        })

        return NextResponse.json({
          ...updatedComponent,
          createdAt: updatedComponent.createdAt.toISOString(),
          updatedAt: updatedComponent.updatedAt.toISOString(),
        })

      case "clause":
        if (!data.clauseId || !data.title || !data.description) {
          return NextResponse.json({ error: "Clause ID, title, and description are required" }, { status: 400 })
        }

        // Check for uniqueness on update
        const existingClause = await prisma.complianceClause.findFirst({
          where: {
            clauseId: data.clauseId,
            componentId: data.componentId,
            id: { not: id }
          }
        })

        if (existingClause) {
          return NextResponse.json({ error: "Clause ID already exists in this component" }, { status: 409 })
        }

        const updatedClause = await prisma.complianceClause.update({
          where: { id },
          data: {
            clauseId: data.clauseId.trim(),
            title: data.title.trim(),
            description: data.description.trim(),
            implementationGuidance: data.implementationGuidance?.trim() || null,
            evidenceRequirements: data.evidenceRequirements?.trim() || null,
            riskLevel: data.riskLevel || "MEDIUM",
            testingProcedures: data.testingProcedures?.trim() || null,
          }
        })

        return NextResponse.json({
          ...updatedClause,
          createdAt: updatedClause.createdAt.toISOString(),
          updatedAt: updatedClause.updatedAt.toISOString(),
        })

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating framework structure:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete topic, component, or clause
export async function DELETE(request: NextRequest) {
  try {
    const authError = await checkPlatformAdmin(await getServerSession(authOptions) as any)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 })
    }

    switch (type) {
      case "topic":
        // Check if topic has components
        const componentCount = await prisma.complianceComponent.count({
          where: { topicId: id }
        })

        if (componentCount > 0) {
          return NextResponse.json(
            { error: `Cannot delete topic. ${componentCount} components are assigned to this topic.` },
            { status: 400 }
          )
        }

        await prisma.complianceTopic.delete({
          where: { id }
        })

        return NextResponse.json({ message: "Topic deleted successfully" })

      case "component":
        // Check if component has clauses
        const clauseCount = await prisma.complianceClause.count({
          where: { componentId: id }
        })

        if (clauseCount > 0) {
          return NextResponse.json(
            { error: `Cannot delete component. ${clauseCount} clauses are assigned to this component.` },
            { status: 400 }
          )
        }

        await prisma.complianceComponent.delete({
          where: { id }
        })

        return NextResponse.json({ message: "Component deleted successfully" })

      case "clause":
        // Check if clause has organization selections or evidence
        const organizationCount = await prisma.organizationComplianceSelection.count({
          where: { clauseId: id }
        })

        const evidenceCount = await prisma.evidenceSubmission.count({
          where: { clauseId: id }
        })

        if (organizationCount > 0 || evidenceCount > 0) {
          return NextResponse.json(
            { error: `Cannot delete clause. ${organizationCount} organizations and ${evidenceCount} evidence submissions are associated with this clause.` },
            { status: 400 }
          )
        }

        await prisma.complianceClause.delete({
          where: { id }
        })

        return NextResponse.json({ message: "Clause deleted successfully" })

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error deleting framework structure:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
