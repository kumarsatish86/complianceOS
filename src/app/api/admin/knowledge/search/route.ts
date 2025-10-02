/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') // 'all', 'articles', 'terms', 'categories'
    const framework = searchParams.get('framework')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        pagination: { page, limit, total: 0, pages: 0 }
      })
    }

    const searchTerm = query.trim()
    const results: any[] = []
    let totalCount = 0

    // Search Articles
    if (type === 'all' || type === 'articles') {
      const articleWhere: any = {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { summary: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { has: searchTerm } }
        ],
        status: 'PUBLISHED'
      }

      if (framework) {
        articleWhere.framework = {
          name: { contains: framework, mode: 'insensitive' }
        }
      }

      if (category) {
        articleWhere.category = {
          name: { contains: category, mode: 'insensitive' }
        }
      }

      const articles = await prisma.knowledgeArticle.findMany({
        where: articleWhere,
        include: {
          author: {
            select: { name: true }
          },
          category: {
            select: { name: true }
          },
          framework: {
            select: { name: true, version: true }
          }
        },
        orderBy: [
          { viewCount: 'desc' },
          { publishedAt: 'desc' }
        ],
        skip: type === 'articles' ? skip : 0,
        take: type === 'articles' ? limit : 5
      })

      const articleResults = articles.map(article => ({
        type: 'article',
        id: article.id,
        title: article.title,
        summary: article.summary,
        contentType: article.contentType,
        author: article.author.name,
        category: article.category?.name,
        framework: article.framework?.name,
        viewCount: article.viewCount,
        rating: article.rating,
        publishedAt: article.publishedAt,
        tags: article.tags,
        url: `/dashboard/knowledge/articles/${article.id}`
      }))

      results.push(...articleResults)
      
      if (type === 'articles') {
        totalCount = await prisma.knowledgeArticle.count({ where: articleWhere })
      }
    }

    // Search Terms
    if (type === 'all' || type === 'terms') {
      const termWhere: any = {
        OR: [
          { term: { contains: searchTerm, mode: 'insensitive' } },
          { definition: { contains: searchTerm, mode: 'insensitive' } },
          { shortDefinition: { contains: searchTerm, mode: 'insensitive' } },
          { synonyms: { has: searchTerm } },
          { acronyms: { has: searchTerm } }
        ],
        isActive: true
      }

      if (framework) {
        termWhere.framework = {
          name: { contains: framework, mode: 'insensitive' }
        }
      }

      const terms = await prisma.knowledgeTerm.findMany({
        where: termWhere,
        include: {
          category: {
            select: { name: true }
          },
          framework: {
            select: { name: true, version: true }
          }
        },
        orderBy: [
          { viewCount: 'desc' },
          { term: 'asc' }
        ],
        skip: type === 'terms' ? skip : 0,
        take: type === 'terms' ? limit : 5
      })

      const termResults = terms.map(term => ({
        type: 'term',
        id: term.id,
        title: term.term,
        summary: term.shortDefinition || term.definition.substring(0, 200) + '...',
        definition: term.definition,
        synonyms: term.synonyms,
        acronyms: term.acronyms,
        category: term.category?.name,
        framework: term.framework?.name,
        viewCount: term.viewCount,
        url: `/dashboard/knowledge/terms/${term.id}`
      }))

      results.push(...termResults)
      
      if (type === 'terms') {
        totalCount = await prisma.knowledgeTerm.count({ where: termWhere })
      }
    }

    // Search Categories
    if (type === 'all' || type === 'categories') {
      const categoryWhere: any = {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ],
        isActive: true
      }

      if (framework) {
        categoryWhere.framework = {
          name: { contains: framework, mode: 'insensitive' }
        }
      }

      const categories = await prisma.knowledgeCategory.findMany({
        where: categoryWhere,
        include: {
          framework: {
            select: { name: true, version: true }
          },
          _count: {
            select: {
              articles: true,
              terms: true
            }
          }
        },
        orderBy: [
          { name: 'asc' }
        ],
        skip: type === 'categories' ? skip : 0,
        take: type === 'categories' ? limit : 5
      })

      const categoryResults = categories.map(category => ({
        type: 'category',
        id: category.id,
        title: category.name,
        summary: category.description,
        framework: category.framework?.name,
        articleCount: category._count.articles,
        termCount: category._count.terms,
        url: `/dashboard/knowledge/categories/${category.id}`
      }))

      results.push(...categoryResults)
      
      if (type === 'categories') {
        totalCount = await prisma.knowledgeCategory.count({ where: categoryWhere })
      }
    }

    // Sort results by relevance (simple scoring)
    if (type === 'all') {
      results.sort((a, b) => {
        const aScore = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ? 2 : 1
        const bScore = b.title.toLowerCase().includes(searchTerm.toLowerCase()) ? 2 : 1
        return bScore - aScore
      })
    }

    // Track search analytics
    await prisma.contentAnalytics.create({
      data: {
        contentType: 'ARTICLE', // Generic type for search
        contentId: 'search',
        userId: session.user.id,
        action: 'SEARCH',
        metadata: {
          query: searchTerm,
          type,
          framework,
          category,
          resultCount: results.length
        }
      }
    })

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total: totalCount || results.length,
        pages: Math.ceil((totalCount || results.length) / limit)
      },
      query: searchTerm,
      type,
      framework,
      category
    })
  } catch (error) {
    console.error('Error searching knowledge base:', error)
    return NextResponse.json(
      { error: "Failed to search knowledge base" },
      { status: 500 }
    )
  }
}
