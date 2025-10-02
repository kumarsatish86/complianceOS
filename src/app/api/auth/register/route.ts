import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, organizationName } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create organization slug
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if organization slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization with this name already exists" },
        { status: 400 }
      )
    }

    // Create user and organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          description: `Compliance management for ${organizationName}`,
        }
      })

      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          platformRoleId: "USER",
        }
      })

      // Create organization user relationship (as admin)
      await tx.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "Org Admin",
          department: "Administration",
        }
      })

      // Create default departments
      const defaultDepartments = [
        { name: "Administration", description: "Administrative functions" },
        { name: "Compliance", description: "Compliance management" },
        { name: "Infrastructure", description: "Infrastructure security" },
        { name: "Finance", description: "Financial management" },
      ]

      await tx.department.createMany({
        data: defaultDepartments.map(dept => ({
          ...dept,
          organizationId: organization.id,
        }))
      })

      // Create default permissions
      const defaultPermissions = [
        { name: "user_manage", description: "Manage users", module: "users", action: "manage" },
        { name: "compliance_read", description: "Read compliance data", module: "compliance", action: "read" },
        { name: "compliance_write", description: "Write compliance data", module: "compliance", action: "write" },
        { name: "infrastructure_read", description: "Read infrastructure data", module: "infrastructure", action: "read" },
        { name: "infrastructure_write", description: "Write infrastructure data", module: "infrastructure", action: "write" },
        { name: "finance_read", description: "Read financial data", module: "finance", action: "read" },
        { name: "finance_write", description: "Write financial data", module: "finance", action: "write" },
        { name: "reports_read", description: "Read reports", module: "reports", action: "read" },
        { name: "reports_write", description: "Write reports", module: "reports", action: "write" },
      ]

      await tx.organizationPermission.createMany({
        data: defaultPermissions.map(permission => ({
          ...permission,
          organizationId: organization.id,
        }))
      })

      // Create default roles
      const defaultRoles = [
        {
          name: "Org Admin",
          description: "Full organization access",
          permissions: ["user_manage", "compliance_read", "compliance_write", "infrastructure_read", "infrastructure_write", "finance_read", "finance_write", "reports_read", "reports_write"]
        },
        {
          name: "Compliance Manager",
          description: "Compliance management role",
          permissions: ["compliance_read", "compliance_write", "reports_read"]
        },
        {
          name: "Infrastructure Manager",
          description: "Infrastructure management role",
          permissions: ["infrastructure_read", "infrastructure_write", "reports_read"]
        },
        {
          name: "Finance Manager",
          description: "Financial management role",
          permissions: ["finance_read", "finance_write", "reports_read"]
        },
        {
          name: "Auditor",
          description: "Read-only access for auditing",
          permissions: ["compliance_read", "infrastructure_read", "finance_read", "reports_read"]
        }
      ]

      await tx.organizationRole.createMany({
        data: defaultRoles.map(role => ({
          ...role,
          organizationId: organization.id,
        }))
      })

      return { user, organization }
    })

    return NextResponse.json({
      message: "User and organization created successfully",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      }
    })

  } catch (error) {
    console.error("Registration error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
