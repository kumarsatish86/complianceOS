"use client"

import PlatformAdminLayout from "@/components/layout/platform-admin-layout"
import KnowledgeSearchComponent from "@/components/knowledge/search-component"

export default function KnowledgeSearchPage() {
  return (
    <PlatformAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search Knowledge Base</h1>
          <p className="text-gray-600 mt-2">
            Find articles, terms, and categories across the compliance knowledge base
          </p>
        </div>
        
        <KnowledgeSearchComponent />
      </div>
    </PlatformAdminLayout>
  )
}
