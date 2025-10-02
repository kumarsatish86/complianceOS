"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  HelpCircle, 
  BookOpen, 
  FileText, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react"

interface ContextualHelpProps {
  frameworkId?: string
  clauseId?: string
  term?: string
  className?: string
}

interface HelpContent {
  articles: Array<{
    id: string
    title: string
    summary: string
    url: string
  }>
  terms: Array<{
    id: string
    term: string
    definition: string
    url: string
  }>
  relatedClauses: Array<{
    id: string
    title: string
    description: string
    url: string
  }>
}

export default function ContextualHelp({ 
  frameworkId, 
  clauseId, 
  term, 
  className = "" 
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [helpContent, setHelpContent] = useState<HelpContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContextualHelp = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (frameworkId) params.append('frameworkId', frameworkId)
      if (clauseId) params.append('clauseId', clauseId)
      if (term) params.append('term', term)

      const response = await fetch(`/api/admin/knowledge/contextual-help?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch contextual help')
      }

      const data = await response.json()
      setHelpContent(data)
    } catch (error) {
      console.error('Error fetching contextual help:', error)
      setError('Failed to load help content')
    } finally {
      setLoading(false)
    }
  }, [frameworkId, clauseId, term])

  useEffect(() => {
    if (isOpen && (frameworkId || clauseId || term)) {
      fetchContextualHelp()
    }
  }, [isOpen, frameworkId, clauseId, term, fetchContextualHelp])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsExpanded(false)
    }
  }

  const handleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  if (!frameworkId && !clauseId && !term) {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {!isOpen ? (
        <Button
          onClick={handleToggle}
          className="rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
          size="lg"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-80 max-h-96 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Contextual Help</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpand}
                  className="p-1"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggle}
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              {term ? `Help for "${term}"` : 
               clauseId ? "Related compliance information" : 
               frameworkId ? "Framework guidance" : 
               "Contextual assistance"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className={`${isExpanded ? 'max-h-80 overflow-y-auto' : 'max-h-32 overflow-hidden'}`}>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading help...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-sm text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchContextualHelp}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : helpContent ? (
              <div className="space-y-4">
                {/* Related Articles */}
                {helpContent.articles.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Related Articles
                    </h4>
                    <div className="space-y-2">
                      {helpContent.articles.slice(0, isExpanded ? undefined : 2).map((article) => (
                        <div key={article.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium text-gray-900">{article.title}</div>
                          <div className="text-gray-600 text-xs mt-1">{article.summary}</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600 hover:text-blue-800"
                            onClick={() => window.open(article.url, '_blank')}
                          >
                            Read more <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      ))}
                      {!isExpanded && helpContent.articles.length > 2 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{helpContent.articles.length - 2} more articles
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Related Terms */}
                {helpContent.terms.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      Related Terms
                    </h4>
                    <div className="space-y-2">
                      {helpContent.terms.slice(0, isExpanded ? undefined : 2).map((term) => (
                        <div key={term.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium text-gray-900">{term.term}</div>
                          <div className="text-gray-600 text-xs mt-1">{term.definition}</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600 hover:text-blue-800"
                            onClick={() => window.open(term.url, '_blank')}
                          >
                            View definition <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      ))}
                      {!isExpanded && helpContent.terms.length > 2 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{helpContent.terms.length - 2} more terms
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Related Clauses */}
                {helpContent.relatedClauses.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Related Clauses</h4>
                    <div className="space-y-2">
                      {helpContent.relatedClauses.slice(0, isExpanded ? undefined : 2).map((clause) => (
                        <div key={clause.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium text-gray-900">{clause.title}</div>
                          <div className="text-gray-600 text-xs mt-1">{clause.description}</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600 hover:text-blue-800"
                            onClick={() => window.open(clause.url, '_blank')}
                          >
                            View clause <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      ))}
                      {!isExpanded && helpContent.relatedClauses.length > 2 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{helpContent.relatedClauses.length - 2} more clauses
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {helpContent.articles.length === 0 && 
                 helpContent.terms.length === 0 && 
                 helpContent.relatedClauses.length === 0 && (
                  <div className="text-center py-4">
                    <HelpCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No related content found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/dashboard/knowledge/search', '_blank')}
                      className="mt-2"
                    >
                      {/* Search Knowledge Base */}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">No help content available</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
