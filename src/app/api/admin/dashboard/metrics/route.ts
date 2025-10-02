/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { MetricType, MetricCategory } from '@prisma/client';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const metricType = searchParams.get('metricType') as MetricType | null;
    const category = searchParams.get('category') as MetricCategory | null;
    const ___timeframe = searchParams.get('___timeframe') || '30d';
    const includeTrends = searchParams.get('includeTrends') === 'true';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check permissions
    await requireAuditPermission(organizationId);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (___timeframe) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Build where clause
    const whereClause: any = {
      organizationId,
      capturedAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (metricType) {
      whereClause.metricType = metricType;
    }

    if (category) {
      whereClause.metricCategory = category;
    }

    // Get metrics
    const metrics = await prisma.metricSnapshot.findMany({
      where: whereClause,
      orderBy: { capturedAt: 'desc' },
      take: 1000 // Limit for performance
    });

    // Calculate current values and trends
    const currentMetrics = await calculateCurrentMetrics(organizationId);
    const trends = includeTrends ? await calculateTrends(metrics) : null;

    return NextResponse.json({
      currentMetrics,
      trends,
      ___timeframe,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, metricType, value, metadata, calculationMethod, dataSource } = await request.json();

    if (!organizationId || !metricType || value === undefined) {
      return NextResponse.json({ 
        error: 'Organization ID, metric type, and value are required' 
      }, { status: 400 });
    }

    // Check permissions
    await requireAuditPermission(organizationId);

    // Create metric snapshot
    const metricSnapshot = await prisma.metricSnapshot.create({
      data: {
        organizationId,
        metricType,
        metricCategory: getMetricCategory(metricType),
        value: parseFloat(value),
        metadata: metadata || {},
        calculationMethod,
        dataSource
      }
    });

    // Trigger dashboard event
    await prisma.dashboardEvent.create({
      data: {
        organizationId,
        eventType: 'DATA_UPDATE',
        eventData: {
          metricType,
          value,
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      metricSnapshot
    });

  } catch (error) {
    console.error('Error creating metric snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create metric snapshot' },
      { status: 500 }
    );
  }
}

async function calculateCurrentMetrics(organizationId: string) {
  // Get latest metrics for each type
  const latestMetrics = await prisma.metricSnapshot.findMany({
    where: { organizationId },
    orderBy: { capturedAt: 'desc' },
    distinct: ['metricType']
  });

  const currentMetrics: Record<string, unknown> = {};

  for (const metric of latestMetrics) {
    currentMetrics[metric.metricType] = {
      value: metric.value,
      metadata: metric.metadata,
      capturedAt: metric.capturedAt,
      calculationMethod: metric.calculationMethod
    };
  }

  // Calculate derived metrics
  currentMetrics.COMPLIANCE_SCORE = await calculateComplianceScore(organizationId);
  currentMetrics.EVIDENCE_HEALTH = await calculateEvidenceHealth(organizationId);
  currentMetrics.TASK_PERFORMANCE = await calculateTaskPerformance(organizationId);
  currentMetrics.AUDIT_READINESS = await calculateAuditReadiness(organizationId);

  return currentMetrics;
}

async function calculateComplianceScore(organizationId: string) {
  // Get latest framework metrics
  const frameworkMetrics = await prisma.frameworkMetric.findMany({
    where: { organizationId },
    orderBy: { snapshotDate: 'desc' },
    distinct: ['frameworkId'],
    include: { framework: true }
  });

  if (frameworkMetrics.length === 0) {
    return { value: 0, metadata: { frameworks: 0, average: 0 } };
  }

  const totalCoverage = frameworkMetrics.reduce((sum, fm) => sum + fm.coveragePercentage, 0);
  const averageCoverage = totalCoverage / frameworkMetrics.length;

  return {
    value: averageCoverage,
    metadata: {
      frameworks: frameworkMetrics.length,
      average: averageCoverage,
      breakdown: frameworkMetrics.map(fm => ({
        framework: fm.framework.name,
        coverage: fm.coveragePercentage
      }))
    }
  };
}

async function calculateEvidenceHealth(organizationId: string) {
  // Get latest evidence metrics
  const evidenceMetric = await prisma.evidenceMetric.findFirst({
    where: { organizationId },
    orderBy: { snapshotDate: 'desc' }
  });

  if (!evidenceMetric) {
    return { value: 0, metadata: { totalEvidence: 0, expiring: 0 } };
  }

  const expiringTotal = evidenceMetric.expiring30Days + evidenceMetric.expiring60Days + evidenceMetric.expiring90Days;
  const healthScore = evidenceMetric.totalEvidence > 0 
    ? ((evidenceMetric.totalEvidence - expiringTotal) / evidenceMetric.totalEvidence) * 100
    : 100;

  return {
    value: healthScore,
    metadata: {
      totalEvidence: evidenceMetric.totalEvidence,
      expiring30Days: evidenceMetric.expiring30Days,
      expiring60Days: evidenceMetric.expiring60Days,
      expiring90Days: evidenceMetric.expiring90Days,
      reusePercentage: evidenceMetric.reusePercentage,
      approvalBacklog: evidenceMetric.approvalBacklog
    }
  };
}

async function calculateTaskPerformance(organizationId: string) {
  // Get latest task metrics
  const taskMetric = await prisma.taskMetric.findFirst({
    where: { organizationId },
    orderBy: { snapshotDate: 'desc' }
  });

  if (!taskMetric) {
    return { value: 0, metadata: { totalTasks: 0, completed: 0, overdue: 0 } };
  }

  const completionRate = taskMetric.totalTasks > 0 
    ? (taskMetric.completedTasks / taskMetric.totalTasks) * 100
    : 100;

  return {
    value: completionRate,
    metadata: {
      totalTasks: taskMetric.totalTasks,
      completedTasks: taskMetric.completedTasks,
      overdueTasks: taskMetric.overdueTasks,
      averageCompletionTime: taskMetric.averageCompletionTime,
      slaComplianceRate: taskMetric.slaComplianceRate
    }
  };
}

async function calculateAuditReadiness(organizationId: string) {
  // Get active audit runs
  const activeAudits = await prisma.auditRun.findMany({
    where: {
      organizationId,
      status: { in: ['DRAFT', 'IN_PROGRESS', 'REVIEW'] }
    },
    include: {
      auditControls: {
        include: {
          control: true
        }
      },
      auditEvidenceLinks: true
    }
  });

  if (activeAudits.length === 0) {
    return { value: 100, metadata: { activeAudits: 0, readiness: 'No active audits' } };
  }

  let totalReadiness = 0;
  const auditReadiness = [];

  for (const audit of activeAudits) {
    const totalControls = audit.auditControls.length;
    const evidenceLinked = audit.auditEvidenceLinks.length;
    const readiness = totalControls > 0 ? (evidenceLinked / totalControls) * 100 : 100;
    
    totalReadiness += readiness;
    auditReadiness.push({
      auditId: audit.id,
      auditName: audit.name,
      readiness: readiness,
      controls: totalControls,
      evidenceLinked: evidenceLinked
    });
  }

  const averageReadiness = totalReadiness / activeAudits.length;

  return {
    value: averageReadiness,
    metadata: {
      activeAudits: activeAudits.length,
      averageReadiness: averageReadiness,
      breakdown: auditReadiness
    }
  };
}

async function calculateTrends(metrics: any[]) {
  const trends: Record<string, unknown> = {};
  const metricTypes = [...new Set(metrics.map(m => m.metricType))];

  for (const metricType of metricTypes) {
    const typeMetrics = metrics.filter(m => m.metricType === metricType);
    
    if (typeMetrics.length < 2) {
      trends[metricType] = { direction: 'stable', change: 0 };
      continue;
    }

    // Sort by date
    typeMetrics.sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
    
    const firstValue = typeMetrics[0].value;
    const lastValue = typeMetrics[typeMetrics.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;

    trends[metricType] = {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      change: change,
      changePercent: changePercent,
      dataPoints: typeMetrics.map(m => ({
        value: m.value,
        date: m.capturedAt
      }))
    };
  }

  return trends;
}

function getMetricCategory(metricType: MetricType): MetricCategory {
  const categoryMap: Record<MetricType, MetricCategory> = {
    COMPLIANCE_SCORE: 'COMPLIANCE',
    FRAMEWORK_COVERAGE: 'COMPLIANCE',
    CONTROL_STATUS: 'COMPLIANCE',
    EVIDENCE_HEALTH: 'EVIDENCE',
    TASK_PERFORMANCE: 'OPERATIONAL',
    AUDIT_READINESS: 'AUDIT',
    FINDING_MANAGEMENT: 'AUDIT',
    RISK_POSTURE: 'RISK',
    USER_PRODUCTIVITY: 'PERFORMANCE',
    SYSTEM_PERFORMANCE: 'PERFORMANCE'
  };

  return categoryMap[metricType] || 'PERFORMANCE';
}
