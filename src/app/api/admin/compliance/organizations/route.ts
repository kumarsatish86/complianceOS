/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper function to check platform admin privileges
// const checkPlatformAdmin = async () => {
//   if (!session?.user) {
//     return { error: "Unauthorized", status: 401 }
//   }
//   if (session.user.platformRole !== "SUPER_ADMIN" && session.user.platformRole !== "PLATFORM_ADMIN") {
//     return { error: "Forbidden", status: 403 }
//   }
//   return null
// }

// Helper function to check organization admin privileges
const checkOrganizationAccess = async (session: any, organizationId: string) => {
  if (!session?.user) {
    return { error: "Unauthorized", status: 401 }
  }
  
  // Platform admins can access any organization
  if (session.user.platformRole === "SUPER_ADMIN" || session.user.platformRole === "PLATFORM_ADMIN") {
    return null
  }
  
  // Check if user belongs to the organization
  const userOrg = await prisma.organizationUser.findFirst({
    where: {
      userId: session.user.id,
      organizationId: organizationId,
      isActive: true
    }
  })
  
  if (!userOrg) {
    return { error: "Forbidden", status: 403 }
  }
  
  return null
}

// GET - Fetch organization compliance selections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")
    const frameworkId = searchParams.get("frameworkId")
    const status = searchParams.get("status") || "all"

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions) as any
    const authError = await checkOrganizationAccess(session, organizationId)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const where: any = { organizationId }
    if (frameworkId) {
      where.frameworkId = frameworkId
    }
    if (status !== "all") {
      where.isEnabled = status === "enabled"
    }

    const selections = await prisma.organizationComplianceSelection.findMany({
      where,
      include: {
        framework: {
          select: {
            id: true,
            name: true,
            version: true,
            description: true,
            industryTags: true,
            isActive: true
          }
        },
        clause: {
          select: {
            id: true,
            clauseId: true,
            title: true,
            description: true,
            riskLevel: true,
            component: {
              select: {
                name: true,
                topic: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { framework: { name: "asc" } },
        { clause: { clauseId: "asc" } }
      ]
    })

    // Group selections by framework
    const frameworkGroups = selections.reduce((acc, selection) => {
      const frameworkKey = selection.framework.id
      if (!acc[frameworkKey]) {
        acc[frameworkKey] = {
          framework: selection.framework,
          selections: []
        }
      }
      acc[frameworkKey].selections.push(selection)
      return acc
    }, {} as any)

    // Calculate statistics
    const totalSelections = selections.length
    const enabledSelections = selections.filter(s => s.isEnabled).length
    const disabledSelections = totalSelections - enabledSelections
    const frameworksCount = Object.keys(frameworkGroups).length

    return NextResponse.json({
      selections: Object.values(frameworkGroups),
      statistics: {
        totalSelections,
        enabledSelections,
        disabledSelections,
        frameworksCount
      }
    })
  } catch (error) {
    console.error("Error fetching organization compliance selections:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create organization compliance selection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, frameworkId, clauseIds, isEnabled, internalDeadline, riskTolerance, internalOwner, notes } = body

    if (!organizationId || !frameworkId) {
      return NextResponse.json({ error: "Organization ID and Framework ID are required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions) as any
    const authError = await checkOrganizationAccess(session, organizationId)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    // If clauseIds is provided, create selections for specific clauses
    if (clauseIds && Array.isArray(clauseIds)) {
      const selections = []
      
      for (const clauseId of clauseIds) {
        // Check if selection already exists
        const existingSelection = await prisma.organizationComplianceSelection.findUnique({
          where: {
            organizationId_frameworkId_clauseId: {
              organizationId,
              frameworkId,
              clauseId
            }
          }
        })

        if (!existingSelection) {
          const selection = await prisma.organizationComplianceSelection.create({
            data: {
              organizationId,
              frameworkId,
              clauseId,
              isEnabled: isEnabled !== undefined ? isEnabled : true,
              internalDeadline: internalDeadline ? new Date(internalDeadline) : null,
              riskTolerance: riskTolerance || "MEDIUM",
              internalOwner: internalOwner || null,
              notes: notes || null
            }
          })
          selections.push(selection)
        }
      }

      return NextResponse.json({ selections }, { status: 201 })
    }

    // Create framework-level selection (no specific clauses)
    const existingFrameworkSelection = await prisma.organizationComplianceSelection.findFirst({
      where: {
        organizationId,
        frameworkId,
        clauseId: null
      }
    })

    if (existingFrameworkSelection) {
      return NextResponse.json({ error: "Framework selection already exists" }, { status: 409 })
    }

    const newSelection = await prisma.organizationComplianceSelection.create({
      data: {
        organizationId,
        frameworkId,
        clauseId: null,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        internalDeadline: internalDeadline ? new Date(internalDeadline) : null,
        riskTolerance: riskTolerance || "MEDIUM",
        internalOwner: internalOwner || null,
        notes: notes || null
      }
    })

    return NextResponse.json(newSelection, { status: 201 })
  } catch (error) {
    console.error("Error creating organization compliance selection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update organization compliance selection
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { selectionId, isEnabled, internalDeadline, riskTolerance, internalOwner, notes } = body

    if (!selectionId) {
      return NextResponse.json({ error: "Selection ID is required" }, { status: 400 })
    }

    // Get the selection to check organization access
    const existingSelection = await prisma.organizationComplianceSelection.findUnique({
      where: { id: selectionId },
      select: { organizationId: true }
    })

    if (!existingSelection) {
      return NextResponse.json({ error: "Selection not found" }, { status: 404 })
    }

    const session = await getServerSession(authOptions) as any
    const authError = await checkOrganizationAccess(session, existingSelection.organizationId)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const updatedSelection = await prisma.organizationComplianceSelection.update({
      where: { id: selectionId },
      data: {
        isEnabled: isEnabled !== undefined ? isEnabled : undefined,
        internalDeadline: internalDeadline ? new Date(internalDeadline) : undefined,
        riskTolerance: riskTolerance || undefined,
        internalOwner: internalOwner !== undefined ? internalOwner : undefined,
        notes: notes !== undefined ? notes : undefined,
      }
    })

    return NextResponse.json(updatedSelection)
  } catch (error) {
    console.error("Error updating organization compliance selection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete organization compliance selection
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const selectionId = searchParams.get("selectionId")

    if (!selectionId) {
      return NextResponse.json({ error: "Selection ID is required" }, { status: 400 })
    }

    // Get the selection to check organization access
    const existingSelection = await prisma.organizationComplianceSelection.findUnique({
      where: { id: selectionId },
      select: { organizationId: true }
    })

    if (!existingSelection) {
      return NextResponse.json({ error: "Selection not found" }, { status: 404 })
    }

    const session = await getServerSession(authOptions) as any
    const authError = await checkOrganizationAccess(session, existingSelection.organizationId)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    await prisma.organizationComplianceSelection.delete({
      where: { id: selectionId }
    })

    return NextResponse.json({ message: "Selection deleted successfully" })
  } catch (error) {
    console.error("Error deleting organization compliance selection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
