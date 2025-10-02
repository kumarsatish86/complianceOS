import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GovernanceDashboardData {
  organizationId: string;
  dashboardType: string;
  title: string;
  description?: string;
  configuration?: Record<string, unknown>;
  isDefault?: boolean;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface GovernanceMetricData {
  organizationId: string;
  metricType: string;
  metricName: string;
  metricValue: number;
  targetValue?: number;
  unit?: string;
  calculationMethod?: string;
  dataSource?: string;
  metadata?: Record<string, unknown>;
}

export interface GovernanceAlertData {
  organizationId: string;
  alertType: string;
  title: string;
  description?: string;
  severity: string;
  metadata?: Record<string, unknown>;
}

export class GovernanceService {
  // Dashboard Management
  async createDashboard(data: GovernanceDashboardData) {
    return await prisma.governanceDashboard.create({
      data: {
        ...data,
        configuration: data.configuration ? JSON.parse(JSON.stringify(data.configuration)) : null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
      include: {
        creator: true,
        organization: true
      }
    });
  }

  async getDashboardById(id: string) {
    return await prisma.governanceDashboard.findUnique({
      where: { id },
      include: {
        creator: true,
        organization: true
      }
    });
  }

  async getDashboardsByOrganization(organizationId: string, filters?: {
    dashboardType?: string;
    isDefault?: boolean;
    createdBy?: string;
  }) {
    const { dashboardType, isDefault, createdBy } = filters || {};
    
    const where: Record<string, unknown> = { organizationId };
    if (dashboardType) where.dashboardType = dashboardType;
    if (isDefault !== undefined) where.isDefault = isDefault;
    if (createdBy) where.createdBy = createdBy;

    return await prisma.governanceDashboard.findMany({
      where,
      include: {
        creator: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateDashboard(id: string, data: {
    title?: string;
    description?: string;
    configuration?: Record<string, unknown>;
    isDefault?: boolean;
    metadata?: Record<string, unknown>;
  }) {
    return await prisma.governanceDashboard.update({
      where: { id },
      data: {
        ...data,
        configuration: data.configuration ? JSON.parse(JSON.stringify(data.configuration)) : undefined,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
      include: {
        creator: true,
        organization: true
      }
    });
  }

  async deleteDashboard(id: string) {
    return await prisma.governanceDashboard.delete({
      where: { id }
    });
  }

  async setDefaultDashboard(id: string, organizationId: string) {
    // First, unset all other default dashboards for this organization
    await prisma.governanceDashboard.updateMany({
      where: { 
        organizationId,
        isDefault: true
      },
      data: { isDefault: false }
    });

    // Then set this dashboard as default
    return await prisma.governanceDashboard.update({
      where: { id },
      data: { isDefault: true },
      include: {
        creator: true,
        organization: true
      }
    });
  }

  // Metrics Management
  async createMetric(data: GovernanceMetricData) {
    return await prisma.governanceMetric.create({
      data: {
        ...data,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
      include: {
        organization: true
      }
    });
  }

  async getMetricsByOrganization(organizationId: string, filters?: {
    metricType?: string;
    limit?: number;
  }) {
    const { metricType, limit = 50 } = filters || {};
    
    const where: Record<string, unknown> = { organizationId };
    if (metricType) where.metricType = metricType;

    return await prisma.governanceMetric.findMany({
      where,
      include: {
        organization: true
      },
      orderBy: { lastUpdated: 'desc' },
      take: limit
    });
  }

  async updateMetric(id: string, data: {
    metricValue?: number;
    targetValue?: number;
    calculationMethod?: string;
    dataSource?: string;
    metadata?: Record<string, unknown>;
  }) {
    return await prisma.governanceMetric.update({
      where: { id },
      data: {
        ...data,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
        lastUpdated: new Date()
      },
      include: {
        organization: true
      }
    });
  }

  async deleteMetric(id: string) {
    return await prisma.governanceMetric.delete({
      where: { id }
    });
  }

  // Alert Management
  async createAlert(data: GovernanceAlertData) {
    return await prisma.governanceAlert.create({
      data: {
        ...data,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        status: 'ACTIVE'
      },
      include: {
        organization: true
      }
    });
  }

  async getAlertsByOrganization(organizationId: string, filters?: {
    status?: string;
    severity?: string;
    alertType?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, severity, alertType, page = 1, limit = 20 } = filters || {};
    
    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (alertType) where.alertType = alertType;

    const [alerts, total] = await Promise.all([
      prisma.governanceAlert.findMany({
        where,
        include: {
          acknowledger: true,
          resolver: true
        },
        orderBy: { triggeredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.governanceAlert.count({ where })
    ]);

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string) {
    return await prisma.governanceAlert.update({
      where: { id },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy,
        status: 'ACKNOWLEDGED'
      },
      include: {
        acknowledger: true,
        resolver: true,
        organization: true
      }
    });
  }

  async resolveAlert(id: string, resolvedBy: string) {
    return await prisma.governanceAlert.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        resolvedBy,
        status: 'RESOLVED'
      },
      include: {
        acknowledger: true,
        resolver: true,
        organization: true
      }
    });
  }

  async dismissAlert(id: string) {
    return await prisma.governanceAlert.update({
      where: { id },
      data: {
        status: 'DISMISSED'
      }
    });
  }

  // Executive Dashboard Analytics
  async getExecutiveDashboardData(organizationId: string) {
    const [
      policyMetrics,
      riskMetrics,
      complianceMetrics,
      recentAlerts
    ] = await Promise.all([
      this.getPolicyComplianceMetrics(organizationId),
      this.getRiskExposureMetrics(organizationId),
      this.getComplianceMetrics(organizationId),
      this.getRecentAlerts(organizationId, 10)
    ]);

    return {
      policyCompliance: policyMetrics,
      riskExposure: riskMetrics,
      complianceStatus: complianceMetrics,
      recentAlerts
    };
  }

  async getPolicyComplianceMetrics(organizationId: string) {
    const [
      totalPolicies,
      publishedPolicies,
      totalAcknowledgments,
      acknowledgedPolicies,
      overdueAcknowledgments
    ] = await Promise.all([
      prisma.policy.count({ where: { organizationId } }),
      prisma.policy.count({ where: { organizationId, status: 'PUBLISHED' } }),
      prisma.policyAcknowledgment.count({ 
        where: { 
          policy: { organizationId } 
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
      totalAcknowledgments,
      acknowledgedPolicies,
      overdueAcknowledgments,
      complianceRate: Math.round(complianceRate * 100) / 100
    };
  }

  async getRiskExposureMetrics(organizationId: string) {
    const [
      totalRisks,
      criticalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      identifiedRisks,
      assessedRisks,
      treatmentPlannedRisks,
      treatmentImplementedRisks,
      closedRisks
    ] = await Promise.all([
      prisma.risk.count({ where: { organizationId } }),
      prisma.risk.count({ where: { organizationId, severityInherent: 'CRITICAL' } }),
      prisma.risk.count({ where: { organizationId, severityInherent: 'HIGH' } }),
      prisma.risk.count({ where: { organizationId, severityInherent: 'MEDIUM' } }),
      prisma.risk.count({ where: { organizationId, severityInherent: 'LOW' } }),
      prisma.risk.count({ where: { organizationId, status: 'IDENTIFIED' } }),
      prisma.risk.count({ where: { organizationId, status: 'ASSESSED' } }),
      prisma.risk.count({ where: { organizationId, status: 'TREATMENT_PLANNED' } }),
      prisma.risk.count({ where: { organizationId, status: 'TREATMENT_IMPLEMENTED' } }),
      prisma.risk.count({ where: { organizationId, status: 'CLOSED' } })
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
      closed: closedRisks
    };

    return {
      totalRisks,
      riskDistribution,
      statusDistribution
    };
  }

  async getComplianceMetrics(organizationId: string) {
    const [
      totalControls,
      metControls,
      partialControls,
      gapControls,
      notApplicableControls,
      totalEvidence,
      approvedEvidence,
      expiringEvidence,
      totalTasks,
      completedTasks,
      overdueTasks
    ] = await Promise.all([
      prisma.control.count({ where: { organizationId } }),
      prisma.control.count({ where: { organizationId, status: 'MET' } }),
      prisma.control.count({ where: { organizationId, status: 'PARTIAL' } }),
      prisma.control.count({ where: { organizationId, status: 'GAP' } }),
      prisma.control.count({ where: { organizationId, status: 'NOT_APPLICABLE' } }),
      prisma.evidence.count({ where: { organizationId } }),
      prisma.evidence.count({ where: { organizationId, status: 'APPROVED' } }),
      prisma.evidence.count({ 
        where: { 
          organizationId,
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        } 
      }),
      prisma.task.count({ where: { organizationId } }),
      prisma.task.count({ where: { organizationId, status: 'COMPLETED' } }),
      prisma.task.count({ 
        where: { 
          organizationId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() }
        } 
      })
    ]);

    const controlComplianceRate = totalControls > 0 
      ? ((metControls + partialControls) / totalControls) * 100 
      : 0;

    const evidenceApprovalRate = totalEvidence > 0 
      ? (approvedEvidence / totalEvidence) * 100 
      : 0;

    const taskCompletionRate = totalTasks > 0 
      ? (completedTasks / totalTasks) * 100 
      : 0;

    return {
      totalControls,
      metControls,
      partialControls,
      gapControls,
      notApplicableControls,
      controlComplianceRate: Math.round(controlComplianceRate * 100) / 100,
      totalEvidence,
      approvedEvidence,
      expiringEvidence,
      evidenceApprovalRate: Math.round(evidenceApprovalRate * 100) / 100,
      totalTasks,
      completedTasks,
      overdueTasks,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100
    };
  }

  async getRecentAlerts(organizationId: string, limit: number = 10) {
    return await prisma.governanceAlert.findMany({
      where: { organizationId },
      include: {
        acknowledger: true,
        resolver: true
      },
      orderBy: { triggeredAt: 'desc' },
      take: limit
    });
  }

  // Risk Heatmap Data
  async getRiskHeatmapData(organizationId: string) {
    const risks = await prisma.risk.findMany({
      where: { organizationId },
      select: {
        category: true,
        subcategory: true,
        severityInherent: true,
        likelihoodInherent: true,
        impactInherent: true,
        businessUnit: true,
        status: true
      }
    });

    // Create heatmap data structure
    const heatmapData = risks.reduce((acc: Record<string, {
      category: string;
      subcategory: string | null;
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      businessUnits: Set<string>;
      statusCounts: Record<string, number>;
      [key: string]: unknown;
    }>, risk) => {
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
          businessUnits: new Set(),
          statusCounts: {}
        };
      }
      
      acc[key].total++;
      (acc[key] as Record<string, unknown>)[risk.severityInherent.toLowerCase()] = ((acc[key] as Record<string, unknown>)[risk.severityInherent.toLowerCase()] as number || 0) + 1;
      acc[key].statusCounts[risk.status] = (acc[key].statusCounts[risk.status] || 0) + 1;
      
      if (risk.businessUnit) {
        acc[key].businessUnits.add(risk.businessUnit);
      }
      
      return acc;
    }, {});

    return Object.values(heatmapData).map((item: Record<string, unknown>) => ({
      ...item,
      businessUnits: Array.from(item.businessUnits as Set<string>)
    }));
  }

  // Policy Compliance Trends
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

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      complianceRate: data.total > 0 ? (data.acknowledged / data.total) * 100 : 0,
      total: data.total,
      acknowledged: data.acknowledged
    }));
  }

  // Risk Trends
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
    const dailyData = trends.reduce((acc: Record<string, {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      identified: number;
      assessed: number;
      closed: number;
      [key: string]: unknown;
    }>, risk) => {
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
      (acc[date] as Record<string, unknown>)[risk.severityInherent.toLowerCase()] = ((acc[date] as Record<string, unknown>)[risk.severityInherent.toLowerCase()] as number || 0) + 1;
      (acc[date] as Record<string, unknown>)[risk.status.toLowerCase()] = ((acc[date] as Record<string, unknown>)[risk.status.toLowerCase()] as number || 0) + 1;
      
      return acc;
    }, {});

    return Object.entries(dailyData).map(([date, data]: [string, Record<string, unknown>]) => ({
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

  // Automated Alert Generation
  async generatePolicyComplianceAlerts(organizationId: string) {
    const overdueAcknowledgments = await prisma.policyAcknowledgment.findMany({
      where: {
        policy: { organizationId },
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      },
      include: {
        policy: true,
        user: true
      }
    });

    const alerts = [];
    for (const acknowledgment of overdueAcknowledgments) {
      // Check if alert already exists
      const existingAlert = await prisma.governanceAlert.findFirst({
        where: {
          organizationId,
          alertType: 'POLICY_OVERDUE',
          status: 'ACTIVE',
          metadata: {
            path: ['acknowledgmentId'],
            equals: acknowledgment.id
          }
        }
      });

      if (!existingAlert) {
        const alert = await this.createAlert({
          organizationId,
          alertType: 'POLICY_OVERDUE',
          title: `Overdue Policy Acknowledgment`,
          description: `User ${acknowledgment.user.name} has not acknowledged policy "${acknowledgment.policy.title}" within the required timeframe.`,
          severity: 'MEDIUM',
          metadata: {
            acknowledgmentId: acknowledgment.id,
            policyId: acknowledgment.policyId,
            userId: acknowledgment.userId
          }
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  async generateRiskThresholdAlerts(organizationId: string) {
    const criticalRisks = await prisma.risk.findMany({
      where: {
        organizationId,
        severityInherent: 'CRITICAL',
        status: { in: ['IDENTIFIED', 'ASSESSED'] }
      }
    });

    const alerts = [];
    for (const risk of criticalRisks) {
      // Check if alert already exists
      const existingAlert = await prisma.governanceAlert.findFirst({
        where: {
          organizationId,
          alertType: 'RISK_THRESHOLD',
          status: 'ACTIVE',
          metadata: {
            path: ['riskId'],
            equals: risk.id
          }
        }
      });

      if (!existingAlert) {
        const alert = await this.createAlert({
          organizationId,
          alertType: 'RISK_THRESHOLD',
          title: `Critical Risk Identified`,
          description: `Risk "${risk.title}" has been identified as CRITICAL and requires immediate attention.`,
          severity: 'CRITICAL',
          metadata: {
            riskId: risk.id,
            riskTitle: risk.title,
            severity: risk.severityInherent
          }
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  // Dashboard Widget Data
  async getDashboardWidgetData(organizationId: string, widgetType: string) {
    switch (widgetType) {
      case 'POLICY_COMPLIANCE_SCORE':
        return await this.getPolicyComplianceMetrics(organizationId);
      
      case 'RISK_EXPOSURE_OVERVIEW':
        return await this.getRiskExposureMetrics(organizationId);
      
      case 'COMPLIANCE_STATUS':
        return await this.getComplianceMetrics(organizationId);
      
      case 'RISK_HEATMAP':
        return await this.getRiskHeatmapData(organizationId);
      
      case 'POLICY_COMPLIANCE_TRENDS':
        return await this.getPolicyComplianceTrends(organizationId);
      
      case 'RISK_TRENDS':
        return await this.getRiskTrends(organizationId);
      
      case 'RECENT_ALERTS':
        return await this.getRecentAlerts(organizationId, 5);
      
      default:
        return null;
    }
  }
}

export const governanceService = new GovernanceService();
