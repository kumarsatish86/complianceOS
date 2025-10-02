"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import PlatformAdminLayout from "@/components/layout/platform-admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, 
  Edit, 
  Eye, 
  Star,
  Bookmark,
  MessageSquare,
  Calendar,
  User,
  Tag,
  ExternalLink, } from "lucide-react"

interface KnowledgeArticle {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  contentType: string
  status: string
  version: number
  publishedAt: string
  viewCount: number
  rating: number
  ratingCount: number
  tags: string[]
  mediaUrls: string[]
  author: {
    id: string
    name: string
    email: string
  }
  reviewer?: {
    id: string
    name: string
    email: string
  }
  category?: {
    id: string
    name: string
    description: string
  }
  framework?: {
    id: string
    name: string
    version: string
  }
  clause?: {
    id: string
    title: string
    clauseId: string
  }
  _count: {
    bookmarks: number
    comments: number
  }
}

interface ArticleComment {
  id: string
  content: string
  isApproved: boolean
  createdAt: string
  user: {
    id: string
    name: string
  }
  replies: ArticleComment[]
}

export default function ArticleViewPage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string
  
  const [article, setArticle] = useState<KnowledgeArticle | null>(null)
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [newComment, setNewComment] = useState("")

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/knowledge/articles/${articleId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch article')
      }

      const data = await response.json()
      setArticle(data.article)
      
      // Track view
      await fetch(`/api/admin/knowledge/articles/${articleId}/view`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error fetching article:', error)
      setError('Failed to load article')
    } finally {
      setLoading(false)
    }
  }, [articleId])

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/knowledge/articles/${articleId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }, [articleId])

  useEffect(() => {
    if (articleId) {
      fetchArticle()
      fetchComments()
    }
  }, [articleId, fetchArticle, fetchComments])

  const handleEdit = () => {
    router.push(`/dashboard/knowledge/articles/${articleId}/edit`)
  }

  const handleBookmark = async () => {
    try {
      const method = isBookmarked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/admin/knowledge/articles/${articleId}/bookmark`, {
        method
      })

      if (response.ok) {
        setIsBookmarked(!isBookmarked)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const handleRating = async (rating: number) => {
    try {
      const response = await fetch(`/api/admin/knowledge/articles/${articleId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      })

      if (response.ok) {
        setUserRating(rating)
        // Refresh article data to get updated rating
        fetchArticle()
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/admin/knowledge/articles/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      })

      if (response.ok) {
        setNewComment("")
        fetchComments()
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'REVIEW': return 'bg-blue-100 text-blue-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'ARTICLE': return <Eye className="h-4 w-4" />
      case 'GUIDE': return <ExternalLink className="h-4 w-4" />
      case 'TEMPLATE': return <Tag className="h-4 w-4" />
      case 'CHECKLIST': return <Tag className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </PlatformAdminLayout>
    )
  }

  if (error || !article) {
    return (
      <PlatformAdminLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Article Not Found</h2>
          <p className="text-gray-600 mb-4">{error || "The requested article could not be found."}</p>
          <Button onClick={() => router.push('/dashboard/knowledge')}>
            Back to Knowledge Base
          </Button>
        </div>
      </PlatformAdminLayout>
    )
  }

  return (
    <PlatformAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  {getContentTypeIcon(article.contentType)}
                  {article.contentType}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(article.status)}`}>
                  {article.status}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {article.viewCount} views
                </span>
                {article.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                    {article.rating.toFixed(1)} ({article.ratingCount})
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleEdit} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={handleBookmark} variant={isBookmarked ? "default" : "outline"}>
              <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
          </div>
        </div>

        {/* Article Meta */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Author</h3>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{article.author.name}</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Published</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Category</h3>
                <span className="text-sm text-gray-600">
                  {article.category?.name || 'Uncategorized'}
                </span>
              </div>
            </div>
            
            {article.framework && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Compliance Framework</h3>
                <span className="text-sm text-gray-600">
                  {article.framework.name} v{article.framework.version}
                </span>
              </div>
            )}
            
            {article.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Article Summary */}
        {article.summary && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{article.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Article Content */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {article.content}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media URLs */}
        {article.mediaUrls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Related Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {article.mediaUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm truncate"
                    >
                      {url}
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rating Section */}
        <Card>
          <CardHeader>
            <CardTitle>Rate this Article</CardTitle>
            <CardDescription>
              Help others by rating the quality of this content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className={`p-1 ${
                    userRating && star <= userRating
                      ? 'text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className={`h-6 w-6 ${userRating && star <= userRating ? 'fill-current' : ''}`} />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {article.ratingCount} ratings
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Comments ({article._count.comments})</CardTitle>
            <CardDescription>
              Share your thoughts and questions about this article
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Comment Form */}
            <form onSubmit={handleComment} className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <Button type="submit" disabled={!newComment.trim()}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </form>

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-blue-200 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{comment.user.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {!comment.isApproved && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          {/* Pending Approval */}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PlatformAdminLayout>
  )
}
