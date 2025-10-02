import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RiskCreateData {
  organizationId: string;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  likelihoodInherent: string;
  impactInherent: string;
  severityInherent: string;
  ownerId: string;
  businessUnit?: string;
  metadata?: Record<string, unknown>;
}

export interface RiskUpdateData {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  likelihoodInherent?: string;
  impactInherent?: string;
  likelihoodResidual?: string;
  impactResidual?: string;
  severityInherent?: string;
  severityResidual?: string;
  status?: string;
  businessUnit?: string;
  metadata?: Record<string, unknown>;
}

export interface RiskAssessmentData {
  riskId: string;
  assessedBy: string;
  methodology: string;
  likelihoodScore: number;
  impactScore: number;
  severityCalculation: string;
  confidenceLevel?: number;
  notes?: string;
  nextAssessmentDue?: Date;
  approvedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface RiskTreatmentData {
  riskId: string;
  treatmentStrategy: string;
  treatmentDescription: string;
  ownerId: string;
  startDate?: Date;
  targetCompletionDate?: Date;
  budgetAllocated?: number;
  metadata?: Record<string, unknown>;
}

export interface RiskControlMappingData {
  riskId: string;
  controlId: string;
  mappingType: string;
  effectivenessRating?: number;
  coveragePercentage?: number;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface RiskPolicyMappingData {
  riskId: string;
  policyId: string;
  mappingType: string;
  effectivenessRating?: number;
  coveragePercentage?: number;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export class RiskService {
  // Risk Management
  async createRisk(data: RiskCreateData) {
    return await prisma.risk.create({
      data: {
        ...data,
        status: 'IDENTIFIED',
        category: data.category as 'STRATEGIC' | 'OPERATIONAL' | 'FINANCIAL' | 'COMPLIANCE' | 'SECURITY' | 'TECHNOLOGY' | 'HUMAN_RESOURCES' | 'SUPPLY_CHAIN' | 'REPUTATION' | 'REGULATORY' | 'CUSTOM',
        subcategory: data.subcategory as 'MARKET_RISK' | 'COMPETITIVE_RISK' | 'INNOVATION_RISK' | 'REPUTATION_RISK' | 'PROCESS_RISK' | 'TECHNOLOGY_RISK' | 'HUMAN_RESOURCE_RISK' | 'SUPPLY_CHAIN_RISK' | 'CREDIT_RISK' | 'LIQUIDITY_RISK' | 'CYBERSECURITY_RISK' | 'PHYSICAL_SECURITY_RISK' | 'DATA_PROTECTION_RISK' | 'PRIVACY_RISK' | 'REGULATORY_RISK' | 'LEGAL_RISK' | 'CONTRACTUAL_RISK' | 'POLICY_RISK' | 'CUSTOM' || undefined,
        likelihoodInherent: data.likelihoodInherent as 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY' | 'CERTAIN',
        impactInherent: data.impactInherent as 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL',
        severityInherent: data.severityInherent as 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL',
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
      include: {
        owner: true,
        organization: true
      }
    });
  }

  async getRiskById(id: string) {
    return await prisma.risk.findUnique({
      where: { id },
      include: {
        owner: true,
        organization: true,
        assessments: {
          include: {
            assessor: true,
            approver: true
          },
          orderBy: { assessmentDate: 'desc' }
        },
        treatments: {
          include: {
            owner: true
          },
          orderBy: { createdAt: 'desc' }
        },
        controlMappings: {
          include: {
            control: true,
            creator: true
          }
        },
        policyMappings: {
          include: {
            policy: true,
            creator: true
          }
        }
      }
    });
  }

  async getRisksByOrganization(organizationId: string, filters?: {
    status?: string;
    category?: string;
    subcategory?: string;
    ownerId?: string;
    severityInherent?: string;
    businessUnit?: string;
    page?: number;
    limit?: number;
  }) {
    const { 
      status, 
      category, 
      subcategory, 
      ownerId, 
      severityInherent, 
      businessUnit, 
      page = 1, 
      limit = 20 
    } = filters || {};
    
    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;
    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (ownerId) where.ownerId = ownerId;
    if (severityInherent) where.severityInherent = severityInherent;
    if (businessUnit) where.businessUnit = businessUnit;

    const [risks, total] = await Promise.all([
      prisma.risk.findMany({
        where,
        include: {
          owner: true,
          _count: {
            select: {
              assessments: true,
              treatments: true,
              controlMappings: true,
              policyMappings: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.risk.count({ where })
    ]);

    return {
      risks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateRisk(id: string, data: RiskUpdateData) {
    return await prisma.risk.update({
      where: { id },
      data: {
        ...data,
        category: data.category ? data.category as 'STRATEGIC' | 'OPERATIONAL' | 'FINANCIAL' | 'COMPLIANCE' | 'SECURITY' | 'TECHNOLOGY' | 'HUMAN_RESOURCES' | 'SUPPLY_CHAIN' | 'REPUTATION' | 'REGULATORY' | 'CUSTOM' : undefined,
        subcategory: data.subcategory ? data.subcategory as 'MARKET_RISK' | 'COMPETITIVE_RISK' | 'INNOVATION_RISK' | 'REPUTATION_RISK' | 'PROCESS_RISK' | 'TECHNOLOGY_RISK' | 'HUMAN_RESOURCE_RISK' | 'SUPPLY_CHAIN_RISK' | 'CREDIT_RISK' | 'LIQUIDITY_RISK' | 'CYBERSECURITY_RISK' | 'PHYSICAL_SECURITY_RISK' | 'DATA_PROTECTION_RISK' | 'PRIVACY_RISK' | 'REGULATORY_RISK' | 'LEGAL_RISK' | 'CONTRACTUAL_RISK' | 'POLICY_RISK' | 'CUSTOM' : undefined,
        likelihoodInherent: data.likelihoodInherent ? data.likelihoodInherent as 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY' | 'CERTAIN' : undefined,
        impactInherent: data.impactInherent ? data.impactInherent as 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL' : undefined,
        likelihoodResidual: data.likelihoodResidual ? data.likelihoodResidual as 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY' | 'CERTAIN' : undefined,
        impactResidual: data.impactResidual ? data.impactResidual as 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL' : undefined,
        severityInherent: data.severityInherent ? data.severityInherent as 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL' : undefined,
        severityResidual: data.severityResidual ? data.severityResidual as 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL' : undefined,
        status: data.status ? data.status as 'IDENTIFIED' | 'ASSESSED' | 'TREATMENT_PLANNED' | 'TREATMENT_IMPLEMENTED' | 'MONITORED' | 'CLOSED' | 'REOPENED' : undefined,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
      include: {
        owner: true,
        organization: true
      }
    });
  }

  async deleteRisk(id: string) {
    return await prisma.risk.delete({
      where: { id }
    });
  }

  async closeRisk(id: string) {
    return await prisma.risk.update({
      where: { id },
      data: {
        status: 'CLOSED'
      }
    });
  }

  async reopenRisk(id: string) {
    return await prisma.risk.update({
      where: { id },
      data: {
        status: 'REOPENED'
      }
    });
  }

  // Risk Assessment Management
  async createRiskAssessment(data: RiskAssessmentData) {
    return await prisma.riskAssessment.create({
      data: {
        ...data,
        methodology: data.methodology as 'QUANTITATIVE' | 'QUALITATIVE' | 'SEMI_QUANTITATIVE' | 'EXPERT_JUDGMENT' | 'DELPHI_METHOD' | 'MONTE_CARLO' | 'SCENARIO_ANALYSIS' | 'SENSITIVITY_ANALYSIS' | 'CUSTOM',
        severityCalculation: data.severityCalculation as 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL',
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
      include: {
        risk: true,
        assessor: true,
        approver: true
      }
    });
  }

  async getRiskAssessments(riskId: string) {
    return await prisma.riskAssessment.findMany({
      where: { riskId },
      include: {
        assessor: true,
        approver: true
      },
      orderBy: { assessmentDate: 'desc' }
    });
  }

  async approveRiskAssessment(assessmentId: string, approvedBy: string) {
    return await prisma.riskAssessment.update({
      where: { id: assessmentId },
      data: {
        approvedAt: new Date(),
        approvedBy
      },
      include: {
        risk: true,
        assessor: true,
        approver: true
      }
    });
  }

  // Risk Treatment Management
  async createRiskTreatment(data: RiskTreatmentData) {
    return await prisma.riskTreatment.create({
      data: {
        ...data,
        status: 'PLANNED',
        treatmentStrategy: data.treatmentStrategy as 'AVOID' | 'TRANSFER' | 'MITIGATE' | 'ACCEPT' | 'EXPLOIT' | 'COMBINATION',
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
      include: {
        risk: true,
        owner: true
      }
    });
  }

  async getRiskTreatments(riskId: string) {
    return await prisma.riskTreatment.findMany({
      where: { riskId },
      include: {
        owner: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateRiskTreatment(id: string, data: {
    treatmentStrategy?: string;
    treatmentDescription?: string;
    startDate?: Date;
    targetCompletionDate?: Date;
    actualCompletionDate?: Date;
    budgetAllocated?: number;
    actualCost?: number;
    status?: string;
    effectivenessRating?: number;
    metadata?: Record<string, unknown>;
  }) {
    return await prisma.riskTreatment.update({
      where: { id },
      data: {
        ...data,
        treatmentStrategy: data.treatmentStrategy ? data.treatmentStrategy as 'AVOID' | 'TRANSFER' | 'MITIGATE' | 'ACCEPT' | 'EXPLOIT' | 'COMBINATION' : undefined,
        status: data.status ? data.status as 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED' | 'FAILED' : undefined,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
      include: {
        risk: true,
        owner: true
      }
    });
  }

  async completeRiskTreatment(id: string, actualCost?: number, effectivenessRating?: number) {
    return await prisma.riskTreatment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualCompletionDate: new Date(),
        actualCost,
        effectivenessRating
      },
      include: {
        risk: true,
        owner: true
      }
    });
  }

  // Risk-Control Mapping Management
  async createRiskControlMapping(data: RiskControlMappingData) {
    return await prisma.riskControlMapping.create({
      data: {
        ...data,
        mappingType: data.mappingType as 'DIRECT_CONTROL' | 'COMPENSATING_CONTROL' | 'DETECTIVE_CONTROL' | 'PREVENTIVE_CONTROL' | 'CORRECTIVE_CONTROL' | 'MONITORING_CONTROL',
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
      include: {
        risk: true,
        control: true,
        creator: true
      }
    });
  }

  async getRiskControlMappings(riskId: string) {
    return await prisma.riskControlMapping.findMany({
      where: { riskId },
      include: {
        control: true,
        creator: true
      }
    });
  }

  async getControlRiskMappings(controlId: string) {
    return await prisma.riskControlMapping.findMany({
      where: { controlId },
      include: {
        risk: true,
        creator: true
      }
    });
  }

  async updateRiskControlMapping(id: string, data: {
    mappingType?: string;
    effectivenessRating?: number;
    coveragePercentage?: number;
    validatedAt?: Date;
    metadata?: Record<string, unknown>;
  }) {
    return await prisma.riskControlMapping.update({
      where: { id },
      data: {
        ...data,
        mappingType: data.mappingType ? data.mappingType as 'DIRECT_CONTROL' | 'COMPENSATING_CONTROL' | 'DETECTIVE_CONTROL' | 'PREVENTIVE_CONTROL' | 'CORRECTIVE_CONTROL' | 'MONITORING_CONTROL' : undefined,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
      include: {
        risk: true,
        control: true,
        creator: true
      }
    });
  }

  async deleteRiskControlMapping(id: string) {
    return await prisma.riskControlMapping.delete({
      where: { id }
    });
  }

  // Risk-Policy Mapping Management
  async createRiskPolicyMapping(data: RiskPolicyMappingData) {
    return await prisma.riskPolicyMapping.create({
      data: {
        ...data,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
      include: {
        risk: true,
        policy: true,
        creator: true
      }
    });
  }

  async getRiskPolicyMappings(riskId: string) {
    return await prisma.riskPolicyMapping.findMany({
      where: { riskId },
      include: {
        policy: true,
        creator: true
      }
    });
  }

  async getPolicyRiskMappings(policyId: string) {
    return await prisma.riskPolicyMapping.findMany({
      where: { policyId },
      include: {
        risk: true,
        creator: true
      }
    });
  }

  async updateRiskPolicyMapping(id: string, data: {
    mappingType?: string;
    effectivenessRating?: number;
    coveragePercentage?: number;
    validatedAt?: Date;
    metadata?: Record<string, unknown>;
  }) {
    return await prisma.riskPolicyMapping.update({
      where: { id },
      data: {
        ...data,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
      include: {
        risk: true,
        policy: true,
        creator: true
      }
    });
  }

  async deleteRiskPolicyMapping(id: string) {
    return await prisma.riskPolicyMapping.delete({
      where: { id }
    });
  }

  // Analytics and Reporting
  async getRiskAnalytics(organizationId: string) {
    const [
      totalRisks,
      identifiedRisks,
      assessedRisks,
      treatmentPlannedRisks,
      treatmentImplementedRisks,
      monitoredRisks,
      closedRisks,
      reopenedRisks,
      criticalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      totalTreatments,
      completedTreatments,
      inProgressTreatments,
      plannedTreatments
    ] = await Promise.all([
      prisma.risk.count({ where: { organizationId } }),
      prisma.risk.count({ where: { organizationId, status: 'IDENTIFIED' } }),
      prisma.risk.count({ where: { organizationId, status: 'ASSESSED' } }),
      prisma.risk.count({ where: { organizationId, status: 'TREATMENT_PLANNED' } }),
      prisma.risk.count({ where: { organizationId, status: 'TREATMENT_IMPLEMENTED' } }),
      prisma.risk.count({ where: { organizationId, status: 'MONITORED' } }),
      prisma.risk.count({ where: { organizationId, status: 'CLOSED' } }),
      prisma.risk.count({ where: { organizationId, status: 'REOPENED' } }),
      prisma.risk.count({ where: { organizationId, severityInherent: 'CRITICAL' } }),
      prisma.risk.count({ where: { organizationId, severityInherent: 'HIGH' } }),
      prisma.risk.count({ where: { organizationId, severityInherent: 'MEDIUM' } }),
      prisma.risk.count({ where: { organizationId, severityInherent: 'LOW' } }),
      prisma.riskTreatment.count({ 
        where: { 
          risk: { organizationId } 
        } 
      }),
      prisma.riskTreatment.count({ 
        where: { 
          risk: { organizationId },
          status: 'COMPLETED'
        } 
      }),
      prisma.riskTreatment.count({ 
        where: { 
          risk: { organizationId },
          status: 'IN_PROGRESS'
        } 
      }),
      prisma.riskTreatment.count({ 
        where: { 
          risk: { organizationId },
          status: 'PLANNED'
        } 
      })
    ]);

    const riskDistribution = {
      critical: criticalRisks,
      high: highRisks,
      medium: mediumRisks,
      low: lowRisks
    };

    const statusDistribution = {
      identified: identifiedRisks,
      assessed: assessedRisks,
      treatmentPlanned: treatmentPlannedRisks,
      treatmentImplemented: treatmentImplementedRisks,
      monitored: monitoredRisks,
      closed: closedRisks,
      reopened: reopenedRisks
    };

    const treatmentDistribution = {
      total: totalTreatments,
      completed: completedTreatments,
      inProgress: inProgressTreatments,
      planned: plannedTreatments
    };

    return {
      totalRisks,
      riskDistribution,
      statusDistribution,
      treatmentDistribution
    };
  }

  async getRiskTrends(organizationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await prisma.risk.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate
        }
      },
      select: {
        createdAt: true,
        severityInherent: true,
        status: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date and calculate daily risk metrics
    const dailyData = trends.reduce((acc: Record<string, { total: number; critical: number; high: number; medium: number; low: number; identified: number; assessed: number; closed: number }>, risk) => {
      const date = risk.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { 
          total: 0, 
          critical: 0, 
          high: 0, 
          medium: 0, 
          low: 0,
          identified: 0,
          assessed: 0,
          closed: 0
        };
      }
      
      acc[date].total++;
      (acc[date] as Record<string, number>)[risk.severityInherent.toLowerCase()]++;
      (acc[date] as Record<string, number>)[risk.status.toLowerCase()]++;
      
      return acc;
    }, {} as Record<string, { total: number; critical: number; high: number; medium: number; low: number; identified: number; assessed: number; closed: number }>);

    return Object.entries(dailyData).map(([date, data]: [string, { total: number; critical: number; high: number; medium: number; low: number; identified: number; assessed: number; closed: number }]) => ({
      date,
      total: data.total,
      critical: data.critical,
      high: data.high,
      medium: data.medium,
      low: data.low,
      identified: data.identified,
      assessed: data.assessed,
      closed: data.closed
    }));
  }

  async getRiskHeatmap(organizationId: string) {
    const risks = await prisma.risk.findMany({
      where: { organizationId },
      select: {
        category: true,
        subcategory: true,
        severityInherent: true,
        likelihoodInherent: true,
        impactInherent: true,
        businessUnit: true
      }
    });

    // Create heatmap data structure
    const heatmapData = risks.reduce((acc: Record<string, { category: string; subcategory: string | null; total: number; critical: number; high: number; medium: number; low: number; businessUnits: Set<string> }>, risk) => {
      const key = `${risk.category}-${risk.subcategory || 'NONE'}`;
      if (!acc[key]) {
        acc[key] = {
          category: risk.category,
          subcategory: risk.subcategory,
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          businessUnits: new Set()
        };
      }
      
      acc[key].total++;
      const severityKey = risk.severityInherent.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
      if (severityKey in acc[key]) {
        acc[key][severityKey]++;
      }
      if (risk.businessUnit) {
        acc[key].businessUnits.add(risk.businessUnit);
      }
      
      return acc;
    }, {} as Record<string, { category: string; subcategory: string | null; total: number; critical: number; high: number; medium: number; low: number; businessUnits: Set<string> }>);

    return Object.values(heatmapData).map((item: { category: string; subcategory: string | null; total: number; critical: number; high: number; medium: number; low: number; businessUnits: Set<string> }) => ({
      ...item,
      businessUnits: Array.from(item.businessUnits)
    }));
  }

  // Search and Discovery
  async searchRisks(organizationId: string, query: string, filters?: {
    category?: string;
    subcategory?: string;
    status?: string;
    severityInherent?: string;
    businessUnit?: string;
  }) {
    const { category, subcategory, status, severityInherent, businessUnit } = filters || {};
    
    const where: Record<string, unknown> = {
      organizationId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (status) where.status = status;
    if (severityInherent) where.severityInherent = severityInherent;
    if (businessUnit) where.businessUnit = businessUnit;

    return await prisma.risk.findMany({
      where,
      include: {
        owner: true,
        _count: {
          select: {
            assessments: true,
            treatments: true,
            controlMappings: true,
            policyMappings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Risk Assessment Calculations
  calculateRiskScore(likelihood: string, impact: string): string {
    const likelihoodMap: { [key: string]: number } = {
      'VERY_UNLIKELY': 1,
      'UNLIKELY': 2,
      'POSSIBLE': 3,
      'LIKELY': 4,
      'VERY_LIKELY': 5,
      'CERTAIN': 6
    };

    const impactMap: { [key: string]: number } = {
      'VERY_LOW': 1,
      'LOW': 2,
      'MEDIUM': 3,
      'HIGH': 4,
      'VERY_HIGH': 5,
      'CRITICAL': 6
    };

    const score = likelihoodMap[likelihood] * impactMap[impact];
    
    if (score <= 4) return 'LOW';
    if (score <= 9) return 'MEDIUM';
    if (score <= 16) return 'HIGH';
    if (score <= 25) return 'VERY_HIGH';
    return 'CRITICAL';
  }

  // Risk Treatment Effectiveness
  async calculateTreatmentEffectiveness(riskId: string) {
    const treatments = await prisma.riskTreatment.findMany({
      where: { riskId },
      select: {
        effectivenessRating: true,
        status: true,
        actualCost: true,
        budgetAllocated: true
      }
    });

    const completedTreatments = treatments.filter(t => t.status === 'COMPLETED');
    const totalEffectiveness = completedTreatments.reduce((sum, t) => sum + (t.effectivenessRating || 0), 0);
    const averageEffectiveness = completedTreatments.length > 0 
      ? totalEffectiveness / completedTreatments.length 
      : 0;

    const totalBudget = treatments.reduce((sum, t) => sum + (t.budgetAllocated || 0), 0);
    const totalActualCost = treatments.reduce((sum, t) => sum + (t.actualCost || 0), 0);
    const budgetVariance = totalBudget > 0 ? ((totalActualCost - totalBudget) / totalBudget) * 100 : 0;

    return {
      averageEffectiveness: Math.round(averageEffectiveness * 100) / 100,
      totalTreatments: treatments.length,
      completedTreatments: completedTreatments.length,
      totalBudget,
      totalActualCost,
      budgetVariance: Math.round(budgetVariance * 100) / 100
    };
  }
}

export const riskService = new RiskService();
