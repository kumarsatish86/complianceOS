import { prisma } from './prisma';
import { } from './ai-suggestion-engine';

export interface AnswerLibraryEntry {
  id: string;
  category: string;
  subcategory?: string;
  keyPhrases: string[];
  standardAnswer: string;
  evidenceReferences: string[];
  usageCount: number;
  confidenceScore: number;
  lastUsedAt?: Date;
  lastUpdated: Date;
  createdBy: string;
  createdByName?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface AnswerLibraryStats {
  totalEntries: number;
  activeEntries: number;
  totalUsage: number;
  averageConfidence: number;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    usage: number;
  }>;
  topUsedEntries: AnswerLibraryEntry[];
  recentlyUpdated: AnswerLibraryEntry[];
}

export class AnswerLibraryService {
  /**
   * Create new answer library entry
   */
  static async createEntry(
    organizationId: string,
    category: string,
    subcategory: string | undefined,
    keyPhrases: string[],
    standardAnswer: string,
    evidenceReferences: string[],
    createdBy: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    try {
      const entry = await prisma.answerLibrary.create({
        data: {
          organizationId,
          category: category as 'ACCESS_CONTROL' | 'DATA_PROTECTION' | 'INCIDENT_RESPONSE' | 'NETWORK_SECURITY' | 'PHYSICAL_SECURITY' | 'BUSINESS_CONTINUITY' | 'VENDOR_MANAGEMENT' | 'COMPLIANCE_FRAMEWORK' | 'GENERAL_SECURITY' | 'CUSTOM',
          subcategory,
          keyPhrases,
          standardAnswer,
          evidenceReferences,
          usageCount: 0,
          confidenceScore: 50, // Initial confidence score
          createdBy,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
        }
      });

      return entry.id;
    } catch (error) {
      throw new Error(`Failed to create answer library entry: ${error}`);
    }
  }

  /**
   * Get answer library entries for organization
   */
  static async getEntries(
    organizationId: string,
    category?: string,
    search?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AnswerLibraryEntry[]> {
    try {
      const entries = await prisma.answerLibrary.findMany({
        where: {
          organizationId,
          ...(category && { category: category as 'ACCESS_CONTROL' | 'DATA_PROTECTION' | 'INCIDENT_RESPONSE' | 'NETWORK_SECURITY' | 'PHYSICAL_SECURITY' | 'BUSINESS_CONTINUITY' | 'VENDOR_MANAGEMENT' | 'COMPLIANCE_FRAMEWORK' | 'GENERAL_SECURITY' | 'CUSTOM' }),
          ...(search && {
            OR: [
              { standardAnswer: { contains: search, mode: 'insensitive' } },
              { keyPhrases: { hasSome: [search] } },
              { subcategory: { contains: search, mode: 'insensitive' } }
            ]
          })
        },
        include: {
          creator: {
            select: { name: true, email: true }
          }
        },
        orderBy: [
          { usageCount: 'desc' },
          { confidenceScore: 'desc' },
          { lastUpdated: 'desc' }
        ],
        take: limit,
        skip: offset
      });

      return entries.map(entry => ({
        id: entry.id,
        category: entry.category,
        subcategory: entry.subcategory || undefined,
        keyPhrases: entry.keyPhrases,
        standardAnswer: entry.standardAnswer,
        evidenceReferences: entry.evidenceReferences,
        usageCount: entry.usageCount,
        confidenceScore: entry.confidenceScore,
        lastUsedAt: entry.lastUsedAt || undefined,
        lastUpdated: entry.lastUpdated,
        createdBy: entry.createdBy,
        createdByName: entry.creator?.name || entry.creator?.email,
        isActive: entry.isActive,
        metadata: entry.metadata as Record<string, unknown> || undefined
      }));
    } catch (error) {
      throw new Error(`Failed to get answer library entries: ${error}`);
    }
  }

  /**
   * Get answer library entry by ID
   */
  static async getEntryById(entryId: string): Promise<AnswerLibraryEntry | null> {
    try {
      const entry = await prisma.answerLibrary.findUnique({
        where: { id: entryId },
        include: {
          creator: {
            select: { name: true, email: true }
          }
        }
      });

      if (!entry) return null;

      return {
        id: entry.id,
        category: entry.category,
        subcategory: entry.subcategory || undefined,
        keyPhrases: entry.keyPhrases,
        standardAnswer: entry.standardAnswer,
        evidenceReferences: entry.evidenceReferences,
        usageCount: entry.usageCount,
        confidenceScore: entry.confidenceScore,
        lastUsedAt: entry.lastUsedAt || undefined,
        lastUpdated: entry.lastUpdated,
        createdBy: entry.createdBy,
        createdByName: entry.creator?.name || entry.creator?.email,
        isActive: entry.isActive,
        metadata: entry.metadata as Record<string, unknown> || undefined
      };
    } catch (error) {
      throw new Error(`Failed to get answer library entry: ${error}`);
    }
  }

  /**
   * Update answer library entry
   */
  static async updateEntry(
    entryId: string,
    updates: {
      category?: string;
      subcategory?: string;
      keyPhrases?: string[];
      standardAnswer?: string;
      evidenceReferences?: string[];
      isActive?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      await prisma.answerLibrary.update({
        where: { id: entryId },
        data: {
          subcategory: updates.subcategory,
          keyPhrases: updates.keyPhrases,
          standardAnswer: updates.standardAnswer,
          evidenceReferences: updates.evidenceReferences,
          isActive: updates.isActive,
          ...(updates.category && { category: updates.category as 'ACCESS_CONTROL' | 'DATA_PROTECTION' | 'INCIDENT_RESPONSE' | 'NETWORK_SECURITY' | 'PHYSICAL_SECURITY' | 'BUSINESS_CONTINUITY' | 'VENDOR_MANAGEMENT' | 'COMPLIANCE_FRAMEWORK' | 'GENERAL_SECURITY' | 'CUSTOM' }),
          ...(updates.metadata && { metadata: JSON.parse(JSON.stringify(updates.metadata)) }),
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      throw new Error(`Failed to update answer library entry: ${error}`);
    }
  }

  /**
   * Delete answer library entry
   */
  static async deleteEntry(entryId: string): Promise<void> {
    try {
      await prisma.answerLibrary.delete({
        where: { id: entryId }
      });
    } catch (error) {
      throw new Error(`Failed to delete answer library entry: ${error}`);
    }
  }

  /**
   * Use answer library entry (increment usage count)
   */
  static async incrementUsage(entryId: string): Promise<void> {
    try {
      await prisma.answerLibrary.update({
        where: { id: entryId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
          confidenceScore: { increment: 1 } // Boost confidence with usage
        }
      });
    } catch (error) {
      throw new Error(`Failed to update entry usage: ${error}`);
    }
  }

  /**
   * Search answer library for relevant entries
   */
  static async searchEntries(
    organizationId: string,
    query: string,
    category?: string,
    limit: number = 10
  ): Promise<AnswerLibraryEntry[]> {
    try {
      const entries = await prisma.answerLibrary.findMany({
        where: {
          organizationId,
          isActive: true,
          ...(category && { category: category as 'ACCESS_CONTROL' | 'DATA_PROTECTION' | 'INCIDENT_RESPONSE' | 'NETWORK_SECURITY' | 'PHYSICAL_SECURITY' | 'BUSINESS_CONTINUITY' | 'VENDOR_MANAGEMENT' | 'COMPLIANCE_FRAMEWORK' | 'GENERAL_SECURITY' | 'CUSTOM' }),
          OR: [
            { standardAnswer: { contains: query, mode: 'insensitive' } },
            { keyPhrases: { hasSome: [query.toLowerCase()] } },
            { subcategory: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          creator: {
            select: { name: true, email: true }
          }
        },
        orderBy: [
          { confidenceScore: 'desc' },
          { usageCount: 'desc' }
        ],
        take: limit
      });

      return entries.map(entry => ({
        id: entry.id,
        category: entry.category,
        subcategory: entry.subcategory || undefined,
        keyPhrases: entry.keyPhrases,
        standardAnswer: entry.standardAnswer,
        evidenceReferences: entry.evidenceReferences,
        usageCount: entry.usageCount,
        confidenceScore: entry.confidenceScore,
        lastUsedAt: entry.lastUsedAt || undefined,
        lastUpdated: entry.lastUpdated,
        createdBy: entry.createdBy,
        createdByName: entry.creator?.name || entry.creator?.email,
        isActive: entry.isActive,
        metadata: entry.metadata as Record<string, unknown> || undefined
      }));
    } catch (error) {
      throw new Error(`Failed to search answer library: ${error}`);
    }
  }

  /**
   * Get answer library statistics
   */
  static async getStats(organizationId: string): Promise<AnswerLibraryStats> {
    try {
      const entries = await prisma.answerLibrary.findMany({
        where: { organizationId },
        include: {
          creator: {
            select: { name: true, email: true }
          }
        }
      });

      const totalEntries = entries.length;
      const activeEntries = entries.filter(e => e.isActive).length;
      const totalUsage = entries.reduce((sum, e) => sum + e.usageCount, 0);
      const averageConfidence = entries.length > 0 
        ? entries.reduce((sum, e) => sum + e.confidenceScore, 0) / entries.length 
        : 0;

      // Category breakdown
      const categoryMap = new Map<string, { count: number; usage: number }>();
      entries.forEach(entry => {
        const existing = categoryMap.get(entry.category) || { count: 0, usage: 0 };
        categoryMap.set(entry.category, {
          count: existing.count + 1,
          usage: existing.usage + entry.usageCount
        });
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        usage: data.usage
      }));

      // Top used entries
      const topUsedEntries = entries
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map(entry => ({
          id: entry.id,
          category: entry.category,
          subcategory: entry.subcategory || undefined,
          keyPhrases: entry.keyPhrases,
          standardAnswer: entry.standardAnswer,
          evidenceReferences: entry.evidenceReferences,
          usageCount: entry.usageCount,
          confidenceScore: entry.confidenceScore,
          lastUsedAt: entry.lastUsedAt || undefined,
          lastUpdated: entry.lastUpdated,
          createdBy: entry.createdBy,
          createdByName: entry.creator?.name || entry.creator?.email,
          isActive: entry.isActive,
          metadata: entry.metadata as Record<string, unknown> || undefined
        }));

      // Recently updated entries
      const recentlyUpdated = entries
        .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
        .slice(0, 5)
        .map(entry => ({
          id: entry.id,
          category: entry.category,
          subcategory: entry.subcategory || undefined,
          keyPhrases: entry.keyPhrases,
          standardAnswer: entry.standardAnswer,
          evidenceReferences: entry.evidenceReferences,
          usageCount: entry.usageCount,
          confidenceScore: entry.confidenceScore,
          lastUsedAt: entry.lastUsedAt || undefined,
          lastUpdated: entry.lastUpdated,
          createdBy: entry.createdBy,
          createdByName: entry.creator?.name || entry.creator?.email,
          isActive: entry.isActive,
          metadata: entry.metadata as Record<string, unknown> || undefined
        }));

      return {
        totalEntries,
        activeEntries,
        totalUsage,
        averageConfidence,
        categoryBreakdown,
        topUsedEntries,
        recentlyUpdated
      };
    } catch (error) {
      throw new Error(`Failed to get answer library stats: ${error}`);
    }
  }

  /**
   * Import answer library entries from CSV
   */
  static async importFromCSV(
    organizationId: string,
    csvData: string,
    createdBy: string
  ): Promise<{ imported: number; errors: string[] }> {
    try {
      const lines = csvData.split('\n').filter(line => line.trim().length > 0);
      const headers = lines[0].split(',').map(h => h.trim());
      
      const errors: string[] = [];
      let imported = 0;

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim());
          const entryData: Record<string, unknown> = {};
          
          headers.forEach((header, index) => {
            entryData[header.toLowerCase()] = values[index] || '';
          });

          // Validate required fields
          if (!entryData.category || !entryData.standardanswer) {
            errors.push(`Row ${i + 1}: Missing required fields`);
            continue;
          }

          // Parse key phrases
          const keyPhrases = entryData.keyphrases 
            ? (entryData.keyphrases as string).split(';').map((phrase: string) => phrase.trim()).filter((phrase: string) => phrase.length > 0)
            : [];

          await this.createEntry(
            organizationId,
            entryData.category as string,
            entryData.subcategory as string || undefined,
            keyPhrases,
            entryData.standardanswer as string,
            [], // evidenceReferences
            createdBy,
            {
              imported: true,
              importDate: new Date().toISOString(),
              originalRow: i + 1
            }
          );

          imported++;
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error}`);
        }
      }

      return { imported, errors };
    } catch (error) {
      throw new Error(`Failed to import from CSV: ${error}`);
    }
  }

  /**
   * Export answer library entries to CSV
   */
  static async exportToCSV(organizationId: string): Promise<string> {
    try {
      const entries = await this.getEntries(organizationId, undefined, undefined, 1000, 0);
      
      const headers = [
        'Category',
        'Subcategory',
        'Key Phrases',
        'Standard Answer',
        'Usage Count',
        'Confidence Score',
        'Last Used',
        'Created By',
        'Is Active'
      ];

      const csvLines = [headers.join(',')];
      
      entries.forEach(entry => {
        const row = [
          entry.category,
          entry.subcategory || '',
          entry.keyPhrases.join(';'),
          `"${entry.standardAnswer.replace(/"/g, '""')}"`, // Escape quotes
          entry.usageCount.toString(),
          entry.confidenceScore.toString(),
          entry.lastUsedAt ? entry.lastUsedAt.toISOString() : '',
          entry.createdByName || '',
          entry.isActive ? 'Yes' : 'No'
        ];
        csvLines.push(row.join(','));
      });

      return csvLines.join('\n');
    } catch (error) {
      throw new Error(`Failed to export to CSV: ${error}`);
    }
  }

  /**
   * Suggest improvements for answer library entries
   */
  static async suggestImprovements(organizationId: string): Promise<Array<{
    entryId: string;
    suggestions: string[];
    priority: 'low' | 'medium' | 'high';
  }>> {
    try {
      const entries = await this.getEntries(organizationId, undefined, undefined, 100, 0);
      const suggestions: Array<{
        entryId: string;
        suggestions: string[];
        priority: 'low' | 'medium' | 'high';
      }> = [];

      entries.forEach(entry => {
        const entrySuggestions: string[] = [];
        let priority: 'low' | 'medium' | 'high' = 'low';

        // Check for low usage
        if (entry.usageCount === 0) {
          entrySuggestions.push('This entry has never been used. Consider reviewing or updating it.');
          priority = 'medium';
        }

        // Check for low confidence
        if (entry.confidenceScore < 30) {
          entrySuggestions.push('Low confidence score. Consider improving the answer quality.');
          priority = 'high';
        }

        // Check for missing key phrases
        if (entry.keyPhrases.length < 3) {
          entrySuggestions.push('Consider adding more key phrases to improve matching.');
          priority = 'medium';
        }

        // Check for short answers
        if (entry.standardAnswer.length < 50) {
          entrySuggestions.push('Answer is quite short. Consider providing more detailed information.');
          priority = 'low';
        }

        // Check for outdated entries
        const daysSinceUpdate = (Date.now() - entry.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 90) {
          entrySuggestions.push('Entry hasn\'t been updated in over 90 days. Consider reviewing for accuracy.');
          priority = 'medium';
        }

        if (entrySuggestions.length > 0) {
          suggestions.push({
            entryId: entry.id,
            suggestions: entrySuggestions,
            priority
          });
        }
      });

      return suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      throw new Error(`Failed to generate improvement suggestions: ${error}`);
    }
  }
}
