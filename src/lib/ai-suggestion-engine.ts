import { prisma } from './prisma';
import {  } from './document-parser';

export interface AnswerSuggestion {
  suggestedAnswer: string;
  confidenceScore: number; // 0-100
  sourceType: 'EVIDENCE' | 'LIBRARY' | 'PATTERN' | 'AI_GENERATED';
  sourceId?: string;
  evidenceIds: string[];
  reasoning: string;
  metadata?: Record<string, unknown>;
}

export interface EvidenceMatch {
  evidenceId: string;
  evidenceTitle: string;
  relevanceScore: number;
  matchedKeywords: string[];
  controlMapping: string[];
}

export class AISuggestionEngine {
  /**
   * Generate answer suggestions for a question
   */
  static async generateSuggestions(
    questionId: string,
    organizationId: string
  ): Promise<AnswerSuggestion[]> {
    try {
      // Get question details
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { questionnaire: true }
      });

      if (!question) {
        throw new Error('Question not found');
      }

      const suggestions: AnswerSuggestion[] = [];

      // 1. Search answer library
      const librarySuggestions = await this.searchAnswerLibrary(
        question,
        organizationId
      );
      suggestions.push(...librarySuggestions);

      // 2. Search evidence repository
      const evidenceSuggestions = await this.searchEvidenceRepository(
        question,
        organizationId
      );
      suggestions.push(...evidenceSuggestions);

      // 3. Pattern-based suggestions
      const patternSuggestions = await this.generatePatternBasedSuggestions(
        question,
        organizationId
      );
      suggestions.push(...patternSuggestions);

      // 4. AI-generated suggestions (if enabled)
      const aiSuggestions = await this.generateAISuggestions(
        question
      );
      suggestions.push(...aiSuggestions);

      // Sort by confidence score and return top suggestions
      return suggestions
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, 5); // Return top 5 suggestions
    } catch (error) {
      throw new Error(`Failed to generate suggestions: ${error}`);
    }
  }

  /**
   * Search answer library for relevant answers
   */
  private static async searchAnswerLibrary(
    question: Record<string, unknown>,
    organizationId: string
  ): Promise<AnswerSuggestion[]> {
    const suggestions: AnswerSuggestion[] = [];
    const questionKeywords = (question.keywordsExtracted as string[]) || [];
    // TODO: Use questionText for enhanced matching

    // Search by keywords
    const libraryEntries = await prisma.answerLibrary.findMany({
      where: {
        organizationId,
        isActive: true,
        keyPhrases: {
          hasSome: questionKeywords as string[]
        }
      },
      orderBy: {
        confidenceScore: 'desc'
      },
      take: 3
    });

    for (const entry of libraryEntries) {
      const keywordMatches = entry.keyPhrases.filter((keyword: string) =>
        questionKeywords.includes(keyword.toLowerCase())
      );

      const confidenceScore = this.calculateConfidenceScore(
        keywordMatches.length,
        questionKeywords.length,
        entry.confidenceScore
      );

      if (confidenceScore > 30) { // Minimum threshold
        suggestions.push({
          suggestedAnswer: entry.standardAnswer,
          confidenceScore,
          sourceType: 'LIBRARY',
          sourceId: entry.id,
          evidenceIds: entry.evidenceReferences,
          reasoning: `Matched ${keywordMatches.length} keywords: ${keywordMatches.join(', ')}`,
          metadata: {
            libraryCategory: entry.category,
            usageCount: entry.usageCount,
            lastUsed: entry.lastUsedAt
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Search evidence repository for relevant evidence
   */
  private static async searchEvidenceRepository(
    question: Record<string, unknown>,
    organizationId: string
  ): Promise<AnswerSuggestion[]> {
    const suggestions: AnswerSuggestion[] = [];
    // TODO: Use questionKeywords for enhanced evidence search
    const controlMappings = (question.controlMapping as string[]) || [];

    // Search evidence by control mapping
    const evidence = await prisma.evidence.findMany({
      where: {
        organizationId,
        status: 'APPROVED',
        controlLinks: {
          some: {
            control: {
              id: {
                in: controlMappings
              }
            }
          }
        }
      },
      include: {
        controlLinks: {
          include: {
            control: true
          }
        }
      },
      take: 5
    });

    for (const ev of evidence) {
      const matchedControls = ev.controlLinks
        .filter(link => controlMappings.includes(link.control.id))
        .map(link => link.control.name);

      const confidenceScore = this.calculateEvidenceConfidence(
        matchedControls.length,
        controlMappings.length,
        ev
      );

      if (confidenceScore > 25) { // Minimum threshold
        suggestions.push({
          suggestedAnswer: this.generateAnswerFromEvidence(ev, question),
          confidenceScore,
          sourceType: 'EVIDENCE',
          sourceId: ev.id,
          evidenceIds: [ev.id],
          reasoning: `Evidence supports ${matchedControls.length} relevant controls: ${matchedControls.join(', ')}`,
          metadata: {
            evidenceTitle: ev.title,
            evidenceType: ev.type,
            lastUpdated: ev.updatedAt,
            matchedControls
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate pattern-based suggestions
   */
  private static async generatePatternBasedSuggestions(
    question: Record<string, unknown>,
    organizationId: string
  ): Promise<AnswerSuggestion[]> {
    const suggestions: AnswerSuggestion[] = [];
    const questionText = (question.questionText as string)?.toLowerCase() || '';
    const questionType = question.questionType;

    // Pattern matching for common question types
    if (questionType === 'YES_NO') {
      const suggestion = this.generateYesNoSuggestion(question);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    if (questionText.includes('policy') || questionText.includes('procedure')) {
      const suggestion = await this.generatePolicySuggestion(question, organizationId);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    if (questionText.includes('training') || questionText.includes('awareness')) {
      const suggestion = await this.generateTrainingSuggestion(question, organizationId);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    if (questionText.includes('incident') || questionText.includes('response')) {
      const suggestion = await this.generateIncidentResponseSuggestion(question, organizationId);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Generate AI-powered suggestions
   */
  private static async generateAISuggestions(
    question: Record<string, unknown>
  ): Promise<AnswerSuggestion[]> {
    const suggestions: AnswerSuggestion[] = [];

    // This would integrate with an AI service like OpenAI, Claude, etc.
    // For now, we'll generate contextual suggestions based on question analysis
    const contextualSuggestion = await AISuggestionEngine.generateContextualSuggestion(question);
    if (contextualSuggestion) {
      suggestions.push(contextualSuggestion);
    }

    return suggestions;
  }

  /**
   * Calculate confidence score for library matches
   */
  private static calculateConfidenceScore(
    matchedKeywords: number,
    totalKeywords: number,
    libraryConfidence: number
  ): number {
    const keywordMatchRatio = totalKeywords > 0 ? matchedKeywords / totalKeywords : 0;
    const baseScore = keywordMatchRatio * 70; // Base score from keyword matching
    const libraryBoost = libraryConfidence * 0.3; // Boost from library confidence
    
    return Math.min(100, baseScore + libraryBoost);
  }

  /**
   * Calculate confidence score for evidence matches
   */
  private static calculateEvidenceConfidence(
    matchedControls: number,
    totalControls: number,
    evidence: Record<string, unknown>
  ): number {
    const controlMatchRatio = totalControls > 0 ? matchedControls / totalControls : 0;
    const baseScore = controlMatchRatio * 60; // Base score from control matching
    
    // Boost for recent evidence
    const daysSinceUpdate = (Date.now() - (evidence.updatedAt as Date).getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 20 - daysSinceUpdate); // Boost decreases over time
    
    return Math.min(100, baseScore + recencyBoost);
  }

  /**
   * Generate answer from evidence
   */
  private static generateAnswerFromEvidence(evidence: Record<string, unknown>, question: Record<string, unknown>): string {
    const questionText = (question.questionText as string)?.toLowerCase() || '';
    
    if (questionText.includes('policy') || questionText.includes('procedure')) {
      return `We have implemented ${evidence.title} which addresses this requirement. The policy is documented and regularly reviewed.`;
    }
    
    if (questionText.includes('training') || questionText.includes('awareness')) {
      return `Our organization provides regular security training and awareness programs. Evidence of training completion is maintained in our records.`;
    }
    
    if (questionText.includes('incident') || questionText.includes('response')) {
      return `We have established incident response procedures and maintain incident logs. Our response team is trained and ready to handle security incidents.`;
    }
    
    return `We have implemented appropriate controls and maintain evidence of compliance. Our ${evidence.title} addresses this requirement.`;
  }

  /**
   * Generate Yes/No suggestion
   */
  private static generateYesNoSuggestion(question: Record<string, unknown>): AnswerSuggestion | null {
    const questionText = (question.questionText as string)?.toLowerCase() || '';
    
    // Analyze question to determine likely answer
    let suggestedAnswer = 'No';
    let confidence = 40;
    let reasoning = 'Default conservative answer';

    if (questionText.includes('implemented') || questionText.includes('established') || questionText.includes('maintained')) {
      // Check if we have evidence for this
      suggestedAnswer = 'Yes';
      confidence = 60;
      reasoning = 'Question asks about implementation/establishment';
    }

    if (questionText.includes('not') || questionText.includes('never') || questionText.includes('no')) {
      suggestedAnswer = 'No';
      confidence = 70;
      reasoning = 'Question contains negative phrasing';
    }

    return {
      suggestedAnswer,
      confidenceScore: confidence,
      sourceType: 'PATTERN',
      evidenceIds: [],
      reasoning,
      metadata: {
        questionType: 'YES_NO',
        patternMatched: true
      }
    };
  }

  /**
   * Generate policy suggestion
   */
  private static async generatePolicySuggestion(
    question: Record<string, unknown>,
    organizationId: string
  ): Promise<AnswerSuggestion | null> {
    // Check if organization has policies
    const policies = await prisma.evidence.findMany({
      where: {
        organizationId,
        type: 'POLICY',
        status: 'APPROVED'
      },
      take: 1
    });

    if (policies.length > 0) {
      return {
        suggestedAnswer: `Yes, we have established and maintain comprehensive security policies. Our policies are regularly reviewed and updated to ensure they remain current and effective.`,
        confidenceScore: 75,
        sourceType: 'PATTERN',
        evidenceIds: policies.map(p => p.id),
        reasoning: 'Organization has documented policies',
        metadata: {
          policyCount: policies.length,
          patternMatched: true
        }
      };
    }

    return null;
  }

  /**
   * Generate training suggestion
   */
  private static async generateTrainingSuggestion(
    question: Record<string, unknown>,
    organizationId: string
  ): Promise<AnswerSuggestion | null> {
    // Check if organization has training evidence
    const trainingEvidence = await prisma.evidence.findMany({
      where: {
        organizationId,
        type: 'DOCUMENT',
        status: 'APPROVED'
      },
      take: 1
    });

    if (trainingEvidence.length > 0) {
      return {
        suggestedAnswer: `Yes, we provide regular security training and awareness programs to all employees. Training completion is tracked and documented.`,
        confidenceScore: 70,
        sourceType: 'PATTERN',
        evidenceIds: trainingEvidence.map(e => e.id),
        reasoning: 'Organization has training evidence',
        metadata: {
          trainingEvidenceCount: trainingEvidence.length,
          patternMatched: true
        }
      };
    }

    return null;
  }

  /**
   * Generate incident response suggestion
   */
  private static async generateIncidentResponseSuggestion(
    question: Record<string, unknown>,
    organizationId: string
  ): Promise<AnswerSuggestion | null> {
    // Check if organization has incident response evidence
    const incidentEvidence = await prisma.evidence.findMany({
      where: {
        organizationId,
        type: 'DOCUMENT',
        status: 'APPROVED'
      },
      take: 1
    });

    if (incidentEvidence.length > 0) {
      return {
        suggestedAnswer: `Yes, we have established incident response procedures and maintain an incident response team. Our procedures are tested regularly through drills and exercises.`,
        confidenceScore: 70,
        sourceType: 'PATTERN',
        evidenceIds: incidentEvidence.map(e => e.id),
        reasoning: 'Organization has incident response evidence',
        metadata: {
          incidentEvidenceCount: incidentEvidence.length,
          patternMatched: true
        }
      };
    }

    return null;
  }

  /**
   * Generate contextual suggestion
   */
  private static async generateContextualSuggestion(
    question: Record<string, unknown>
  ): Promise<AnswerSuggestion | null> {
    const questionText = (question.questionText as string)?.toLowerCase() || '';
    
    // Generate contextual response based on question content
    let suggestedAnswer = '';
    let confidence = 50;

    if (questionText.includes('access control')) {
      suggestedAnswer = `We implement comprehensive access controls including user authentication, authorization, and regular access reviews. Access is granted based on the principle of least privilege.`;
      confidence = 60;
    } else if (questionText.includes('encryption')) {
      suggestedAnswer = `We use industry-standard encryption for data at rest and in transit. Our encryption implementation follows best practices and is regularly reviewed.`;
      confidence = 60;
    } else if (questionText.includes('monitoring') || questionText.includes('logging')) {
      suggestedAnswer = `We maintain comprehensive logging and monitoring systems to track security events and detect potential threats. Logs are regularly reviewed and analyzed.`;
      confidence = 60;
    } else if (questionText.includes('backup') || questionText.includes('recovery')) {
      suggestedAnswer = `We maintain regular backups of critical data and systems. Our backup and recovery procedures are tested regularly to ensure business continuity.`;
      confidence = 60;
    } else {
      suggestedAnswer = `We have implemented appropriate security controls and procedures to address this requirement. Our security program is regularly reviewed and updated.`;
      confidence = 45;
    }

    return {
      suggestedAnswer,
      confidenceScore: confidence,
      sourceType: 'AI_GENERATED',
      evidenceIds: [],
      reasoning: 'AI-generated contextual response',
      metadata: {
        aiGenerated: true,
        questionAnalysis: {
          keywords: question.keywordsExtracted,
          riskLevel: question.riskLevel,
          questionType: question.questionType
        }
      }
    };
  }

  /**
   * Update answer library with new answer
   */
  static async updateAnswerLibrary(
    questionId: string,
    answerText: string,
    organizationId: string,
    createdBy: string
  ): Promise<void> {
    try {
      const question = await prisma.question.findUnique({
        where: { id: questionId }
      });

      if (!question) {
        throw new Error('Question not found');
      }

      // Determine category based on question content
      const category = this.determineAnswerCategory(question.questionText);

      // Create or update answer library entry
      await prisma.answerLibrary.create({
        data: {
          organizationId,
          category,
          keyPhrases: question.keywordsExtracted as string[],
          standardAnswer: answerText,
          evidenceReferences: question.controlMapping as string[],
          usageCount: 1,
          confidenceScore: 50,
          lastUsedAt: new Date(),
          createdBy
        }
      });
    } catch (error) {
      throw new Error(`Failed to update answer library: ${error}`);
    }
  }

  /**
   * Determine answer category from question text
   */
  private static determineAnswerCategory(questionText: string): 'ACCESS_CONTROL' | 'DATA_PROTECTION' | 'INCIDENT_RESPONSE' | 'NETWORK_SECURITY' | 'PHYSICAL_SECURITY' | 'BUSINESS_CONTINUITY' | 'VENDOR_MANAGEMENT' | 'COMPLIANCE_FRAMEWORK' | 'GENERAL_SECURITY' | 'CUSTOM' {
    const lowerText = questionText.toLowerCase();

    if (lowerText.includes('access') || lowerText.includes('authentication') || lowerText.includes('authorization')) {
      return 'ACCESS_CONTROL';
    }
    if (lowerText.includes('encryption') || lowerText.includes('data protection') || lowerText.includes('privacy')) {
      return 'DATA_PROTECTION';
    }
    if (lowerText.includes('incident') || lowerText.includes('response') || lowerText.includes('breach')) {
      return 'INCIDENT_RESPONSE';
    }
    if (lowerText.includes('network') || lowerText.includes('firewall') || lowerText.includes('vpn')) {
      return 'NETWORK_SECURITY';
    }
    if (lowerText.includes('physical') || lowerText.includes('facility') || lowerText.includes('building')) {
      return 'PHYSICAL_SECURITY';
    }
    if (lowerText.includes('backup') || lowerText.includes('recovery') || lowerText.includes('continuity')) {
      return 'BUSINESS_CONTINUITY';
    }
    if (lowerText.includes('vendor') || lowerText.includes('third party') || lowerText.includes('supplier')) {
      return 'VENDOR_MANAGEMENT';
    }
    if (lowerText.includes('compliance') || lowerText.includes('audit') || lowerText.includes('framework')) {
      return 'COMPLIANCE_FRAMEWORK';
    }

    return 'GENERAL_SECURITY';
  }
}
