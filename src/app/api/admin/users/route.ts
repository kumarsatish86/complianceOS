import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null as Session | null
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has platform admin privileges
    if (session.user.platformRole !== "SUPER_ADMIN" && session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || "all"

    // If userId is provided, fetch individual user
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          platformRole: true,
          organizationUsers: {
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

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        platformRole: user.platformRole,
        organizationId: user.organizationUsers[0]?.organization?.id,
        organization: user.organizationUsers[0]?.organization,
        createdAt: user.createdAt.toISOString()
      })
    }

    // Build where clause for filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    }

    if (role !== "all") {
      where.platformRole = role
    }

    // Fetch users with organization relationships
    const users = await prisma.user.findMany({
      where,
      include: {
        platformRole: true,
        organizationUsers: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        sessions: {
          orderBy: {
            expires: "desc"
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform the data for the frontend
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name || "Unknown",
      email: user.email,
      platformRole: user.platformRole,
      status: user.emailVerified ? "active" : "pending",
      lastLogin: user.sessions[0]?.expires ? user.sessions[0].expires.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      organizations: user.organizationUsers.map(ou => ({
        id: ou.organization.id,
        name: ou.organization.name,
        slug: ou.organization.slug,
        role: ou.role,
        isActive: ou.isActive
      }))
    }))

    // Get user statistics
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({
      where: { emailVerified: { not: null } }
    })
    const pendingUsers = await prisma.user.count({
      where: { emailVerified: null }
    })
    const adminUsers = await prisma.user.count({
      where: {
        platformRoleId: {
          in: ["SUPER_ADMIN", "PLATFORM_ADMIN"]
        }
      }
    })

    return NextResponse.json({
      users: transformedUsers,
      statistics: {
        totalUsers,
        activeUsers,
        pendingUsers,
        adminUsers
      }
    })

  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has platform admin privileges
    if (session.user.platformRole !== "SUPER_ADMIN" && session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, platformRole, password } = body

    // Validate required fields
    if (!name || !email || !platformRole) {
      return NextResponse.json(
        { error: "Name, email, and platform role are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        platformRole,
        password: password ? await hashPassword(password) : null,
        emailVerified: new Date(), // Auto-verify for admin-created users
      }
    })

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        platformRole: newUser.platformRoleId,
        status: "active",
        createdAt: newUser.createdAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has platform admin privileges
    if (session.user.platformRole !== "SUPER_ADMIN" && session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, platformRole } = body

    // Validate required fields
    if (!userId || !platformRole) {
      return NextResponse.json(
        { error: "User ID and platform role are required" },
        { status: 400 }
      )
    }

    // Validate platform role
    const validRoles = ["SUPER_ADMIN", "PLATFORM_ADMIN", "PLATFORM_DEVELOPER", "PLATFORM_SUPPORT", "USER"]
    if (!validRoles.includes(platformRole)) {
      return NextResponse.json(
        { error: "Invalid platform role" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Prevent users from changing their own role (security measure)
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      )
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { platformRoleId: platformRole },
      include: {
        platformRole: true,
        organizationUsers: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        sessions: {
          orderBy: {
            expires: "desc"
          },
          take: 1
        }
      }
    })

    return NextResponse.json({
      message: "User role updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        platformRole: updatedUser.platformRole,
        status: updatedUser.emailVerified ? "active" : "pending",
        createdAt: updatedUser.createdAt.toISOString(),
        organizations: updatedUser.organizationUsers.map(ou => ({
          id: ou.organization.id,
          name: ou.organization.name,
          slug: ou.organization.slug,
          role: ou.role,
          isActive: ou.isActive
        }))
      }
    })

  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has platform admin privileges
    if (session.user.platformRole !== "SUPER_ADMIN" && session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Prevent users from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Delete user (this will cascade delete related records due to onDelete: Cascade)
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      message: "User deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to hash password (you might want to use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  // This is a placeholder - implement proper password hashing
  return password // Replace with actual hashing logic
}
