"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

// Type assertion for session user with platformRole
type SessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  platformRole?: string
}
import { ArrowLeft,
  Save,
  Shield,
  Check,
  Square,
  Settings,
  Building,
  FileText,
  Activity,
  AlertCircle,
  Users } from "lucide-react"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"


interface RoleFormData {
  name: string
  description: string
  permissions: string[]
}

const permissionModules = [
  {
    id: "users",
    name: "User Management",
    icon: Users,
    permissions: [
      { id: "users:read", name: "View Users", description: "View user list and details" },
      { id: "users:write", name: "Create/Edit Users", description: "Create and edit user accounts" },
      { id: "users:delete", name: "Delete Users", description: "Delete user accounts" },
      { id: "users:roles", name: "Manage User Roles", description: "Assign and change user roles" }
    ]
  },
  {
    id: "organizations",
    name: "Organization Management",
    icon: Building,
    permissions: [
      { id: "organizations:read", name: "View Organizations", description: "View organization list and details" },
      { id: "organizations:write", name: "Create/Edit Organizations", description: "Create and edit organizations" },
      { id: "organizations:delete", name: "Delete Organizations", description: "Delete organizations" },
      { id: "organizations:members", name: "Manage Members", description: "Add/remove organization members" }
    ]
  },
  {
    id: "roles",
    name: "Role Management",
    icon: Shield,
    permissions: [
      { id: "roles:read", name: "View Roles", description: "View role list and details" },
      { id: "roles:write", name: "Create/Edit Roles", description: "Create and edit custom roles" },
      { id: "roles:delete", name: "Delete Roles", description: "Delete custom roles" },
      { id: "roles:permissions", name: "Manage Permissions", description: "Assign permissions to roles" }
    ]
  },
  {
    id: "system",
    name: "System Management",
    icon: Settings,
    permissions: [
      { id: "system:read", name: "View System Info", description: "View system status and information" },
      { id: "system:write", name: "Modify Settings", description: "Change system settings" },
      { id: "system:backup", name: "Manage Backups", description: "Create and restore backups" },
      { id: "system:logs", name: "View System Logs", description: "Access system logs" }
    ]
  },
  {
    id: "audit",
    name: "Audit & Compliance",
    icon: FileText,
    permissions: [
      { id: "audit:read", name: "View Audit Logs", description: "View audit trail and logs" },
      { id: "audit:export", name: "Export Audit Data", description: "Export audit logs and reports" },
      { id: "audit:settings", name: "Audit Settings", description: "Configure audit settings" }
    ]
  },
  {
    id: "monitoring",
    name: "Monitoring & Health",
    icon: Activity,
    permissions: [
      { id: "monitoring:read", name: "View System Health", description: "View system health metrics" },
      { id: "monitoring:alerts", name: "Manage Alerts", description: "Configure system alerts" },
      { id: "monitoring:reports", name: "Generate Reports", description: "Create monitoring reports" }
    ]
  }
]

export default function AddRolePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    permissions: []
  })
  const [errors, setErrors] = useState<Partial<RoleFormData>>({})
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if ((session.user as SessionUser)?.platformRole !== "SUPER_ADMIN") {
      router.push("/dashboard")
      return
    }
  }, [session, status, router])

  const validateForm = (): boolean => {
    const newErrors: Partial<RoleFormData> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Role name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Role name must be at least 2 characters"
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Role description is required"
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    }

    // Permissions validation
    if (formData.permissions.length === 0) {
      newErrors.permissions = ["At least one permission must be selected"]
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create role")
      }

      // Redirect back to Redirect back to roles management page
      router.push("/dashboard/roles")
    } catch (error) {
      console.error("Error creating role:", error)
      alert("Failed to create role: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof RoleFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const togglePermission = (permissionId: string) => {
    const newPermissions = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId]
    
    handleInputChange("permissions", newPermissions)
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    )
  }

  const selectAllInModule = (module: typeof permissionModules[0]) => {
    const modulePermissions = module.permissions.map(p => p.id)
    const allSelected = modulePermissions.every(p => formData.permissions.includes(p))
    
    if (allSelected) {
      // Deselect all
      const newPermissions = formData.permissions.filter(p => !modulePermissions.includes(p))
      handleInputChange("permissions", newPermissions)
    } else {
      // Select all
      const newPermissions = [...new Set([...formData.permissions, ...modulePermissions])]
      handleInputChange("permissions", newPermissions)
    }
  }

  if (status === "loading") {
    return (
      <PlatformAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PlatformAdminLayout>
    )
  }

  return (
    <PlatformAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Role</h1>
              <p className="text-gray-600">Create a new custom role with specific permissions</p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Dashboard</span>
          <span>/</span>
          <button 
            onClick={() => router.push("/dashboard/roles")}
            className="hover:text-primary"
          >
            Roles Management
          </button>
          <span>/</span>
          <span className="text-gray-900">Create Role</span>
        </nav>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Provide basic information about the role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter role name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`pl-10 ${errors.name ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                </div>
                {errors.name && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Describe the role's purpose and responsibilities"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                    errors.description ? "border-red-500" : ""
                  }`}
                  rows={4}
                  disabled={loading}
                />
                {errors.description && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.description}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Permissions
                </div>
                <div className="text-sm text-gray-500">
                  {formData.permissions.length} permission{formData.permissions.length !== 1 ? 's' : ''} selected
                </div>
              </CardTitle>
              <CardDescription>
                Select the permissions this role should have access to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissionModules.map((module) => {
                  const Icon = module.icon
                  const isExpanded = expandedModules.includes(module.id)
                  const modulePermissions = module.permissions.map(p => p.id)
                  const selectedInModule = modulePermissions.filter(p => formData.permissions.includes(p)).length
                  const allSelected = selectedInModule === modulePermissions.length

                  return (
                    <div key={module.id} className="border border-gray-200 rounded-lg">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900">{module.name}</div>
                            <div className="text-sm text-gray-500">
                              {selectedInModule}/{modulePermissions.length} permissions selected
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              selectAllInModule(module)
                            }}
                            disabled={loading}
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </Button>
                          <div className="text-gray-400 text-lg">
                            {isExpanded ? "−" : "+"}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {module.permissions.map((permission) => {
                              const isSelected = formData.permissions.includes(permission.id)
                              
                              return (
                                <div
                                  key={permission.id}
                                  className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                                    isSelected 
                                      ? "border-blue-200 bg-blue-50" 
                                      : "border-gray-200 bg-white hover:bg-gray-50"
                                  }`}
                                  onClick={() => togglePermission(permission.id)}
                                >
                                  <div className="flex items-center mr-3 mt-0.5">
                                    {isSelected ? (
                                      <Check className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <Square className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-900">
                                      {permission.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {permission.description}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {errors.permissions && (
                <div className="flex items-center text-sm text-red-600 mt-4">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.permissions}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Create Role
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PlatformAdminLayout>
  )
}
