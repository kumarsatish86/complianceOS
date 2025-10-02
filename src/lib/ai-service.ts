import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();

export interface AIQueryRequest {
  organizationId: string;
  userId: string;
  sessionId?: string;
  queryText: string;
  context?: Record<string, unknown>;
}

export interface AIQueryResponse {
  id: string;
  responseText: string;
  confidenceScore: number;
  contextSources: Record<string, unknown>[];
  responseTime: number;
  tokenCount: number;
}

export interface EmbeddingRequest {
  organizationId: string;
  sourceType: string;
  sourceId: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export class AIService {
  private openai: OpenAI | null = null;
  private embeddingModel: string = 'text-embedding-ada-002';
  private completionModel: string = 'gpt-4';

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  /**
   * Process a natural language query with AI assistance
   */
  async processQuery(request: AIQueryRequest): Promise<AIQueryResponse> {
    const startTime = Date.now();
    
    try {
      // Create AI query record
      const aiQuery = await prisma.aIQuery.create({
        data: {
          organizationId: request.organizationId,
          userId: request.userId,
          sessionId: request.sessionId,
          queryText: request.queryText,
          status: 'PROCESSING',
          metadata: JSON.parse(JSON.stringify(request.context)),
        },
      });

      // Get relevant context from vector search
      const contextSources = await this.getRelevantContext(
        request.organizationId,
        request.queryText
      );

      // Generate AI response
      const response = await this.generateResponse(
        request.queryText,
        contextSources
      );

      const responseTime = Date.now() - startTime;

      // Update AI query with response
      const updatedQuery = await prisma.aIQuery.update({
        where: { id: aiQuery.id },
        data: {
          responseText: response.text,
          responseTime,
          contextSources: JSON.parse(JSON.stringify(contextSources)),
          modelUsed: this.completionModel,
          tokenCount: response.tokenCount,
          status: 'COMPLETED',
          confidenceScore: response.confidence,
        },
      });

      // Update session if provided
      if (request.sessionId) {
        await this.updateSession(request.sessionId, request.queryText);
      }

      return {
        id: updatedQuery.id,
        responseText: response.text,
        confidenceScore: response.confidence,
        contextSources: contextSources,
        responseTime,
        tokenCount: response.tokenCount,
      };
    } catch (error) {
      console.error('AI query processing error:', error);
      
      // Update query status to failed
      await prisma.aIQuery.update({
        where: { id: request.sessionId || 'temp' },
        data: {
          status: 'FAILED',
          responseText: 'Sorry, I encountered an error processing your request.',
        },
      }).catch(() => {}); // Ignore if query doesn't exist

      throw new Error('Failed to process AI query');
    }
  }

  /**
   * Generate embeddings for text content
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<string> {
    try {
      // Generate embedding using OpenAI
      const embedding = await this.getOpenAI().embeddings.create({
        model: this.embeddingModel,
        input: request.text,
      });

      const vector = embedding.data[0].embedding;

      // Store embedding in database
      const aiEmbedding = await prisma.aIEmbedding.create({
        data: {
          organizationId: request.organizationId,
          sourceType: request.sourceType,
          sourceId: request.sourceId,
          vector: vector,
          embeddingModel: this.embeddingModel,
          chunkText: request.text,
          metadata: request.metadata ? JSON.parse(JSON.stringify(request.metadata)) : null,
        },
      });

      return aiEmbedding.id;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Search for relevant context using vector similarity
   */
  async searchSimilarContent(
    organizationId: string,
    queryText: string,
    limit: number = 5
  ): Promise<Record<string, unknown>[]> {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.getOpenAI().embeddings.create({
        model: this.embeddingModel,
        input: queryText,
      });

      const queryVector = queryEmbedding.data[0].embedding;

      // Find similar embeddings (simplified - in production, use pgvector or similar)
      const embeddings = await prisma.aIEmbedding.findMany({
        where: { organizationId },
        take: limit * 2, // Get more to filter
      });

      // Calculate similarities (simplified cosine similarity)
      const similarities = embeddings.map(embedding => ({
        ...embedding,
        similarity: this.cosineSimilarity(queryVector, embedding.vector as number[]),
      }));

      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => ({
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          chunkText: item.chunkText,
          similarity: item.similarity,
          metadata: item.metadata,
        }));
    } catch (error) {
      console.error('Vector search error:', error);
      return [];
    }
  }

  /**
   * Get relevant context for a query
   */
  private async getRelevantContext(
    organizationId: string,
    queryText: string
  ): Promise<Record<string, unknown>[]> {
    // Search for similar content
    const similarContent = await this.searchSimilarContent(organizationId, queryText);

    // Enrich with actual source data
    const enrichedContext = await Promise.all(
      similarContent.map(async (item) => {
        try {
          let sourceData = null;
          
          switch (item.sourceType) {
            case 'EVIDENCE':
              sourceData = await prisma.evidence.findUnique({
                where: { id: item.sourceId as string },
                include: { organization: true },
              });
              break;
            case 'POLICY':
              sourceData = await prisma.policy.findUnique({
                where: { id: item.sourceId as string },
                include: { organization: true },
              });
              break;
            case 'CONTROL':
              sourceData = await prisma.control.findUnique({
                where: { id: item.sourceId as string },
                include: { framework: true },
              });
              break;
            case 'RISK':
              sourceData = await prisma.risk.findUnique({
                where: { id: item.sourceId as string },
                include: { organization: true },
              });
              break;
          }

          return {
            ...item,
            sourceData,
          };
        } catch (error) {
          console.error('Error enriching context:', error);
          return item;
        }
      })
    );

    return enrichedContext;
  }

  /**
   * Generate AI response using OpenAI
   */
  private async generateResponse(
    queryText: string,
    contextSources: Record<string, unknown>[]
  ): Promise<{ text: string; confidence: number; tokenCount: number }> {
    try {
      // Build context from sources
      const contextText = contextSources
        .map(source => `${source.sourceType}: ${source.chunkText}`)
        .join('\n\n');

      // Create system prompt for compliance context
      const systemPrompt = `You are an AI assistant specialized in compliance management. You help users with:
- Evidence management and audit preparation
- Policy analysis and risk assessment
- Control framework guidance
- Compliance best practices

Use the provided context to give accurate, helpful responses. Always cite your sources when possible.`;

      const userPrompt = `Context:\n${contextText}\n\nQuery: ${queryText}`;

      const completion = await this.getOpenAI().chat.completions.create({
        model: this.completionModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || 'No response generated';
      const tokenCount = completion.usage?.total_tokens || 0;

      // Calculate confidence based on context relevance
      const avgSimilarity = contextSources.length > 0 
        ? contextSources.reduce((sum, source) => sum + ((source.similarity as number) || 0), 0) / contextSources.length
        : 0;

      return {
        text: response,
        confidence: Math.min(avgSimilarity * 1.2, 1.0), // Boost confidence slightly
        tokenCount,
      };
    } catch (error) {
      console.error('Response generation error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Update AI session with new activity
   */
  private async updateSession(sessionId: string, queryText: string): Promise<void> {
    try {
      await prisma.aISession.update({
        where: { id: sessionId },
        data: {
          lastActivity: new Date(),
          queryCount: { increment: 1 },
          contextWindow: {
            // Add to context window (simplified)
            lastQuery: queryText,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Session update error:', error);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Create a new AI session
   */
  async createSession(
    organizationId: string,
    userId: string,
    title?: string
  ): Promise<string> {
    try {
      const session = await prisma.aISession.create({
        data: {
          organizationId,
          userId,
          sessionTitle: title,
          contextWindow: {},
        },
      });

      return session.id;
    } catch (error) {
      console.error('Session creation error:', error);
      throw new Error('Failed to create AI session');
    }
  }

  /**
   * Get AI session history
   */
  async getSessionHistory(sessionId: string): Promise<Record<string, unknown>[]> {
    try {
      const queries = await prisma.aIQuery.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        include: {
          feedback: true,
        },
      });

      return queries;
    } catch (error) {
      console.error('Session history error:', error);
      return [];
    }
  }

  /**
   * Submit feedback for an AI query
   */
  async submitFeedback(
    queryId: string,
    userId: string,
    feedbackType: string,
    rating?: number,
    comment?: string,
    suggestion?: string
  ): Promise<void> {
    try {
      await prisma.aIFeedback.create({
        data: {
          aiQueryId: queryId,
          userId,
          feedbackType: feedbackType as 'HELPFUL' | 'NOT_HELPFUL' | 'ACCURATE' | 'INACCURATE' | 'RELEVANT',
          rating,
          comment,
          improvementSuggestion: suggestion,
        },
      });
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  /**
   * Get AI analytics and insights
   */
  async getAnalytics(organizationId: string): Promise<{
    totalQueries: number;
    avgResponseTime: number;
    avgConfidence: number;
    feedbackStats: Record<string, unknown>;
    topQueries: Record<string, unknown>[];
    usageTrends: Record<string, unknown>;
  }> {
    try {
      const [
        totalQueries,
        avgResponseTime,
        avgConfidence,
        feedbackStats,
        topQueries,
      ] = await Promise.all([
        prisma.aIQuery.count({ where: { organizationId } }),
        prisma.aIQuery.aggregate({
          where: { organizationId },
          _avg: { responseTime: true },
        }),
        prisma.aIQuery.aggregate({
          where: { organizationId },
          _avg: { confidenceScore: true },
        }),
        prisma.aIFeedback.groupBy({
          by: ['feedbackType'],
          where: { aiQuery: { organizationId } },
          _count: true,
        }),
        prisma.aIQuery.groupBy({
          by: ['queryText'],
          where: { organizationId },
          _count: true,
          orderBy: { _count: { queryText: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        totalQueries,
        avgResponseTime: avgResponseTime._avg.responseTime || 0,
        avgConfidence: avgConfidence._avg.confidenceScore || 0,
        feedbackStats: feedbackStats as unknown as Record<string, unknown>,
        topQueries,
        usageTrends: {},
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return {
        totalQueries: 0,
        avgResponseTime: 0,
        avgConfidence: 0,
        feedbackStats: {},
        topQueries: [],
        usageTrends: {},
      };
    }
  }
}

export const aiService = new AIService();
