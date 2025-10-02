/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch organizations with filtering and statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has platform admin privileges
    if (session.user.platformRole !== "SUPER_ADMIN" && session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const plan = searchParams.get("plan") || "all"

    // If organizationId is provided, fetch individual organization
    if (organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  platformRole: true,
                  createdAt: true,
                  updatedAt: true
                }
              }
            }
          },
          _count: {
            select: {
              users: true
            }
          }
        }
      })

      if (!organization) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 })
      }

      // Calculate admin count
      const adminCount = organization.users.filter(user => 
        user.user.platformRole?.name === "SUPER_ADMIN" || user.user.platformRole?.name === "PLATFORM_ADMIN"
      ).length

      return NextResponse.json({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        domain: organization.domain,
        status: organization.status,
        plan: organization.plan,
        userCount: organization._count.users,
        adminCount,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
        users: organization.users
      })
    }

    // Build where clause for filtering
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { domain: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } }
      ]
    }
    
    if (status !== "all") {
      where.status = status
    }
    
    if (plan !== "all") {
      where.plan = plan
    }

    // Fetch organizations with user counts
    const organizations = await prisma.organization.findMany({
      where,
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                platformRole: true
              }
            }
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Calculate statistics
    const totalOrganizations = await prisma.organization.count()
    const activeOrganizations = await prisma.organization.count({
      where: { status: "active" }
    })
    const enterpriseOrganizations = await prisma.organization.count({
      where: { plan: "enterprise" }
    })
    const totalUsers = await prisma.user.count()

    const formattedOrganizations = organizations.map(org => {
      const adminCount = org.users.filter(user => 
        user.user.platformRole?.name === "SUPER_ADMIN" || user.user.platformRole?.name === "PLATFORM_ADMIN"
      ).length

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        domain: org.domain,
        status: org.status,
        plan: org.plan,
        userCount: org._count.users,
        adminCount,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString()
      }
    })

    return NextResponse.json({
      organizations: formattedOrganizations,
      statistics: {
        totalOrganizations,
        activeOrganizations,
        enterpriseOrganizations,
        totalUsers
      }
    })

  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only SUPER_ADMIN can create organizations
    if (session.user.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, domain, slug, plan = "free", status = "active" } = body

    // Validate required fields
    if (!name || !domain) {
      return NextResponse.json(
        { error: "Name and domain are required" },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-')

    // Check if organization with same domain or slug already exists
    const existingOrg = await prisma.organization.findFirst({
      where: {
        OR: [
          { domain: domain },
          { slug: finalSlug }
        ]
      }
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization with this domain or slug already exists" },
        { status: 400 }
      )
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        domain,
        slug: finalSlug,
        plan,
        status
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      domain: organization.domain,
      status: organization.status,
      plan: organization.plan,
      userCount: organization._count.users,
      adminCount: 0,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update an organization
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only SUPER_ADMIN can update organizations
    if (session.user.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { organizationId, name, domain, slug, plan, status } = body

    // Validate required fields
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      )
    }

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Check for conflicts if domain or slug is being changed
    if (domain || slug) {
      const conflictOrg = await prisma.organization.findFirst({
        where: {
          AND: [
            { id: { not: organizationId } },
            {
              OR: [
                ...(domain ? [{ domain }] : []),
                ...(slug ? [{ slug }] : [])
              ]
            }
          ]
        }
      })

      if (conflictOrg) {
        return NextResponse.json(
          { error: "Organization with this domain or slug already exists" },
          { status: 400 }
        )
      }
    }

    // Update organization
    const updateData: any = {}
    if (name) updateData.name = name
    if (domain) updateData.domain = domain
    if (slug) updateData.slug = slug
    if (plan) updateData.plan = plan
    if (status) updateData.status = status

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                platformRole: true
              }
            }
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    const adminCount = organization.users.filter(user => 
      user.user.platformRole?.name === "SUPER_ADMIN" || user.user.platformRole?.name === "PLATFORM_ADMIN"
    ).length

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      domain: organization.domain,
      status: organization.status,
      plan: organization.plan,
      userCount: organization._count.users,
      adminCount,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString()
    })

  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete an organization
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only SUPER_ADMIN can delete organizations
    if (session.user.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      )
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Check if organization has users
    if (organization._count.users > 0) {
      return NextResponse.json(
        { error: `Cannot delete organization. ${organization._count.users} users are assigned to this organization.` },
        { status: 400 }
      )
    }

    // Delete organization
    await prisma.organization.delete({
      where: { id: organizationId }
    })

    return NextResponse.json({
      message: "Organization deleted successfully",
      deletedOrganizationId: organizationId
    })

  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
