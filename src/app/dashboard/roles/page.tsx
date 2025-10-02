"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Type assertion for session user with platformRole
type SessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  platformRole?: string
}
import { Shield, 
  Users, 
  Code, 
  Headphones, 
  User,
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  RefreshCw,
  AlertCircle,
  Settings,
  Eye,
  Lock,
  Unlock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
  createdAt: string
}

interface RoleStatistics {
  totalRoles: number
  systemRoles: number
  customRoles: number
}

export default function RolesManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [statistics, setStatistics] = useState<RoleStatistics>({
    totalRoles: 0,
    systemRoles: 0,
    customRoles: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/admin/roles")
      
      if (!response.ok) {
        throw new Error("Failed to fetch roles")
      }
      
      const data = await response.json()
      setRoles(data.roles)
      setStatistics({
        totalRoles: data.totalRoles,
        systemRoles: data.systemRoles,
        customRoles: data.customRoles
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching roles:", err)
    } finally {
      setLoading(false)
    }
  }

  // Handle add role - navigate to add page
  const handleAddRole = () => {
    router.push("/dashboard/roles/add")
  }

  // Handle edit role - navigate to edit page
  const handleEditRole = (role: Role) => {
    router.push(`/dashboard/roles/${role.id}/edit`)
  }

  // Handle delete role
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/roles?roleId=${roleId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete role")
      }

      await fetchRoles()
    } catch (error) {
      console.error("Error deleting role:", error)
      alert("Failed to delete role: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  // Fetch roles when component mounts
  useEffect(() => {
    if (session?.user) {
      fetchRoles()
    }
  }, [session])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if ((session.user as SessionUser)?.platformRole !== "SUPER_ADMIN" && (session.user as SessionUser)?.platformRole !== "PLATFORM_ADMIN") {
      router.push("/organizations")
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case "SUPER_ADMIN":
        return <Shield className="h-5 w-5 text-red-500" />
      case "PLATFORM_ADMIN":
        return <Users className="h-5 w-5 text-blue-500" />
      case "PLATFORM_DEVELOPER":
        return <Code className="h-5 w-5 text-purple-500" />
      case "PLATFORM_SUPPORT":
        return <Headphones className="h-5 w-5 text-orange-500" />
      case "USER":
        return <User className="h-5 w-5 text-green-500" />
      default:
        return <Shield className="h-5 w-5 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (roleId: string) => {
    switch (roleId) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-800"
      case "PLATFORM_ADMIN":
        return "bg-blue-100 text-blue-800"
      case "PLATFORM_DEVELOPER":
        return "bg-purple-100 text-purple-800"
      case "PLATFORM_SUPPORT":
        return "bg-orange-100 text-orange-800"
      case "USER":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatPermissions = (permissions: string[]) => {
    if (permissions.includes("*")) {
      return "All permissions"
    }
    return permissions.length > 3 
      ? `${permissions.slice(0, 3).join(", ")} +${permissions.length - 3} more`
      : permissions.join(", ")
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
              <p className="mt-2 text-gray-600">
                Manage platform roles and their access permissions
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={fetchRoles} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={handleAddRole}>
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : statistics.totalRoles}
              </div>
              <p className="text-xs text-muted-foreground">
                Platform roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Roles</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : statistics.systemRoles}
              </div>
              <p className="text-xs text-muted-foreground">
                Built-in roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
              <Unlock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : statistics.customRoles}
              </div>
              <p className="text-xs text-muted-foreground">
                User-defined roles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Roles ({loading ? "..." : roles.length})</CardTitle>
            <CardDescription>
              Manage role permissions and access levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 mx-auto text-gray-400 mb-4 animate-spin" />
                  <p className="text-gray-500">Loading roles...</p>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Permissions</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Users</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role) => (
                        <tr key={role.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              {getRoleIcon(role.id)}
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{role.name}</div>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(role.id)}`}>
                                  {role.id}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-900">{role.description}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-500 max-w-xs">
                              {formatPermissions(role.permissions)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">{role.userCount}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              {role.isSystem ? (
                                <>
                                  <Lock className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-500">System</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-500">Custom</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="ghost" size="sm" title="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Edit Role"
                                disabled={role.isSystem}
                                onClick={() => handleEditRole(role)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Delete Role"
                                disabled={role.isSystem || role.userCount > 0}
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteRole(role.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="More Options">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {roles.length === 0 && (
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
                      <p className="text-gray-500">
                        Get started by creating your first custom role
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role Permissions Reference */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Permission Reference
            </CardTitle>
            <CardDescription>
              Available permission types for role configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">User Management</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• users:read - View users</li>
                  <li>• users:write - Create/edit users</li>
                  <li>• users:delete - Delete users</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Organization Management</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• organizations:read - View organizations</li>
                  <li>• organizations:write - Create/edit organizations</li>
                  <li>• organizations:delete - Delete organizations</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">System Management</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• system:read - View system info</li>
                  <li>• system:write - Modify system settings</li>
                  <li>• audit:read - View audit logs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformAdminLayout>
  )
}
