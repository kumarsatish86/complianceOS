import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PolicyCreateData {
  organizationId: string;
  title: string;
  description?: string;
  category: string;
  policyType: string;
  ownerId: string;
  reviewerId?: string;
  approverId?: string;
  effectiveDate?: Date;
  nextReviewDate?: Date;
  retentionPeriod?: number;
  fileId?: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyUpdateData {
  title?: string;
  description?: string;
  category?: string;
  policyType?: string;
  reviewerId?: string;
  approverId?: string;
  effectiveDate?: Date;
  nextReviewDate?: Date;
  retentionPeriod?: number;
  fileId?: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyVersionData {
  policyId: string;
  version: string;
  fileId?: string;
  changeSummary?: string;
  createdBy: string;
  approvedBy?: string;
  diffSummary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface PolicyAcknowledgmentData {
  policyId: string;
  policyVersion: string;
  userId: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyAssignmentData {
  policyId: string;
  userGroup?: string;
  assignmentType: string;
  assignedBy: string;
  dueDate?: Date;
  mandatoryFlag?: boolean;
  metadata?: Record<string, unknown>;
}

export class PolicyService {
  // Policy Management
  async createPolicy(data: PolicyCreateData) {
    return await prisma.policy.create({
      data: {
        ...data,
        category: data.category as 'GOVERNANCE' | 'OPERATIONAL' | 'TECHNICAL' | 'LEGAL' | 'COMPLIANCE' | 'RISK_MANAGEMENT' | 'HUMAN_RESOURCES' | 'FINANCE' | 'CUSTOM',
        policyType: data.policyType as 'INFORMATION_SECURITY' | 'DATA_PROTECTION' | 'ACCESS_CONTROL' | 'INCIDENT_RESPONSE' | 'BUSINESS_CONTINUITY' | 'VENDOR_MANAGEMENT' | 'COMPLIANCE' | 'OPERATIONAL' | 'STRATEGIC' | 'CUSTOM',
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        status: 'DRAFT',
        version: '1.0.0'
      },
      include: {
        owner: true,
        reviewer: true,
        approver: true,
        organization: true
      }
    });
  }

  async getPolicyById(id: string) {
    return await prisma.policy.findUnique({
      where: { id },
      include: {
        owner: true,
        reviewer: true,
        approver: true,
        organization: true,
        versions: {
          orderBy: { createdAt: 'desc' }
        },
        acknowledgments: {
          include: {
            user: true
          }
        },
        assignments: {
          include: {
            assigner: true
          }
        },
        riskMappings: {
          include: {
            risk: true
          }
        }
      }
    });
  }

  async getPoliciesByOrganization(organizationId: string, filters?: {
    status?: string;
    category?: string;
    policyType?: string;
    ownerId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, category, policyType, ownerId, page = 1, limit = 20 } = filters || {};
    
    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;
    if (category) where.category = category;
    if (policyType) where.policyType = policyType;
    if (ownerId) where.ownerId = ownerId;

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        include: {
          owner: true,
          reviewer: true,
          approver: true,
          _count: {
            select: {
              acknowledgments: true,
              assignments: true,
              versions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.policy.count({ where })
    ]);

    return {
      policies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updatePolicy(id: string, data: PolicyUpdateData) {
    return await prisma.policy.update({
      where: { id },
      data: {
        ...data,
        category: data.category ? data.category as 'GOVERNANCE' | 'OPERATIONAL' | 'TECHNICAL' | 'LEGAL' | 'COMPLIANCE' | 'RISK_MANAGEMENT' | 'HUMAN_RESOURCES' | 'FINANCE' | 'CUSTOM' : undefined,
        policyType: data.policyType ? data.policyType as 'INFORMATION_SECURITY' | 'DATA_PROTECTION' | 'ACCESS_CONTROL' | 'INCIDENT_RESPONSE' | 'BUSINESS_CONTINUITY' | 'VENDOR_MANAGEMENT' | 'COMPLIANCE' | 'OPERATIONAL' | 'STRATEGIC' | 'CUSTOM' : undefined,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
      include: {
        owner: true,
        reviewer: true,
        approver: true,
        organization: true
      }
    });
  }

  async deletePolicy(id: string) {
    return await prisma.policy.delete({
      where: { id }
    });
  }

  async publishPolicy(id: string, publishedBy: string) {
    return await prisma.policy.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        approverId: publishedBy
      },
      include: {
        owner: true,
        reviewer: true,
        approver: true,
        organization: true
      }
    });
  }

  async archivePolicy(id: string) {
    return await prisma.policy.update({
      where: { id },
      data: {
        status: 'ARCHIVED'
      }
    });
  }

  // Policy Version Management
  async createPolicyVersion(data: PolicyVersionData) {
    return await prisma.policyVersion.create({
      data: {
        ...data,
        diffSummary: data.diffSummary ? JSON.parse(JSON.stringify(data.diffSummary)) : null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
      include: {
        policy: true,
        creator: true,
        approver: true
      }
    });
  }

  async getPolicyVersions(policyId: string) {
    return await prisma.policyVersion.findMany({
      where: { policyId },
      include: {
        creator: true,
        approver: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approvePolicyVersion(versionId: string, approvedBy: string) {
    return await prisma.policyVersion.update({
      where: { id: versionId },
      data: {
        approvedAt: new Date(),
        approvedBy
      },
      include: {
        policy: true,
        creator: true,
        approver: true
      }
    });
  }

  // Policy Acknowledgment Management
  async createAcknowledgment(data: PolicyAcknowledgmentData) {
    return await prisma.policyAcknowledgment.create({
      data: {
        ...data,
        status: 'PENDING',
        method: data.method ? data.method as 'DIGITAL_SIGNATURE' | 'ELECTRONIC_SIGNATURE' | 'QUIZ_COMPLETION' | 'VIDEO_VIEWING' | 'MOBILE_APP' | 'WEB_PORTAL' | 'DELEGATED' | 'OFFLINE_SYNC' : null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
      include: {
        policy: true,
        user: true
      }
    });
  }

  async acknowledgePolicy(acknowledgmentId: string, method?: string, ipAddress?: string, userAgent?: string) {
    return await prisma.policyAcknowledgment.update({
      where: { id: acknowledgmentId },
      data: {
        acknowledgedAt: new Date(),
        status: 'ACKNOWLEDGED',
        method: method as 'DIGITAL_SIGNATURE' | 'ELECTRONIC_SIGNATURE' | 'QUIZ_COMPLETION' | 'VIDEO_VIEWING' | 'MOBILE_APP' | 'WEB_PORTAL' | 'DELEGATED' | 'OFFLINE_SYNC',
        ipAddress,
        userAgent
      },
      include: {
        policy: true,
        user: true
      }
    });
  }

  async getPolicyAcknowledgments(policyId: string, filters?: {
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, userId, page = 1, limit = 20 } = filters || {};
    
    const where: Record<string, unknown> = { policyId };
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [acknowledgments, total] = await Promise.all([
      prisma.policyAcknowledgment.findMany({
        where,
        include: {
          user: true,
          policy: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.policyAcknowledgment.count({ where })
    ]);

    return {
      acknowledgments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Policy Assignment Management
  async createAssignment(data: PolicyAssignmentData) {
    return await prisma.policyAssignment.create({
      data: {
        ...data,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
      include: {
        policy: true,
        assigner: true
      }
    });
  }

  async getPolicyAssignments(policyId: string) {
    return await prisma.policyAssignment.findMany({
      where: { policyId },
      include: {
        assigner: true,
        policy: true
      },
      orderBy: { assignedAt: 'desc' }
    });
  }

  async deleteAssignment(assignmentId: string) {
    return await prisma.policyAssignment.delete({
      where: { id: assignmentId }
    });
  }

  // Analytics and Reporting
  async getPolicyAnalytics(organizationId: string) {
    const [
      totalPolicies,
      publishedPolicies,
      draftPolicies,
      archivedPolicies,
      totalAcknowledgments,
      pendingAcknowledgments,
      acknowledgedPolicies,
      overdueAcknowledgments
    ] = await Promise.all([
      prisma.policy.count({ where: { organizationId } }),
      prisma.policy.count({ where: { organizationId, status: 'PUBLISHED' } }),
      prisma.policy.count({ where: { organizationId, status: 'DRAFT' } }),
      prisma.policy.count({ where: { organizationId, status: 'ARCHIVED' } }),
      prisma.policyAcknowledgment.count({ 
        where: { 
          policy: { organizationId } 
        } 
      }),
      prisma.policyAcknowledgment.count({ 
        where: { 
          policy: { organizationId },
          status: 'PENDING'
        } 
      }),
      prisma.policyAcknowledgment.count({ 
        where: { 
          policy: { organizationId },
          status: 'ACKNOWLEDGED'
        } 
      }),
      prisma.policyAcknowledgment.count({ 
        where: { 
          policy: { organizationId },
          status: 'OVERDUE'
        } 
      })
    ]);

    const complianceRate = totalAcknowledgments > 0 
      ? (acknowledgedPolicies / totalAcknowledgments) * 100 
      : 0;

    return {
      totalPolicies,
      publishedPolicies,
      draftPolicies,
      archivedPolicies,
      totalAcknowledgments,
      pendingAcknowledgments,
      acknowledgedPolicies,
      overdueAcknowledgments,
      complianceRate: Math.round(complianceRate * 100) / 100
    };
  }

  async getPolicyComplianceTrends(organizationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await prisma.policyAcknowledgment.findMany({
      where: {
        policy: { organizationId },
        acknowledgedAt: {
          gte: startDate
        }
      },
      select: {
        acknowledgedAt: true,
        status: true
      },
      orderBy: { acknowledgedAt: 'asc' }
    });

    // Group by date and calculate daily compliance rates
    const dailyData = trends.reduce((acc: Record<string, { total: number; acknowledged: number }>, trend) => {
      if (!trend.acknowledgedAt) return acc;
      
      const date = trend.acknowledgedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, acknowledged: 0 };
      }
      
      acc[date].total++;
      if (trend.status === 'ACKNOWLEDGED') {
        acc[date].acknowledged++;
      }
      
      return acc;
    }, {});

    return Object.entries(dailyData).map(([date, data]: [string, { total: number; acknowledged: number }]) => ({
      date,
      complianceRate: data.total > 0 ? (data.acknowledged / data.total) * 100 : 0,
      total: data.total,
      acknowledged: data.acknowledged
    }));
  }

  // Search and Discovery
  async searchPolicies(organizationId: string, query: string, filters?: {
    category?: string;
    policyType?: string;
    status?: string;
  }) {
    const { category, policyType, status } = filters || {};
    
    const where: Record<string, unknown> = {
      organizationId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (category) where.category = category;
    if (policyType) where.policyType = policyType;
    if (status) where.status = status;

    return await prisma.policy.findMany({
      where,
      include: {
        owner: true,
        reviewer: true,
        approver: true,
        _count: {
          select: {
            acknowledgments: true,
            assignments: true,
            versions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const policyService = new PolicyService();
