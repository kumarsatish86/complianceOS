/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper function to check organization access
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

// GET - Fetch evidence submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")
    const clauseId = searchParams.get("clauseId")
    const status = searchParams.get("status") || "all"
    const evidenceId = searchParams.get("evidenceId")

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions) as any
    const authError = await checkOrganizationAccess(session, organizationId)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    // If evidenceId is provided, fetch individual evidence
    if (evidenceId) {
      const evidence = await prisma.evidenceSubmission.findUnique({
        where: { id: evidenceId },
        include: {
          clause: {
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
          }
        }
      })

      if (!evidence) {
        return NextResponse.json({ error: "Evidence not found" }, { status: 404 })
      }

      return NextResponse.json({
        ...evidence,
        submittedAt: evidence.submittedAt.toISOString(),
        reviewedAt: evidence.reviewedAt?.toISOString(),
      })
    }

    const where: Record<string, unknown> = { organizationId }
    if (clauseId) {
      where.clauseId = clauseId
    }
    if (status !== "all") {
      where.reviewStatus = status.toUpperCase()
    }

    const evidenceSubmissions = await prisma.evidenceSubmission.findMany({
      where,
      include: {
        clause: {
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
        }
      },
      orderBy: { submittedAt: "desc" }
    })

    // Group evidence by clause
    const clauseGroups = evidenceSubmissions.reduce((acc, evidence) => {
      const clauseKey = evidence.clause.id
      if (!acc[clauseKey]) {
        acc[clauseKey] = {
          clause: evidence.clause,
          evidence: []
        }
      }
      acc[clauseKey].evidence.push(evidence)
      return acc
    }, {} as Record<string, any>)

    // Calculate statistics
    const totalEvidence = evidenceSubmissions.length
    const pendingEvidence = evidenceSubmissions.filter(e => e.reviewStatus === "PENDING").length
    const approvedEvidence = evidenceSubmissions.filter(e => e.reviewStatus === "APPROVED").length
    const rejectedEvidence = evidenceSubmissions.filter(e => e.reviewStatus === "REJECTED").length

    return NextResponse.json({
      evidenceGroups: Object.values(clauseGroups),
      statistics: {
        totalEvidence,
        pendingEvidence,
        approvedEvidence,
        rejectedEvidence
      }
    })
  } catch (error) {
    console.error("Error fetching evidence submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create evidence submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, clauseId, fileName, filePath, fileSize, mimeType, description, tags } = body

    if (!organizationId || !clauseId || !fileName || !filePath || !fileSize || !mimeType) {
      return NextResponse.json({ error: "Organization ID, clause ID, file name, path, size, and MIME type are required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions) as any
    const authError = await checkOrganizationAccess(session, organizationId)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    // Get the latest version for this clause
    const latestEvidence = await prisma.evidenceSubmission.findFirst({
      where: { clauseId },
      orderBy: { version: "desc" }
    })

    const nextVersion = latestEvidence ? latestEvidence.version + 1 : 1

    // Mark previous versions as not latest
    if (latestEvidence) {
      await prisma.evidenceSubmission.updateMany({
        where: { clauseId },
        data: { isLatest: false }
      })
    }

    const newEvidence = await prisma.evidenceSubmission.create({
      data: {
        organizationId,
        clauseId,
        fileName,
        filePath,
        fileSize: parseInt(fileSize),
        mimeType,
        description: description || null,
        tags: tags || [],
        version: nextVersion,
        isLatest: true,
        submittedBy: session.user.id,
      }
    })

    return NextResponse.json(newEvidence, { status: 201 })
  } catch (error) {
    console.error("Error creating evidence submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update evidence submission (review)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { evidenceId, reviewStatus, reviewNotes } = body

    if (!evidenceId || !reviewStatus) {
      return NextResponse.json({ error: "Evidence ID and review status are required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions) as any
    
    // Get the evidence to check organization access
    const existingEvidence = await prisma.evidenceSubmission.findUnique({
      where: { id: evidenceId },
      select: { organizationId: true }
    })

    if (!existingEvidence) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 })
    }

    const authError = await checkOrganizationAccess(session, existingEvidence.organizationId)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const updatedEvidence = await prisma.evidenceSubmission.update({
      where: { id: evidenceId },
      data: {
        reviewStatus: reviewStatus.toUpperCase(),
        reviewNotes: reviewNotes || null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      }
    })

    return NextResponse.json(updatedEvidence)
  } catch (error) {
    console.error("Error updating evidence submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete evidence submission
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const evidenceId = searchParams.get("evidenceId")

    if (!evidenceId) {
      return NextResponse.json({ error: "Evidence ID is required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions) as any
    
    // Get the evidence to check organization access
    const existingEvidence = await prisma.evidenceSubmission.findUnique({
      where: { id: evidenceId },
      select: { organizationId: true }
    })

    if (!existingEvidence) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 })
    }

    const authError = await checkOrganizationAccess(session, existingEvidence.organizationId)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    await prisma.evidenceSubmission.delete({
      where: { id: evidenceId }
    })

    return NextResponse.json({ message: "Evidence deleted successfully" })
  } catch (error) {
    console.error("Error deleting evidence submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
