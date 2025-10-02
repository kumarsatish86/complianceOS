import { PrismaClient } from '@prisma/client';
import { aiService } from './ai-service';

const prisma = new PrismaClient();

export interface VectorSearchResult {
  id: string;
  sourceType: string;
  sourceId: string;
  chunkText: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface EmbeddingJob {
  id: string;
  organizationId: string;
  sourceType: string;
  sourceId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export class VectorEngine {
  private batchSize: number = 10;
  private maxRetries: number = 3;

  /**
   * Process content for embedding generation
   */
  async processContentForEmbedding(job: EmbeddingJob): Promise<string> {
    try {
      // Check if embedding already exists
      const existingEmbedding = await prisma.aIEmbedding.findFirst({
        where: {
          organizationId: job.organizationId,
          sourceType: job.sourceType,
          sourceId: job.sourceId,
        },
      });

      if (existingEmbedding) {
        // Update existing embedding
        const embeddingId = await aiService.generateEmbedding({
          organizationId: job.organizationId,
          sourceType: job.sourceType,
          sourceId: job.sourceId,
          text: job.content,
          metadata: job.metadata,
        });

        const existingVector = await prisma.aIEmbedding.findUnique({ where: { id: embeddingId } });
        await prisma.aIEmbedding.update({
          where: { id: existingEmbedding.id },
          data: {
            vector: existingVector?.vector ? JSON.parse(JSON.stringify(existingVector.vector)) : null,
            chunkText: job.content,
            metadata: job.metadata ? JSON.parse(JSON.stringify(job.metadata)) : null,
            updatedAt: new Date(),
          },
        });

        return existingEmbedding.id;
      } else {
        // Create new embedding
        return await aiService.generateEmbedding({
          organizationId: job.organizationId,
          sourceType: job.sourceType,
          sourceId: job.sourceId,
          text: job.content,
          metadata: job.metadata,
        });
      }
    } catch (_error) {
      console.error('Content processing error:', _error);
      throw new Error('Failed to process content for embedding');
    }
  }

  /**
   * Batch process multiple content items
   */
  async batchProcessContent(jobs: EmbeddingJob[]): Promise<string[]> {
    const results: string[] = [];
    const batches = this.chunkArray(jobs, this.batchSize);

    for (const batch of batches) {
      try {
        const batchResults = await Promise.allSettled(
          batch.map(job => this.processContentForEmbedding(job))
        );

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`Batch processing failed for job ${index}:`, result.reason);
            results.push(''); // Placeholder for failed jobs
          }
        });
      } catch (_error) {
        console.error('Batch processing error:', _error);
        // Add empty strings for failed batch
        results.push(...new Array(batch.length).fill(''));
      }
    }

    return results;
  }

  /**
   * Search for similar content using vector similarity
   */
  async searchSimilarContent(
    organizationId: string,
    queryText: string,
    sourceTypes?: string[],
    limit: number = 10,
    minSimilarity: number = 0.7
  ): Promise<VectorSearchResult[]> {
    try {
      const results = await aiService.searchSimilarContent(organizationId, queryText, limit * 2);

      // Filter by source types if provided
      const filteredResults = sourceTypes 
        ? results.filter(result => sourceTypes.includes(result.sourceType as string))
        : results;

      // Filter by minimum similarity
      const similarResults = filteredResults.filter(result => (result.similarity as number) >= minSimilarity);

      return similarResults.slice(0, limit).map(result => ({
        id: result.sourceId as string,
        sourceType: result.sourceType as string,
        sourceId: result.sourceId as string,
        chunkText: result.chunkText as string,
        similarity: result.similarity as number,
        metadata: result.metadata as Record<string, unknown>,
      }));
    } catch (_error) {
      console.error('Vector search error:', _error);
      return [];
    }
  }

  /**
   * Get content recommendations based on user behavior
   */
  async getContentRecommendations(
    organizationId: string,
    userId: string,
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
    try {
      // Get user's recent queries to understand their interests
      const recentQueries = await prisma.aIQuery.findMany({
        where: {
          organizationId,
          userId,
          status: 'COMPLETED',
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { queryText: true },
      });

      if (recentQueries.length === 0) {
        return [];
      }

      // Combine recent queries into a search context
      const searchContext = recentQueries.map(q => q.queryText).join(' ');

      // Search for relevant content
      const recommendations = await this.searchSimilarContent(
        organizationId,
        searchContext,
        undefined,
        limit,
        0.6 // Lower threshold for recommendations
      );

      return recommendations;
    } catch (_error) {
      console.error('Recommendation error:', _error);
      return [];
    }
  }

  /**
   * Index evidence documents for search
   */
  async indexEvidence(organizationId: string, evidenceId: string): Promise<void> {
    try {
      const evidence = await prisma.evidence.findUnique({
        where: { id: evidenceId },
        include: { organization: true },
      });

      if (!evidence) {
        throw new Error('Evidence not found');
      }

      // Create embedding job for evidence
      const job: EmbeddingJob = {
        id: evidenceId,
        organizationId,
        sourceType: 'EVIDENCE',
        sourceId: evidenceId,
        content: `${evidence.title}\n\n${evidence.description || ''}`,
        metadata: {
          title: evidence.title,
          type: evidence.type,
          status: evidence.status,
          addedAt: evidence.addedAt,
        },
      };

      await this.processContentForEmbedding(job);
    } catch (_error) {
      console.error('Evidence indexing error:', _error);
      throw new Error('Failed to index evidence');
    }
  }

  /**
   * Index policy documents for search
   */
  async indexPolicy(organizationId: string, policyId: string): Promise<void> {
    try {
      const policy = await prisma.policy.findUnique({
        where: { id: policyId },
        include: { organization: true },
      });

      if (!policy) {
        throw new Error('Policy not found');
      }

      // Create embedding job for policy
      const job: EmbeddingJob = {
        id: policyId,
        organizationId,
        sourceType: 'POLICY',
        sourceId: policyId,
        content: `${policy.title}\n\n${policy.description || ''}`,
        metadata: {
          title: policy.title,
          category: policy.category,
          type: policy.policyType,
          status: policy.status,
          version: policy.version,
        },
      };

      await this.processContentForEmbedding(job);
    } catch (_error) {
      console.error('Policy indexing error:', _error);
      throw new Error('Failed to index policy');
    }
  }

  /**
   * Index control frameworks for search
   */
  async indexControl(organizationId: string, controlId: string): Promise<void> {
    try {
      const control = await prisma.control.findUnique({
        where: { id: controlId },
        include: { framework: true },
      });

      if (!control) {
        throw new Error('Control not found');
      }

      // Create embedding job for control
      const job: EmbeddingJob = {
        id: controlId,
        organizationId,
        sourceType: 'CONTROL',
        sourceId: controlId,
        content: `${control.name}\n\n${control.description || ''}`,
        metadata: {
          name: control.name,
          category: control.category,
          status: control.status,
          criticality: control.criticality,
          framework: control.framework.name,
        },
      };

      await this.processContentForEmbedding(job);
    } catch (_error) {
      console.error('Control indexing error:', _error);
      throw new Error('Failed to index control');
    }
  }

  /**
   * Index risk assessments for search
   */
  async indexRisk(organizationId: string, riskId: string): Promise<void> {
    try {
      const risk = await prisma.risk.findUnique({
        where: { id: riskId },
        include: { organization: true },
      });

      if (!risk) {
        throw new Error('Risk not found');
      }

      // Create embedding job for risk
      const job: EmbeddingJob = {
        id: riskId,
        organizationId,
        sourceType: 'RISK',
        sourceId: riskId,
        content: `${risk.title}\n\n${risk.description || ''}`,
        metadata: {
          title: risk.title,
          category: risk.category,
          subcategory: risk.subcategory,
          status: risk.status,
          severity: risk.severityInherent,
        },
      };

      await this.processContentForEmbedding(job);
    } catch (_error) {
      console.error('Risk indexing error:', _error);
      throw new Error('Failed to index risk');
    }
  }

  /**
   * Bulk index all content for an organization
   */
  async bulkIndexOrganization(organizationId: string): Promise<void> {
    try {
      console.log(`Starting bulk indexing for organization ${organizationId}`);

      // Get all content to index
      const [evidence, policies, controls, risks] = await Promise.all([
        prisma.evidence.findMany({ where: { organizationId } }),
        prisma.policy.findMany({ where: { organizationId } }),
        prisma.control.findMany({ where: { organizationId } }),
        prisma.risk.findMany({ where: { organizationId } }),
      ]);

      // Create embedding jobs
      const jobs: EmbeddingJob[] = [
        ...evidence.map(e => ({
          id: e.id,
          organizationId,
          sourceType: 'EVIDENCE',
          sourceId: e.id,
          content: `${e.title}\n\n${e.description || ''}`,
          metadata: {
            title: e.title,
            type: e.type,
            status: e.status,
            addedAt: e.addedAt,
          },
        })),
        ...policies.map(p => ({
          id: p.id,
          organizationId,
          sourceType: 'POLICY',
          sourceId: p.id,
          content: `${p.title}\n\n${p.description || ''}`,
          metadata: {
            title: p.title,
            category: p.category,
            type: p.policyType,
            status: p.status,
            version: p.version,
          },
        })),
        ...controls.map(c => ({
          id: c.id,
          organizationId,
          sourceType: 'CONTROL',
          sourceId: c.id,
          content: `${c.name}\n\n${c.description || ''}`,
          metadata: {
            name: c.name,
            category: c.category,
            status: c.status,
            criticality: c.criticality,
          },
        })),
        ...risks.map(r => ({
          id: r.id,
          organizationId,
          sourceType: 'RISK',
          sourceId: r.id,
          content: `${r.title}\n\n${r.description || ''}`,
          metadata: {
            title: r.title,
            category: r.category,
            subcategory: r.subcategory,
            status: r.status,
            severity: r.severityInherent,
          },
        })),
      ];

      console.log(`Processing ${jobs.length} embedding jobs`);

      // Process in batches
      await this.batchProcessContent(jobs);

      console.log(`Bulk indexing completed for organization ${organizationId}`);
    } catch (_error) {
      console.error('Bulk indexing error:', _error);
      throw new Error('Failed to bulk index organization');
    }
  }

  /**
   * Get vector engine statistics
   */
  async getStats(organizationId: string): Promise<{
    totalEmbeddings: number;
    embeddingsByType: Record<string, number>;
    recentActivity: unknown[];
    storageUsage: number;
    performanceMetrics: Record<string, unknown>;
  }> {
    try {
      const [
        totalEmbeddings,
        embeddingsByType,
        recentActivity,
      ] = await Promise.all([
        prisma.aIEmbedding.count({ where: { organizationId } }),
        prisma.aIEmbedding.groupBy({
          by: ['sourceType'],
          where: { organizationId },
          _count: true,
        }),
        prisma.aIEmbedding.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            sourceType: true,
            sourceId: true,
            createdAt: true,
          },
        }),
      ]);

      return {
        totalEmbeddings,
        embeddingsByType: embeddingsByType.reduce((acc, item) => {
          acc[item.sourceType] = item._count;
          return acc;
        }, {} as Record<string, number>),
        recentActivity,
        storageUsage: 0, // This would need to be calculated from actual storage
        performanceMetrics: {}, // This would need to be calculated from actual metrics
      };
    } catch (_error) {
      console.error('Stats error:', _error);
      return {
        totalEmbeddings: 0,
        embeddingsByType: {},
        recentActivity: [],
        storageUsage: 0,
        performanceMetrics: {},
      };
    }
  }

  /**
   * Clean up old or invalid embeddings
   */
  async cleanupEmbeddings(organizationId: string): Promise<void> {
    try {
      // Find embeddings without valid source data
      const embeddings = await prisma.aIEmbedding.findMany({
        where: { organizationId },
      });

      const invalidEmbeddings = [];

      for (const embedding of embeddings) {
        let isValid = false;

        try {
          switch (embedding.sourceType) {
            case 'EVIDENCE':
              isValid = !!(await prisma.evidence.findUnique({ where: { id: embedding.sourceId } }));
              break;
            case 'POLICY':
              isValid = !!(await prisma.policy.findUnique({ where: { id: embedding.sourceId } }));
              break;
            case 'CONTROL':
              isValid = !!(await prisma.control.findUnique({ where: { id: embedding.sourceId } }));
              break;
            case 'RISK':
              isValid = !!(await prisma.risk.findUnique({ where: { id: embedding.sourceId } }));
              break;
          }
        } catch {
          isValid = false;
        }

        if (!isValid) {
          invalidEmbeddings.push(embedding.id);
        }
      }

      // Delete invalid embeddings
      if (invalidEmbeddings.length > 0) {
        await prisma.aIEmbedding.deleteMany({
          where: { id: { in: invalidEmbeddings } },
        });

        console.log(`Cleaned up ${invalidEmbeddings.length} invalid embeddings`);
      }
    } catch (_error) {
      console.error('Cleanup error:', _error);
    }
  }

  /**
   * Utility function to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const vectorEngine = new VectorEngine();
