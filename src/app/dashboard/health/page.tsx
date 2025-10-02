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
import { 
  Activity, 
  RefreshCw, 
  Server, 
  Database, 
  Shield, 
  Globe,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Mail,
  Clock,
  TrendingUp,
  TrendingDown,
  Cpu,
  HardDrive,
  Wifi
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"

interface SystemMetric {
  name: string
  value: number
  unit: string
  status: "healthy" | "warning" | "critical"
  trend: "up" | "down" | "stable"
  lastUpdated: string
}

interface ServiceStatus {
  name: string
  status: "healthy" | "warning" | "critical" | "down"
  uptime: string
  responseTime: number
  lastCheck: string
  description: string
}

export default function SystemHealthPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Mock data - replace with actual API calls
  const [systemMetrics] = useState<SystemMetric[]>([
    {
      name: "CPU Usage",
      value: 45,
      unit: "%",
      status: "healthy",
      trend: "stable",
      lastUpdated: "2024-01-15T10:30:00Z"
    },
    {
      name: "Memory Usage",
      value: 78,
      unit: "%",
      status: "warning",
      trend: "up",
      lastUpdated: "2024-01-15T10:30:00Z"
    },
    {
      name: "Disk Usage",
      value: 65,
      unit: "%",
      status: "healthy",
      trend: "stable",
      lastUpdated: "2024-01-15T10:30:00Z"
    },
    {
      name: "Network Latency",
      value: 12,
      unit: "ms",
      status: "healthy",
      trend: "down",
      lastUpdated: "2024-01-15T10:30:00Z"
    }
  ])

  const [services] = useState<ServiceStatus[]>([
    {
      name: "Database",
      status: "healthy",
      uptime: "99.9%",
      responseTime: 5,
      lastCheck: "2024-01-15T10:30:00Z",
      description: "Primary database connection"
    },
    {
      name: "Authentication Service",
      status: "healthy",
      uptime: "99.8%",
      responseTime: 8,
      lastCheck: "2024-01-15T10:30:00Z",
      description: "User authentication and authorization"
    },
    {
      name: "API Gateway",
      status: "warning",
      uptime: "98.5%",
      responseTime: 15,
      lastCheck: "2024-01-15T10:30:00Z",
      description: "Main API gateway service"
    },
    {
      name: "File Storage",
      status: "healthy",
      uptime: "99.7%",
      responseTime: 12,
      lastCheck: "2024-01-15T10:30:00Z",
      description: "File upload and storage service"
    },
    {
      name: "Email Service",
      status: "critical",
      uptime: "95.2%",
      responseTime: 45,
      lastCheck: "2024-01-15T10:30:00Z",
      description: "Email notification service"
    },
    {
      name: "Backup Service",
      status: "healthy",
      uptime: "99.9%",
      responseTime: 3,
      lastCheck: "2024-01-15T10:30:00Z",
      description: "Automated backup service"
    }
  ])

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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "down":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "critical":
        return "bg-red-100 text-red-800"
      case "down":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-500" />
      case "stable":
        return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
    }
  }

  const getMetricIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "cpu usage":
        return <Cpu className="h-5 w-5 text-blue-500" />
      case "memory usage":
        return <HardDrive className="h-5 w-5 text-green-500" />
      case "disk usage":
        return <HardDrive className="h-5 w-5 text-purple-500" />
      case "network latency":
        return <Wifi className="h-5 w-5 text-orange-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getServiceIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "database":
        return <Database className="h-5 w-5 text-blue-500" />
      case "authentication service":
        return <Shield className="h-5 w-5 text-green-500" />
      case "api gateway":
        return <Globe className="h-5 w-5 text-purple-500" />
      case "file storage":
        return <HardDrive className="h-5 w-5 text-orange-500" />
      case "email service":
        return <Mail className="h-5 w-5 text-red-500" />
      case "backup service":
        return <Server className="h-5 w-5 text-gray-500" />
      default:
        return <Server className="h-5 w-5 text-gray-500" />
    }
  }

  const overallHealth = services.filter(s => s.status === "healthy").length / services.length * 100

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
              <p className="mt-2 text-gray-600">
                Monitor platform performance and system status
              </p>
            </div>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Overall Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{Math.round(overallHealth)}%</div>
              <p className="text-xs text-muted-foreground">
                {overallHealth >= 95 ? "Excellent" : overallHealth >= 85 ? "Good" : "Needs Attention"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy Services</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {services.filter(s => s.status === "healthy").length}
              </div>
              <p className="text-xs text-muted-foreground">
                of {services.length} services
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {services.filter(s => s.status === "critical" || s.status === "down").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Critical issues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(services.reduce((sum, s) => sum + s.responseTime, 0) / services.length)}ms
              </div>
              <p className="text-xs text-muted-foreground">
                Across all services
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                System Metrics
              </CardTitle>
              <CardDescription>
                Real-time system performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemMetrics.map((metric) => (
                <div key={metric.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getMetricIcon(metric.name)}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{metric.name}</div>
                      <div className="text-xs text-gray-500">
                        Updated {new Date(metric.lastUpdated).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {metric.value}{metric.unit}
                      </div>
                      <div className="flex items-center justify-end">
                        {getTrendIcon(metric.trend)}
                      </div>
                    </div>
                    {getStatusIcon(metric.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Service Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Service Status
              </CardTitle>
              <CardDescription>
                Status of all platform services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getServiceIcon(service.name)}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
                      <div className="text-xs text-gray-500">{service.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end mb-1">
                      {getStatusIcon(service.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {service.responseTime}ms • {service.uptime}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Recent Alerts
            </CardTitle>
            <CardDescription>
              Latest system alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">API Gateway Response Time High</div>
                    <div className="text-xs text-gray-500">Response time exceeded 15ms threshold</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 text-red-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email Service Critical</div>
                    <div className="text-xs text-gray-500">Email service experiencing high latency</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(Date.now() - 300000).toLocaleTimeString()}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Backup Completed Successfully</div>
                    <div className="text-xs text-gray-500">Daily backup completed without issues</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(Date.now() - 600000).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformAdminLayout>
  )
}
