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
import { Settings, 
  Save, 
  Shield,
  Bell,
  Server,
  RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface PlatformSettings {
  general: {
    platformName: string
    platformDomain: string
    supportEmail: string
    timezone: string
  }
  security: {
    sessionTimeout: number
    passwordPolicy: {
      minLength: number
      requireUppercase: boolean
      requireNumbers: boolean
      requireSpecialChars: boolean
    }
    twoFactorAuth: boolean
    ipWhitelist: string[]
  }
  notifications: {
    emailNotifications: boolean
    systemAlerts: boolean
    userRegistration: boolean
    securityEvents: boolean
  }
  limits: {
    maxUsersPerOrg: number
    maxOrganizations: number
    storageLimit: number
    apiRateLimit: number
  }
}

export default function PlatformSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<PlatformSettings>({
    general: {
      platformName: "complianceOS",
      platformDomain: "complianceos.com",
      supportEmail: "support@complianceos.com",
      timezone: "UTC"
    },
    security: {
      sessionTimeout: 30,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      twoFactorAuth: true,
      ipWhitelist: []
    },
    notifications: {
      emailNotifications: true,
      systemAlerts: true,
      userRegistration: true,
      securityEvents: true
    },
    limits: {
      maxUsersPerOrg: 100,
      maxOrganizations: 50,
      storageLimit: 1000,
      apiRateLimit: 1000
    }
  })
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

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

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    // Show success message
  }

  const updateSetting = (section: keyof PlatformSettings, key: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const updateNestedSetting = (section: keyof PlatformSettings, parentKey: string, childKey: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentKey]: {
          ...(prev[section] as Record<string, unknown>)[parentKey] as Record<string, unknown>,
          [childKey]: value
        }
      }
    }))
  }

  const tabs = [
    { id: "general", name: "General", icon: Settings },
    { id: "security", name: "Security", icon: Shield },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "limits", name: "Limits", icon: Server }
  ]

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
              <p className="mt-2 text-gray-600">
                Configure platform-wide settings and preferences
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {tab.name}
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {/* General Settings */}
            {activeTab === "general" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    General Settings
                  </CardTitle>
                  <CardDescription>
                    Basic platform configuration and branding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="platformName">Platform Name</Label>
                      <Input
                        id="platformName"
                        value={settings.general.platformName}
                        onChange={(e) => updateSetting("general", "platformName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="platformDomain">Platform Domain</Label>
                      <Input
                        id="platformDomain"
                        value={settings.general.platformDomain}
                        onChange={(e) => updateSetting("general", "platformDomain", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) => updateSetting("general", "supportEmail", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        value={settings.general.timezone}
                        onChange={(e) => updateSetting("general", "timezone", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Configure security policies and authentication settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSetting("security", "sessionTimeout", parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Password Policy</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minLength">Minimum Length</Label>
                          <Input
                            id="minLength"
                            type="number"
                            value={settings.security.passwordPolicy.minLength}
                            onChange={(e) => updateNestedSetting("security", "passwordPolicy", "minLength", parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="requireUppercase"
                              checked={settings.security.passwordPolicy.requireUppercase}
                              onChange={(e) => updateNestedSetting("security", "passwordPolicy", "requireUppercase", e.target.checked)}
                            />
                            <Label htmlFor="requireUppercase">Require Uppercase</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="requireNumbers"
                              checked={settings.security.passwordPolicy.requireNumbers}
                              onChange={(e) => updateNestedSetting("security", "passwordPolicy", "requireNumbers", e.target.checked)}
                            />
                            <Label htmlFor="requireNumbers">Require Numbers</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="requireSpecialChars"
                              checked={settings.security.passwordPolicy.requireSpecialChars}
                              onChange={(e) => updateNestedSetting("security", "passwordPolicy", "requireSpecialChars", e.target.checked)}
                            />
                            <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="twoFactorAuth"
                          checked={settings.security.twoFactorAuth}
                          onChange={(e) => updateSetting("security", "twoFactorAuth", e.target.checked)}
                        />
                        <Label htmlFor="twoFactorAuth">Enable Two-Factor Authentication</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Configure platform notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Send email notifications for important events</p>
                      </div>
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => updateSetting("notifications", "emailNotifications", e.target.checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="systemAlerts">System Alerts</Label>
                        <p className="text-sm text-gray-500">Receive alerts for system issues</p>
                      </div>
                      <input
                        type="checkbox"
                        id="systemAlerts"
                        checked={settings.notifications.systemAlerts}
                        onChange={(e) => updateSetting("notifications", "systemAlerts", e.target.checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="userRegistration">User Registration</Label>
                        <p className="text-sm text-gray-500">Notify when new users register</p>
                      </div>
                      <input
                        type="checkbox"
                        id="userRegistration"
                        checked={settings.notifications.userRegistration}
                        onChange={(e) => updateSetting("notifications", "userRegistration", e.target.checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="securityEvents">Security Events</Label>
                        <p className="text-sm text-gray-500">Alert on security-related events</p>
                      </div>
                      <input
                        type="checkbox"
                        id="securityEvents"
                        checked={settings.notifications.securityEvents}
                        onChange={(e) => updateSetting("notifications", "securityEvents", e.target.checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Limits Settings */}
            {activeTab === "limits" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="h-5 w-5 mr-2" />
                    Platform Limits
                  </CardTitle>
                  <CardDescription>
                    Configure platform usage limits and quotas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxUsersPerOrg">Max Users per Organization</Label>
                      <Input
                        id="maxUsersPerOrg"
                        type="number"
                        value={settings.limits.maxUsersPerOrg}
                        onChange={(e) => updateSetting("limits", "maxUsersPerOrg", parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxOrganizations">Max Organizations</Label>
                      <Input
                        id="maxOrganizations"
                        type="number"
                        value={settings.limits.maxOrganizations}
                        onChange={(e) => updateSetting("limits", "maxOrganizations", parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storageLimit">Storage Limit (GB)</Label>
                      <Input
                        id="storageLimit"
                        type="number"
                        value={settings.limits.storageLimit}
                        onChange={(e) => updateSetting("limits", "storageLimit", parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
                      <Input
                        id="apiRateLimit"
                        type="number"
                        value={settings.limits.apiRateLimit}
                        onChange={(e) => updateSetting("limits", "apiRateLimit", parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PlatformAdminLayout>
  )
}
