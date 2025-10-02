"use client"

import { cn } from "@/lib/utils"

interface PlatformFooterProps {
  version?: string
  lastUpdated?: string
  sidebarCollapsed?: boolean
}

export default function PlatformFooter({ 
  version = "1.0.0",
  lastUpdated = new Date().toLocaleDateString(),
  sidebarCollapsed = false
}: PlatformFooterProps) {
  return (
    <footer className={cn(
      "fixed bottom-0 right-0 z-30 border-t border-gray-200 bg-white px-4 sm:px-6 lg:px-8 py-3",
      sidebarCollapsed ? "left-16" : "left-64"
    )}>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>© 2024 complianceOS. All rights reserved.</span>
          <span>•</span>
          <span>Version {version}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Platform Admin Dashboard</span>
          <span>•</span>
          <span>Last updated: {lastUpdated}</span>
        </div>
      </div>
    </footer>
  )
}
