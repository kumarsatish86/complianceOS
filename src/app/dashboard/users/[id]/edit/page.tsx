"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"

// Type assertion for session user with platformRole
type SessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  platformRole?: string
}
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Lock, 
  Shield,
  AlertCircle,
  Loader2,
  Building,
  Eye,
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface UserFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  platformRole: string
  organizationId?: string
}

interface Organization {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  email: string
  platformRole: string
  organizationId?: string
  organization?: {
    id: string
    name: string
  }
  createdAt: string
  lastLogin?: string
}

const platformRoles = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Full platform access with all permissions"
  },
  {
    value: "PLATFORM_ADMIN",
    label: "Platform Admin",
    description: "Platform management and user administration"
  },
  {
    value: "PLATFORM_DEVELOPER",
    label: "Platform Developer",
    description: "Development and technical access"
  },
  {
    value: "PLATFORM_SUPPORT",
    label: "Platform Support",
    description: "Support and troubleshooting access"
  },
  {
    value: "USER",
    label: "Platform User",
    description: "Basic platform access"
  }
]

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    platformRole: "USER",
    organizationId: ""
  })
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [errors, setErrors] = useState<Partial<UserFormData>>({})
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [organizationsLoading, setOrganizationsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const userId = params.id as string

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if ((session.user as SessionUser)?.platformRole !== "SUPER_ADMIN" && (session.user as SessionUser)?.platformRole !== "PLATFORM_ADMIN") {
      router.push("/dashboard")
      return
    }
  }, [session, status, router])

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setInitialLoading(true)
        const response = await fetch(`/api/admin/users?userId=${userId}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch user")
        }

        const userData = await response.json()
        setUser(userData)
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          password: "",
          confirmPassword: "",
          platformRole: userData.platformRole || "USER",
          organizationId: userData.organizationId || ""
        })
      } catch (error) {
        console.error("Error fetching user:", error)
        router.push("/dashboard/users")
      } finally {
        setInitialLoading(false)
      }
    }

    if (userId && session?.user) {
      fetchUser()
    }
  }, [userId, session, router])

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setOrganizationsLoading(true)
        const response = await fetch("/api/admin/organizations")
        
        if (response.ok) {
          const data = await response.json()
          setOrganizations(data.organizations || [])
        }
      } catch (error) {
        console.error("Error fetching organizations:", error)
      } finally {
        setOrganizationsLoading(false)
      }
    }

    if (session?.user) {
      fetchOrganizations()
    }
  }, [session])

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation (only if password is provided)
    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    // Confirm password validation (only if password is provided)
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Platform role validation
    if (!formData.platformRole) {
      newErrors.platformRole = "Platform role is required"
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
      
      const updateData: Record<string, unknown> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        platformRole: formData.platformRole,
        organizationId: formData.organizationId || null
      }

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updateData,
          userId: userId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update user")
      }

      // Redirect back to Redirect back to users management page
      router.push("/dashboard/users")
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (status === "loading" || initialLoading) {
    return (
      <PlatformAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading user data...</span>
          </div>
        </div>
      </PlatformAdminLayout>
    )
  }

  if (!user) {
    return (
      <PlatformAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
            <p className="text-gray-600 mb-4">The user you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
            <Button onClick={() => router.push("/dashboard/users")}>
              Back to Users
            </Button>
          </div>
        </div>
      </PlatformAdminLayout>
    )
  }

  const isCurrentUser = session?.user ? (session.user as SessionUser)?.id === user.id : false

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
              <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
              <p className="text-gray-600">Update user information and permissions</p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Dashboard</span>
          <span>/</span>
          <button 
            onClick={() => router.push("/dashboard/users")}
            className="hover:text-primary"
          >
            User Management
          </button>
          <span>/</span>
          <span className="text-gray-900">Edit User</span>
        </nav>

        {/* Current User Warning */}
        {isCurrentUser && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h3 className="font-medium text-blue-800">Editing Your Own Account</h3>
                <p className="text-sm text-blue-700">
                  You are editing your own account. Some changes may require you to log in again.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                {/* Update basic information about the user */}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter full name"
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

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Security Information
              </CardTitle>
              <CardDescription>
                {/* Update password (leave blank to keep current password) */}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">New Password (Optional)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (leave blank to keep current)"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              {formData.password && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className={`pl-10 pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="flex items-center text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role and Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Role and Organization
              </CardTitle>
              <CardDescription>
                {/* Update platform role and organization membership */}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platform Role Field */}
              <div className="space-y-2">
                <Label htmlFor="platformRole">Platform Role</Label>
                <select
                  id="platformRole"
                  value={formData.platformRole}
                  onChange={(e) => handleInputChange("platformRole", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.platformRole ? "border-red-500" : ""
                  }`}
                  disabled={loading || isCurrentUser}
                >
                  {platformRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
                {errors.platformRole && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.platformRole}
                  </div>
                )}
                {isCurrentUser && (
                  <p className="text-sm text-gray-500">You cannot change your own role</p>
                )}
              </div>

              {/* Organization Field */}
              <div className="space-y-2">
                <Label htmlFor="organizationId">Organization</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    id="organizationId"
                    value={formData.organizationId}
                    onChange={(e) => handleInputChange("organizationId", e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={loading || organizationsLoading}
                  >
                    <option value="">No organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                {organizationsLoading && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Loading organizations...
                  </div>
                )}
              </div>
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
                  Updating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  {/* Update User */}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PlatformAdminLayout>
  )
}
