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
    const frameworkId = searchParams.get('frameworkId')
    const clauseId = searchParams.get('clauseId')
    const term = searchParams.get('term')

    if (!frameworkId && !clauseId && !term) {
      return NextResponse.json({ error: "At least one parameter is required" }, { status: 400 })
    }

    const results: any = {
      articles: [],
      terms: [],
      relatedClauses: []
    }

    // Search for related articles
    const articleWhere: any = {
      status: 'PUBLISHED'
    }

    if (frameworkId) {
      articleWhere.frameworkId = frameworkId
    }

    if (clauseId) {
      articleWhere.clauseId = clauseId
    }

    if (term) {
      articleWhere.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { summary: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
        { tags: { has: term } }
      ]
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where: articleWhere,
      select: {
        id: true,
        title: true,
        summary: true,
        slug: true
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: 5
    })

    results.articles = articles.map(article => ({
      id: article.id,
      title: article.title,
      summary: article.summary || article.title,
      url: `/dashboard/knowledge/articles/${article.id}`
    }))

    // Search for related terms
    const termWhere: any = {
      isActive: true
    }

    if (frameworkId) {
      termWhere.frameworkId = frameworkId
    }

    if (clauseId) {
      termWhere.clauseId = clauseId
    }

    if (term) {
      termWhere.OR = [
        { term: { contains: term, mode: 'insensitive' } },
        { definition: { contains: term, mode: 'insensitive' } },
        { shortDefinition: { contains: term, mode: 'insensitive' } },
        { synonyms: { has: term } },
        { acronyms: { has: term } }
      ]
    }

    const terms = await prisma.knowledgeTerm.findMany({
      where: termWhere,
      select: {
        id: true,
        term: true,
        definition: true,
        shortDefinition: true
      },
      orderBy: [
        { viewCount: 'desc' },
        { term: 'asc' }
      ],
      take: 5
    })

    results.terms = terms.map(term => ({
      id: term.id,
      term: term.term,
      definition: term.shortDefinition || term.definition.substring(0, 150) + '...',
      url: `/dashboard/knowledge/terms/${term.id}`
    }))

    // Search for related clauses (if we have a framework)
    if (frameworkId) {
      const clauses = await prisma.complianceClause.findMany({
        where: {
          component: {
            topic: {
              frameworkId: frameworkId
            }
          }
        },
        select: {
          id: true,
          title: true,
          description: true,
          clauseId: true
        },
        orderBy: {
          clauseId: 'asc'
        },
        take: 5
      })

      results.relatedClauses = clauses.map(clause => ({
        id: clause.id,
        title: clause.title,
        description: clause.description.substring(0, 150) + '...',
        url: `/dashboard/compliance/frameworks/${frameworkId}/clauses/${clause.id}`
      }))
    }

    // If searching by term, also look for clauses that might contain that term
    if (term && !clauseId) {
      const termClauses = await prisma.complianceClause.findMany({
        where: {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { implementationGuidance: { contains: term, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          clauseId: true,
          component: {
            select: {
              topic: {
                select: {
                  framework: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        take: 3
      })

      const termClauseResults = termClauses.map(clause => ({
        id: clause.id,
        title: clause.title,
        description: clause.description.substring(0, 150) + '...',
        url: `/dashboard/compliance/frameworks/${clause.component.topic.framework.id}/clauses/${clause.id}`
      }))

      results.relatedClauses = [...results.relatedClauses, ...termClauseResults].slice(0, 5)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error fetching contextual help:', error)
    return NextResponse.json(
      { error: "Failed to fetch contextual help" },
      { status: 500 }
    )
  }
}
