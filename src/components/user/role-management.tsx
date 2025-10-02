"use client"

import { useState } from "react"
import { Check, ChevronDown, Shield, Users, Code, Headphones, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RoleManagementProps {
  currentRole: string
  userId: string
  userName: string
  onRoleChange: (userId: string, newRole: string) => Promise<void>
  disabled?: boolean
}

const roleOptions = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Full platform access",
    icon: Shield,
    color: "bg-red-100 text-red-800"
  },
  {
    value: "PLATFORM_ADMIN",
    label: "Platform Admin",
    description: "Platform management access",
    icon: Users,
    color: "bg-blue-100 text-blue-800"
  },
  {
    value: "PLATFORM_DEVELOPER",
    label: "Platform Developer",
    description: "Development and technical access",
    icon: Code,
    color: "bg-purple-100 text-purple-800"
  },
  {
    value: "PLATFORM_SUPPORT",
    label: "Platform Support",
    description: "Support and troubleshooting access",
    icon: Headphones,
    color: "bg-orange-100 text-orange-800"
  },
  {
    value: "USER",
    label: "Platform User",
    description: "Basic platform access",
    icon: User,
    color: "bg-green-100 text-green-800"
  }
]

export default function RoleManagement({ 
  currentRole, 
  userId, 
  userName, 
  onRoleChange, 
  disabled = false 
}: RoleManagementProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const currentRoleOption = roleOptions.find(role => role.value === currentRole)

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) {
      setIsOpen(false)
      return
    }

    try {
      setIsUpdating(true)
      await onRoleChange(userId, newRole)
      setIsOpen(false)
    } catch (error) {
      console.error("Error updating role:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isUpdating}
        className="h-8 px-2"
      >
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${currentRoleOption?.color || "bg-gray-100 text-gray-800"}`}>
          {currentRoleOption?.label || currentRole}
        </span>
        <ChevronDown className="h-3 w-3 ml-1" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 z-20 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                Change role for {userName}
              </div>
              
              {roleOptions.map((role) => {
                const Icon = role.icon
                const isSelected = role.value === currentRole
                
                return (
                  <button
                    key={role.value}
                    onClick={() => handleRoleChange(role.value)}
                    disabled={isUpdating}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-blue-50" : ""
                    } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-3 text-gray-500" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{role.label}</div>
                        <div className="text-xs text-gray-500">{role.description}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
