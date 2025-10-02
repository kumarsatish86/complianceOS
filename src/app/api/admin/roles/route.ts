import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

// GET - Fetch all platform roles with their permissions
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

    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get("roleId")

    // If roleId is provided, fetch individual role
    if (roleId) {
      // Check if it's a system role
      const systemRoles = [
        {
          id: "SUPER_ADMIN",
          name: "Super Admin",
          description: "Full platform access with all permissions",
          permissions: ["*"], // All permissions
          isSystem: true
        },
        {
          id: "PLATFORM_ADMIN",
          name: "Platform Admin",
          description: "Platform management and user administration",
          permissions: [
            "users:read", "users:write", "users:delete",
            "organizations:read", "organizations:write", "organizations:delete",
            "settings:read", "settings:write",
            "audit:read",
            "system:read"
          ],
          isSystem: true
        },
        {
          id: "PLATFORM_DEVELOPER",
          name: "Platform Developer",
          description: "Development and technical access",
          permissions: [
            "system:read", "system:write",
            "audit:read",
            "organizations:read"
          ],
          isSystem: true
        },
        {
          id: "PLATFORM_SUPPORT",
          name: "Platform Support",
          description: "Support and troubleshooting access",
          permissions: [
            "users:read",
            "organizations:read",
            "audit:read",
            "system:read"
          ],
          isSystem: true
        },
        {
          id: "USER",
          name: "Platform User",
          description: "Basic platform access",
          permissions: [
            "profile:read", "profile:write"
          ],
          isSystem: true
        }
      ]

      const role = systemRoles.find(r => r.id === roleId)
      if (!role) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 })
      }

      const userCount = await prisma.user.count({ where: { platformRoleId: roleId } })
      
      return NextResponse.json({
        ...role,
        userCount
      })
    }

    // Get platform roles (these are enum values from the schema)
    const platformRoles = [
      {
        id: "SUPER_ADMIN",
        name: "Super Admin",
        description: "Full platform access with all permissions",
        permissions: ["*"], // All permissions
        userCount: await prisma.user.count({ where: { platformRoleId: "SUPER_ADMIN" } }),
        isSystem: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "PLATFORM_ADMIN",
        name: "Platform Admin",
        description: "Platform management and user administration",
        permissions: [
          "users:read", "users:write", "users:delete",
          "organizations:read", "organizations:write", "organizations:delete",
          "settings:read", "settings:write",
          "audit:read",
          "system:read"
        ],
        userCount: await prisma.user.count({ where: { platformRoleId: "PLATFORM_ADMIN" } }),
        isSystem: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "PLATFORM_DEVELOPER",
        name: "Platform Developer",
        description: "Development and technical access",
        permissions: [
          "system:read", "system:write",
          "audit:read",
          "organizations:read"
        ],
        userCount: await prisma.user.count({ where: { platformRoleId: "PLATFORM_DEVELOPER" } }),
        isSystem: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "PLATFORM_SUPPORT",
        name: "Platform Support",
        description: "Support and troubleshooting access",
        permissions: [
          "users:read",
          "organizations:read",
          "audit:read",
          "system:read"
        ],
        userCount: await prisma.user.count({ where: { platformRoleId: "PLATFORM_SUPPORT" } }),
        isSystem: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "USER",
        name: "Platform User",
        description: "Basic platform access",
        permissions: [
          "profile:read", "profile:write"
        ],
        userCount: await prisma.user.count({ where: { platformRoleId: "USER" } }),
        isSystem: true,
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json({
      roles: platformRoles,
      statistics: {
        totalRoles: platformRoles.length,
        systemRoles: platformRoles.filter(r => r.isSystem).length,
        customRoles: platformRoles.filter(r => !r.isSystem).length
      }
    })

  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a new custom role (for future extensibility)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only SUPER_ADMIN can create custom roles
    if (session.user.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, permissions } = body

    // Validate required fields
    if (!name || !description || !permissions) {
      return NextResponse.json(
        { error: "Name, description, and permissions are required" },
        { status: 400 }
      )
    }

    // Validate permissions array
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json(
        { error: "At least one permission must be selected" },
        { status: 400 }
      )
    }

    // For now, we'll return a success message but note that custom roles
    // would require schema changes to store them properly
    return NextResponse.json({
      message: "Custom role creation functionality is ready",
      note: "This would require extending the database schema to store custom roles",
      roleData: {
        name,
        description,
        permissions,
        isSystem: false
      }
    }, { status: 200 })

  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update role permissions (for system roles)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only SUPER_ADMIN can modify role permissions
    if (session.user.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { roleId, name, description, permissions } = body

    // Validate required fields
    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 }
      )
    }

    // Check if it's a system role
    const systemRoles = ["SUPER_ADMIN", "PLATFORM_ADMIN", "PLATFORM_DEVELOPER", "PLATFORM_SUPPORT", "USER"]
    if (systemRoles.includes(roleId)) {
      return NextResponse.json({
        message: "System roles cannot be modified",
        note: "System roles have predefined permissions that cannot be changed"
      }, { status: 400 })
    }

    // For custom roles, this would update the role
    return NextResponse.json({
      message: "Custom role update functionality is ready",
      note: "This would require extending the database schema to store custom roles",
      roleData: {
        id: roleId,
        name,
        description,
        permissions,
        isSystem: false
      }
    }, { status: 200 })

  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a custom role
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only SUPER_ADMIN can delete roles
    if (session.user.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get("roleId")

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 }
      )
    }

    // Check if it's a system role (cannot be deleted)
    const systemRoles = ["SUPER_ADMIN", "PLATFORM_ADMIN", "PLATFORM_DEVELOPER", "PLATFORM_SUPPORT", "USER"]
    if (systemRoles.includes(roleId)) {
      return NextResponse.json(
        { error: "Cannot delete system roles" },
        { status: 400 }
      )
    }

    // Check if any users are assigned to this role
    const userCount = await prisma.user.count({ where: { platformRoleId: roleId } })
    if (userCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete role. ${userCount} users are assigned to this role.` },
        { status: 400 }
      )
    }

    // For custom roles, this would delete the role
    return NextResponse.json({
      message: "Custom role deletion functionality is ready",
      note: "This would require extending the database schema to store custom roles",
      deletedRoleId: roleId
    }, { status: 200 })

  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
