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
  Building, 
  Globe, 
  Shield,
  AlertCircle,
  Loader2,
  Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface OrganizationFormData {
  name: string
  domain: string
  slug: string
  plan: string
  status: string
}

interface Organization {
  id: string
  name: string
  slug: string
  domain: string
  status: string
  plan: string
  userCount: number
  adminCount: number
  createdAt: string
  updatedAt: string
}

const organizationPlans = [
  {
    value: "free",
    label: "Free",
    description: "Basic features with limited users"
  },
  {
    value: "pro",
    label: "Pro",
    description: "Advanced features with more users"
  },
  {
    value: "enterprise",
    label: "Enterprise",
    description: "Full features with unlimited users"
  }
]

const organizationStatuses = [
  {
    value: "active",
    label: "Active",
    description: "Organization is active and operational"
  },
  {
    value: "inactive",
    label: "Inactive",
    description: "Organization is temporarily inactive"
  },
  {
    value: "suspended",
    label: "Suspended",
    description: "Organization is suspended"
  }
]

export default function EditOrganizationPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: "",
    domain: "",
    slug: "",
    plan: "free",
    status: "active"
  })
  const [errors, setErrors] = useState<Partial<OrganizationFormData>>({})
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const organizationId = params.id as string

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

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setInitialLoading(true)
        const response = await fetch(`/api/admin/organizations?organizationId=${organizationId}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch organization")
        }

        const organizationData = await response.json()
        setOrganization(organizationData)
        setFormData({
          name: organizationData.name || "",
          domain: organizationData.domain || "",
          slug: organizationData.slug || "",
          plan: organizationData.plan || "free",
          status: organizationData.status || "active"
        })
      } catch (error) {
        console.error("Error fetching organization:", error)
        router.push("/dashboard/organizations")
      } finally {
        setInitialLoading(false)
      }
    }

    if (organizationId && session?.user) {
      fetchOrganization()
    }
  }, [organizationId, session, router])

  const validateForm = (): boolean => {
    const newErrors: Partial<OrganizationFormData> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Organization name must be at least 2 characters"
    }

    // Domain validation
    if (!formData.domain.trim()) {
      newErrors.domain = "Domain is required"
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(formData.domain.trim())) {
      newErrors.domain = "Please enter a valid domain (e.g., example.com)"
    }

    // Slug validation
    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required"
    } else if (!/^[a-z0-9-]+$/.test(formData.slug.trim())) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens"
    } else if (formData.slug.trim().length < 2) {
      newErrors.slug = "Slug must be at least 2 characters"
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
      
      const response = await fetch("/api/admin/organizations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: organizationId,
          name: formData.name.trim(),
          domain: formData.domain.trim(),
          slug: formData.slug.trim(),
          plan: formData.plan,
          status: formData.status
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update organization")
      }

      // Redirect back to Redirect back to organizations management page
      router.push("/dashboard/organizations")
    } catch (error) {
      console.error("Error updating organization:", error)
      alert("Failed to update organization: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof OrganizationFormData, value: string) => {
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
            <span>Loading organization data...</span>
          </div>
        </div>
      </PlatformAdminLayout>
    )
  }

  if (!organization) {
    return (
      <PlatformAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Found</h2>
            <p className="text-gray-600 mb-4">The organization you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
            <Button onClick={() => router.push("/dashboard/organizations")}>
              Back to Organizations
            </Button>
          </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Organization</h1>
              <p className="text-gray-600">Update organization information and settings</p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Dashboard</span>
          <span>/</span>
          <button 
            onClick={() => router.push("/dashboard/organizations")}
            className="hover:text-primary"
          >
            Organization Management
          </button>
          <span>/</span>
          <span className="text-gray-900">Edit Organization</span>
        </nav>

        {/* Organization Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Building className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h3 className="font-medium text-blue-800">Organization Details</h3>
              <p className="text-sm text-blue-700">
                {organization.userCount} users • {organization.adminCount} admins • Created {new Date(organization.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update basic information about the organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter organization name"
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

              {/* Domain Field */}
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="domain"
                    type="text"
                    placeholder="Enter domain (e.g., example.com)"
                    value={formData.domain}
                    onChange={(e) => handleInputChange("domain", e.target.value)}
                    className={`pl-10 ${errors.domain ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                </div>
                {errors.domain && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.domain}
                  </div>
                )}
              </div>

              {/* Slug Field */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="slug"
                    type="text"
                    placeholder="Enter slug (e.g., example-org)"
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
                    className={`pl-10 ${errors.slug ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                </div>
                {errors.slug && (
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.slug}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Used in URLs and must be unique. Only lowercase letters, numbers, and hyphens allowed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Plan and Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Plan and Status
              </CardTitle>
              <CardDescription>
                {/* Update the organization&apos;s plan and status */}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Field */}
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <select
                  id="plan"
                  value={formData.plan}
                  onChange={(e) => handleInputChange("plan", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={loading}
                >
                  {organizationPlans.map((plan) => (
                    <option key={plan.value} value={plan.value}>
                      {plan.label} - {plan.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Field */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={loading}
                >
                  {organizationStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label} - {status.description}
                    </option>
                  ))}
                </select>
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
                  Update Organization
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PlatformAdminLayout>
  )
}
