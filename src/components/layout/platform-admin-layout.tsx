"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Shield,
  Building,
  Settings,
  LogOut,
  BarChart3, 
  FileText, 
  Activity,
  Menu,
  X,
  ChevronRight,
  Home,
  UserCheck,
  ClipboardList,
  ClipboardCheck,
  BookOpen,
  Eye,
  Bell,
  Monitor,
  Plug,
  HelpCircle,
  FileCheck,
  AlertTriangle,
  Gavel,
  Bot,
  Building2,
  Users,
  TrendingUp
} from "lucide-react"
import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"
import PlatformFooter from "./platform-footer"

interface PlatformAdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Platform overview and metrics"
  },
  {
    name: "User Management",
    href: "/dashboard/users",
    icon: Users,
    description: "Manage platform users and roles"
  },
  {
    name: "Roles Management",
    href: "/dashboard/roles",
    icon: UserCheck,
    description: "Manage roles and permissions"
  },
  {
    name: "Organizations",
    href: "/dashboard/organizations",
    icon: Building,
    description: "Manage organizations and settings"
  },
  {
    name: "Compliance Management",
    href: "/dashboard/compliance",
    icon: ClipboardCheck,
    description: "Manage compliance frameworks and requirements"
  },
  {
    name: "Knowledge Base",
    href: "/dashboard/knowledge",
    icon: BookOpen,
    description: "Manage knowledge articles and terminology"
  },
  {
    name: "Asset Management",
    href: "/dashboard/assets-management",
    icon: Shield,
    description: "IT assets, vendors, licenses, and access controls"
  },
  {
    name: "Access Management",
    href: "/dashboard/access",
    icon: Eye,
    description: "User access controls and review workflows"
  },
          {
            name: "Evidence Locker",
            href: "/dashboard/evidence",
            icon: FileText,
            description: "Compliance evidence and control frameworks"
          },
          {
            name: "Audit Automation",
            href: "/dashboard/audit",
            icon: ClipboardList,
            description: "Automated audit workflows and management"
          },
          {
            name: "Audit Packages",
            href: "/dashboard/audit/packages",
            icon: FileText,
            description: "Generate and manage audit packages"
          },
          {
            name: "Guest Auditors",
            href: "/dashboard/audit/guest-auditors",
            icon: Users,
            description: "Manage external auditor access and collaboration"
          },
          {
            name: "Audit Analytics",
            href: "/dashboard/audit/analytics",
            icon: BarChart3,
            description: "Advanced analytics and progress tracking"
          },
          {
            name: "Notifications",
            href: "/dashboard/audit/notifications",
            icon: Bell,
            description: "Notification center and communication management"
          },
          {
            name: "Security Posture Dashboard",
            href: "/dashboard/security-posture",
            icon: Monitor,
            description: "Real-time compliance monitoring and security insights"
          },
          {
            name: "Security Analytics",
            href: "/dashboard/security-posture/analytics",
            icon: TrendingUp,
            description: "Advanced analytics and trend analysis"
          },
          {
            name: "Integrations",
            href: "/dashboard/integrations",
            icon: Plug,
            description: "IT system integrations and automated evidence collection"
          },
          {
            name: "Security Questionnaires",
            href: "/dashboard/questionnaires",
            icon: HelpCircle,
            description: "Automated security questionnaire processing and management"
          },
          {
            name: "Policy Management",
            href: "/dashboard/policies",
            icon: FileCheck,
            description: "Policy lifecycle management and employee acknowledgments"
          },
          {
            name: "Risk Management",
            href: "/dashboard/risks",
            icon: AlertTriangle,
            description: "Risk identification, assessment, and treatment planning"
          },
          {
            name: "Governance Dashboard",
            href: "/dashboard/governance",
            icon: Gavel,
            description: "Executive governance overview and compliance monitoring"
          },
          {
            name: "AI Assistant",
            href: "/dashboard/ai-assistant",
            icon: Bot,
            description: "Intelligent compliance assistance and automation"
          },
          {
            name: "Enterprise Management",
            href: "/dashboard/enterprise",
            icon: Building2,
            description: "Enterprise identity, security, and data residency management"
          },
  {
    name: "Platform Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "System configuration and settings"
  },
  {
    name: "System Health",
    href: "/dashboard/health",
    icon: Activity,
    description: "Monitoring and diagnostics"
  }
]

export default function PlatformAdminLayout({ children }: PlatformAdminLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:fixed lg:translate-x-0 lg:shadow-lg",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "lg:w-16" : "w-64 lg:w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary mr-3" />
              {!sidebarCollapsed && (
                <h1 className="text-xl font-bold text-gray-900">complianceOS</h1>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    sidebarCollapsed ? "justify-center" : ""
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary-foreground" : "text-gray-400 group-hover:text-gray-500",
                    sidebarCollapsed ? "" : "mr-3"
                  )} />
                  {!sidebarCollapsed && (
                    <>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className={cn(
                          "text-xs mt-0.5",
                          isActive ? "text-primary-foreground/80" : "text-gray-500"
                        )}>
                          {item.description}
                        </div>
                      </div>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-primary-foreground" />
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className={cn(
              "flex items-center",
              sidebarCollapsed ? "justify-center" : "justify-between"
            )}>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Platform Administrator
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className={sidebarCollapsed ? "" : "ml-2"}
                title={sidebarCollapsed ? "Sign Out" : undefined}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Platform Administration
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-16">
          {children}
        </main>
      </div>

      {/* Fixed Footer */}
      <PlatformFooter sidebarCollapsed={sidebarCollapsed} />
    </div>
  )
}
