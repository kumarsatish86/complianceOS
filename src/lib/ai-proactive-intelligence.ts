import { PrismaClient } from '@prisma/client';
import { aiService } from './ai-service';

const prisma = new PrismaClient();

export interface GapAnalysisResult {
  id: string;
  type: 'EVIDENCE_GAP' | 'POLICY_GAP' | 'CONTROL_GAP' | 'RISK_GAP' | 'COMPLIANCE_GAP';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  recommendations: string[];
  affectedItems: Record<string, unknown>[];
  estimatedEffort: string;
  priority: number;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'EVIDENCE_REUSE' | 'PROCESS_OPTIMIZATION' | 'CONTROL_RATIONALIZATION' | 'AUTOMATION_OPPORTUNITY';
  title: string;
  description: string;
  potentialSavings: string;
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  steps: string[];
}

export class AIProactiveIntelligence {
  /**
   * Analyze compliance gaps across all modules
   */
  async analyzeComplianceGaps(organizationId: string): Promise<GapAnalysisResult[]> {
    try {
      const gaps: GapAnalysisResult[] = [];

      // Analyze evidence gaps
      const evidenceGaps = await this.analyzeEvidenceGaps(organizationId);
      gaps.push(...evidenceGaps);

      // Analyze policy gaps
      const policyGaps = await this.analyzePolicyGaps(organizationId);
      gaps.push(...policyGaps);

      // Analyze control gaps
      const controlGaps = await this.analyzeControlGaps(organizationId);
      gaps.push(...controlGaps);

      // Analyze risk gaps
      const riskGaps = await this.analyzeRiskGaps(organizationId);
      gaps.push(...riskGaps);

      return gaps.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.error('Gap analysis error:', error);
      return [];
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(organizationId: string): Promise<OptimizationRecommendation[]> {
    try {
      const recommendations: OptimizationRecommendation[] = [];

      // Evidence reuse opportunities
      const evidenceReuse = await this.findEvidenceReuseOpportunities(organizationId);
      recommendations.push(...evidenceReuse);

      // Process optimization opportunities
      const processOptimization = await this.findProcessOptimizationOpportunities(organizationId);
      recommendations.push(...processOptimization);

      // Control rationalization opportunities
      const controlRationalization = await this.findControlRationalizationOpportunities(organizationId);
      recommendations.push(...controlRationalization);

      // Automation opportunities
      const automationOpportunities = await this.findAutomationOpportunities(organizationId);
      recommendations.push(...automationOpportunities);

      return recommendations.sort((a, b) => {
        const impactScore = { LOW: 1, MEDIUM: 2, HIGH: 3 };
        const effortScore = { LOW: 3, MEDIUM: 2, HIGH: 1 };
        return (impactScore[b.impact] * effortScore[a.implementationEffort]) - 
               (impactScore[a.impact] * effortScore[b.implementationEffort]);
      });
    } catch (error) {
      console.error('Optimization recommendations error:', error);
      return [];
    }
  }

  /**
   * Generate audit readiness assessment
   */
  async generateAuditReadinessAssessment(organizationId: string, frameworkId?: string): Promise<{
    readinessScore: number;
    gaps: GapAnalysisResult[];
    recommendations: OptimizationRecommendation[];
    timeline: Record<string, unknown>;
    riskAssessment: Record<string, unknown>;
  }> {
    try {
      const prompt = `Generate a comprehensive audit readiness assessment for our organization:

Organization ID: ${organizationId}
Framework: ${frameworkId || 'All frameworks'}

Please analyze:
1. Overall compliance posture
2. Evidence completeness
3. Control implementation status
4. Policy coverage
5. Risk management maturity
6. Audit preparation status
7. Critical gaps and recommendations
8. Timeline for audit readiness

Provide specific, actionable recommendations with priority levels.`;

      const response = await aiService.processQuery({
        organizationId,
        userId: 'system', // System-generated assessment
        queryText: prompt,
      });

      return {
        readinessScore: response.confidenceScore,
        gaps: [],
        recommendations: [],
        timeline: {},
        riskAssessment: {},
      };
    } catch (error) {
      console.error('Audit readiness assessment error:', error);
      throw new Error('Failed to generate audit readiness assessment');
    }
  }

  /**
   * Analyze evidence gaps
   */
  private async analyzeEvidenceGaps(organizationId: string): Promise<GapAnalysisResult[]> {
    const gaps: GapAnalysisResult[] = [];

    // Find controls without evidence
    const controlsWithoutEvidence = await prisma.control.findMany({
      where: {
        organizationId,
        evidenceLinks: {
          none: {},
        },
      },
      include: {
        framework: true,
      },
    });

    for (const control of controlsWithoutEvidence) {
      gaps.push({
        id: `evidence-gap-${control.id}`,
        type: 'EVIDENCE_GAP',
        severity: control.criticality === 'HIGH' ? 'CRITICAL' : 'HIGH',
        title: `Missing Evidence for ${control.name}`,
        description: `Control ${control.name} in ${control.framework.name} lacks supporting evidence`,
        recommendations: [
          'Identify relevant evidence documents',
          'Upload or create evidence for this control',
          'Link evidence to control in the system',
          'Ensure evidence is approved and current',
        ],
        affectedItems: [control],
        estimatedEffort: '2-4 hours',
        priority: control.criticality === 'HIGH' ? 10 : 8,
      });
    }

    // Find expiring evidence
    const expiringEvidence = await prisma.evidence.findMany({
      where: {
        organizationId,
        expiryDate: {
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Next 90 days
        },
      },
    });

    for (const evidence of expiringEvidence) {
      gaps.push({
        id: `expiring-evidence-${evidence.id}`,
        type: 'EVIDENCE_GAP',
        severity: 'MEDIUM',
        title: `Evidence Expiring Soon: ${evidence.title}`,
        description: `Evidence "${evidence.title}" expires on ${evidence.expiryDate?.toDateString()}`,
        recommendations: [
          'Review evidence for renewal requirements',
          'Update or replace expiring evidence',
          'Ensure continuity of evidence coverage',
          'Update evidence expiration tracking',
        ],
        affectedItems: [evidence],
        estimatedEffort: '1-2 hours',
        priority: 6,
      });
    }

    return gaps;
  }

  /**
   * Analyze policy gaps
   */
  private async analyzePolicyGaps(organizationId: string): Promise<GapAnalysisResult[]> {
    const gaps: GapAnalysisResult[] = [];

    // Find overdue policies
    const overduePolicies = await prisma.policy.findMany({
      where: {
        organizationId,
        nextReviewDate: {
          lte: new Date(),
        },
        status: {
          not: 'ARCHIVED',
        },
      },
    });

    for (const policy of overduePolicies) {
      gaps.push({
        id: `overdue-policy-${policy.id}`,
        type: 'POLICY_GAP',
        severity: 'MEDIUM',
        title: `Overdue Policy Review: ${policy.title}`,
        description: `Policy "${policy.title}" is overdue for review (due: ${policy.nextReviewDate?.toDateString()})`,
        recommendations: [
          'Schedule policy review meeting',
          'Update policy content if needed',
          'Obtain necessary approvals',
          'Update review schedule',
        ],
        affectedItems: [policy],
        estimatedEffort: '4-8 hours',
        priority: 7,
      });
    }

    return gaps;
  }

  /**
   * Analyze control gaps
   */
  private async analyzeControlGaps(organizationId: string): Promise<GapAnalysisResult[]> {
    const gaps: GapAnalysisResult[] = [];

    // Find controls with gaps
    const controlGaps = await prisma.control.findMany({
      where: {
        organizationId,
        status: 'GAP',
      },
      include: {
        framework: true,
      },
    });

    for (const control of controlGaps) {
      gaps.push({
        id: `control-gap-${control.id}`,
        type: 'CONTROL_GAP',
        severity: control.criticality === 'HIGH' ? 'CRITICAL' : 'HIGH',
        title: `Control Gap: ${control.name}`,
        description: `Control ${control.name} in ${control.framework.name} has identified gaps`,
        recommendations: [
          'Assess current implementation',
          'Develop remediation plan',
          'Implement missing controls',
          'Test control effectiveness',
        ],
        affectedItems: [control],
        estimatedEffort: '8-16 hours',
        priority: control.criticality === 'HIGH' ? 10 : 9,
      });
    }

    return gaps;
  }

  /**
   * Analyze risk gaps
   */
  private async analyzeRiskGaps(organizationId: string): Promise<GapAnalysisResult[]> {
    const gaps: GapAnalysisResult[] = [];

    // Find risks without treatment plans
    const risksWithoutTreatment = await prisma.risk.findMany({
      where: {
        organizationId,
        treatments: {
          none: {},
        },
        status: {
          not: 'CLOSED',
        },
      },
    });

    for (const risk of risksWithoutTreatment) {
      gaps.push({
        id: `risk-treatment-gap-${risk.id}`,
        type: 'RISK_GAP',
        severity: risk.severityInherent === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        title: `Missing Treatment Plan: ${risk.title}`,
        description: `Risk "${risk.title}" lacks a treatment plan`,
        recommendations: [
          'Develop risk treatment strategy',
          'Assign treatment owner',
          'Set treatment timeline',
          'Monitor treatment progress',
        ],
        affectedItems: [risk],
        estimatedEffort: '4-8 hours',
        priority: risk.severityInherent === 'CRITICAL' ? 10 : 8,
      });
    }

    return gaps;
  }

  /**
   * Find evidence reuse opportunities
   */
  private async findEvidenceReuseOpportunities(organizationId: string): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Find evidence that could be reused across controls
    const evidenceWithMultipleControls = await prisma.evidence.findMany({
      where: {
        organizationId,
        controlLinks: {
          some: {},
        },
      },
      include: {
        controlLinks: {
          include: {
            control: {
              include: {
                framework: true,
              },
            },
          },
        },
      },
    });

    for (const evidence of evidenceWithMultipleControls) {
      if (evidence.controlLinks.length > 1) {
        recommendations.push({
          id: `evidence-reuse-${evidence.id}`,
          type: 'EVIDENCE_REUSE',
          title: `Evidence Reuse Opportunity: ${evidence.title}`,
          description: `Evidence "${evidence.title}" is already linked to ${evidence.controlLinks.length} controls`,
          potentialSavings: '2-4 hours per additional control',
          implementationEffort: 'LOW',
          impact: 'MEDIUM',
          steps: [
            'Review evidence applicability to other controls',
            'Identify additional controls that could use this evidence',
            'Link evidence to applicable controls',
            'Update evidence documentation',
          ],
        });
      }
    }

    return recommendations;
  }

  /**
   * Find process optimization opportunities
   */
  private async findProcessOptimizationOpportunities(organizationId: string): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze task completion times
    const taskMetrics = await prisma.taskMetric.findFirst({
      where: { organizationId },
      orderBy: { snapshotDate: 'desc' },
    });

    if (taskMetrics && taskMetrics.averageCompletionTime && taskMetrics.averageCompletionTime > 24) {
      recommendations.push({
        id: 'process-optimization-tasks',
        type: 'PROCESS_OPTIMIZATION',
        title: 'Task Completion Time Optimization',
        description: `Average task completion time is ${taskMetrics.averageCompletionTime.toFixed(1)} hours`,
        potentialSavings: '20-30% reduction in task completion time',
        implementationEffort: 'MEDIUM',
        impact: 'HIGH',
        steps: [
          'Analyze task workflow bottlenecks',
          'Implement task automation where possible',
          'Improve task assignment and prioritization',
          'Provide better task templates and guidance',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Find control rationalization opportunities
   */
  private async findControlRationalizationOpportunities(organizationId: string): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Find controls with low effectiveness
    const lowEffectivenessControls = await prisma.control.findMany({
      where: {
        organizationId,
        evidenceLinks: {
          some: {
            effectivenessRating: {
              lt: 0.7,
            },
          },
        },
      },
      include: {
        evidenceLinks: true,
        framework: true,
      },
    });

    if (lowEffectivenessControls.length > 0) {
      recommendations.push({
        id: 'control-rationalization-effectiveness',
        type: 'CONTROL_RATIONALIZATION',
        title: 'Control Effectiveness Improvement',
        description: `${lowEffectivenessControls.length} controls have low effectiveness ratings`,
        potentialSavings: 'Improved compliance posture and reduced audit findings',
        implementationEffort: 'HIGH',
        impact: 'HIGH',
        steps: [
          'Review control implementation effectiveness',
          'Identify root causes of low effectiveness',
          'Develop improvement plans for each control',
          'Implement enhanced controls or compensating controls',
          'Monitor effectiveness improvements',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Find automation opportunities
   */
  private async findAutomationOpportunities(organizationId: string): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Find repetitive tasks that could be automated
    const repetitiveTasks = await prisma.task.findMany({
      where: {
        organizationId,
        type: 'EVIDENCE_COLLECTION',
        status: 'COMPLETED',
      },
      take: 10,
    });

    if (repetitiveTasks.length >= 5) {
      recommendations.push({
        id: 'automation-evidence-collection',
        type: 'AUTOMATION_OPPORTUNITY',
        title: 'Evidence Collection Automation',
        description: 'Multiple evidence collection tasks could be automated',
        potentialSavings: '50-70% reduction in manual evidence collection time',
        implementationEffort: 'HIGH',
        impact: 'HIGH',
        steps: [
          'Identify evidence collection patterns',
          'Develop automated evidence collection workflows',
          'Integrate with source systems',
          'Implement automated evidence validation',
          'Set up monitoring and alerts',
        ],
      });
    }

    return recommendations;
  }
}

export const aiProactiveIntelligence = new AIProactiveIntelligence();
