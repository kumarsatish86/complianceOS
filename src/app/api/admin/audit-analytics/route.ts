import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const timeframe = searchParams.get('timeframe') || '30d';
    const auditRunId = searchParams.get('auditRunId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check permissions
    await requireAuditPermission(organizationId);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeframe) {
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
    const whereClause: {
      organizationId: string;
      createdAt: { gte: Date; lte: Date };
      id?: string;
    } = {
      organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (auditRunId) {
      whereClause.id = auditRunId;
    }

    // Get audit runs with related data
    const auditRuns = await prisma.auditRun.findMany({
      where: whereClause,
      include: {
        auditControls: {
          include: {
            control: true
          }
        },
        auditFindings: true,
        auditEvidenceLinks: true,
        auditActivities: true,
        tasks: true,
        guestAuditors: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate analytics
    const analytics = {
      overview: calculateOverviewMetrics(auditRuns),
      trends: calculateTrends(auditRuns, timeframe),
      compliance: calculateComplianceMetrics(auditRuns),
      findings: calculateFindingsMetrics(auditRuns),
      efficiency: calculateEfficiencyMetrics(auditRuns),
      risk: calculateRiskMetrics(auditRuns),
      frameworks: calculateFrameworkMetrics(auditRuns),
      activities: calculateActivityMetrics(auditRuns)
    };

    return NextResponse.json({ analytics });

  } catch (error) {
    console.error('Error fetching audit analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit analytics' },
      { status: 500 }
    );
  }
}

interface AuditFinding {
  createdAt: Date;
  updatedAt: Date;
  status: string;
  severity: string;
}

interface AuditControl {
  status: string;
  control: {
    category: string;
  };
}

interface AuditActivity {
  activityType: string;
  performedBy: string;
  timestamp: Date;
}

interface FrameworkMetrics {
  name: string;
  auditCount: number;
  totalControls: number;
  totalFindings: number;
  controlsCount: number;
  findingsCount: number;
  complianceRate: number;
}

interface AuditRunData {
  name: string;
  status: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  framework?: { name: string };
  auditControls: AuditControl[];
  auditFindings: AuditFinding[];
  auditEvidenceLinks: unknown[];
  auditActivities: AuditActivity[];
}

function calculateOverviewMetrics(auditRuns: AuditRunData[]) {
  const totalAudits = auditRuns.length;
  const completedAudits = auditRuns.filter(ar => ar.status === 'LOCKED').length;
  const inProgressAudits = auditRuns.filter(ar => ar.status === 'IN_PROGRESS').length;
  const overdueAudits = auditRuns.filter(ar => 
    ar.status !== 'LOCKED' && new Date(ar.endDate) < new Date()
  ).length;

  const totalControls = auditRuns.reduce((sum, ar) => sum + ar.auditControls.length, 0);
  const totalFindings = auditRuns.reduce((sum, ar) => sum + ar.auditFindings.length, 0);
  const totalEvidence = auditRuns.reduce((sum, ar) => sum + ar.auditEvidenceLinks.length, 0);

  return {
    totalAudits,
    completedAudits,
    inProgressAudits,
    overdueAudits,
    totalControls,
    totalFindings,
    totalEvidence,
    completionRate: totalAudits > 0 ? (completedAudits / totalAudits * 100).toFixed(1) : 0
  };
}

function calculateTrends(auditRuns: AuditRunData[], timeframe: string) {
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
  const trends = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const auditsOnDate = auditRuns.filter(ar => 
      ar.createdAt.toISOString().split('T')[0] === dateStr
    );

    const completedOnDate = auditsOnDate.filter(ar => 
      ar.status === 'LOCKED' && 
      ar.updatedAt.toISOString().split('T')[0] === dateStr
    );

    trends.push({
      date: dateStr,
      auditsCreated: auditsOnDate.length,
      auditsCompleted: completedOnDate.length,
      findingsCreated: auditsOnDate.reduce((sum, ar) => 
        sum + ar.auditFindings.filter(f =>
          f.createdAt.toISOString().split('T')[0] === dateStr
        ).length, 0
      )
    });
  }

  return trends;
}

function calculateComplianceMetrics(auditRuns: AuditRunData[]) {
  const allControls = auditRuns.flatMap(ar => ar.auditControls);
  const totalControls = allControls.length;

  if (totalControls === 0) {
    return {
      complianceRate: 0,
      controlsByStatus: {},
      controlsByCategory: {},
      complianceTrend: []
    };
  }

  const controlsByStatus = allControls.reduce((acc: Record<string, number>, control) => {
    acc[control.status] = (acc[control.status] || 0) + 1;
    return acc;
  }, {});

  const controlsByCategory = allControls.reduce((acc: Record<string, number>, control) => {
    const category = control.control.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const compliantControls = controlsByStatus.COMPLIANT || 0;
  const complianceRate = (compliantControls / totalControls * 100).toFixed(1);

  return {
    complianceRate: parseFloat(complianceRate),
    controlsByStatus,
    controlsByCategory,
    totalControls
  };
}

function calculateFindingsMetrics(auditRuns: AuditRunData[]) {
  const allFindings = auditRuns.flatMap(ar => ar.auditFindings);
  const totalFindings = allFindings.length;

  if (totalFindings === 0) {
    return {
      findingsBySeverity: {},
      findingsByStatus: {},
      averageResolutionTime: 0,
      criticalFindings: 0
    };
  }

  const findingsBySeverity = allFindings.reduce((acc: Record<string, number>, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {});

  const findingsByStatus = allFindings.reduce((acc: Record<string, number>, finding) => {
    acc[finding.status] = (acc[finding.status] || 0) + 1;
    return acc;
  }, {});

  const criticalFindings = findingsBySeverity.CRITICAL || 0;
  const highFindings = findingsBySeverity.HIGH || 0;

  // Calculate average resolution time for closed findings
  const closedFindings = allFindings.filter(f => f.status === 'CLOSED');
  const resolutionTimes = closedFindings.map(f => {
    const created = new Date(f.createdAt);
    const updated = new Date(f.updatedAt);
    return (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
  });

  const averageResolutionTime = resolutionTimes.length > 0 
    ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length 
    : 0;

  return {
    findingsBySeverity,
    findingsByStatus,
    averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
    criticalFindings,
    highFindings,
    totalFindings
  };
}

function calculateEfficiencyMetrics(auditRuns: AuditRunData[]) {
  const completedAudits = auditRuns.filter(ar => ar.status === 'LOCKED');
  
  if (completedAudits.length === 0) {
    return {
      averageAuditDuration: 0,
      averageControlsPerAudit: 0,
      averageFindingsPerAudit: 0,
      efficiencyScore: 0
    };
  }

  // Calculate average audit duration
  const durations = completedAudits.map(ar => {
    const start = new Date(ar.startDate);
    const end = new Date(ar.endDate);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // days
  });

  const averageAuditDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;

  // Calculate averages
  const averageControlsPerAudit = completedAudits.reduce((sum, ar) => 
    sum + ar.auditControls.length, 0) / completedAudits.length;

  const averageFindingsPerAudit = completedAudits.reduce((sum, ar) => 
    sum + ar.auditFindings.length, 0) / completedAudits.length;

  // Calculate efficiency score (0-100)
  const efficiencyScore = Math.max(0, Math.min(100, 
    100 - (averageFindingsPerAudit * 10) - (averageAuditDuration / 10)
  ));

  return {
    averageAuditDuration: Math.round(averageAuditDuration * 10) / 10,
    averageControlsPerAudit: Math.round(averageControlsPerAudit * 10) / 10,
    averageFindingsPerAudit: Math.round(averageFindingsPerAudit * 10) / 10,
    efficiencyScore: Math.round(efficiencyScore)
  };
}

function calculateRiskMetrics(auditRuns: AuditRunData[]) {
  const allFindings = auditRuns.flatMap(ar => ar.auditFindings);
  const openFindings = allFindings.filter(f => f.status === 'OPEN');
  const criticalOpen = openFindings.filter(f => f.severity === 'CRITICAL').length;
  const highOpen = openFindings.filter(f => f.severity === 'HIGH').length;

  // Calculate risk score (0-100)
  let riskScore = 0;
  riskScore += criticalOpen * 25; // Critical findings add 25 points each
  riskScore += highOpen * 10;    // High findings add 10 points each
  riskScore += openFindings.length * 2; // Each open finding adds 2 points

  riskScore = Math.min(100, riskScore);

  // Determine risk level
  let riskLevel = 'LOW';
  if (riskScore >= 70) riskLevel = 'CRITICAL';
  else if (riskScore >= 50) riskLevel = 'HIGH';
  else if (riskScore >= 30) riskLevel = 'MEDIUM';

  return {
    riskScore,
    riskLevel,
    openFindings: openFindings.length,
    criticalOpen,
    highOpen,
    riskTrend: calculateRiskTrend(auditRuns)
  };
}

function calculateRiskTrend(auditRuns: AuditRunData[]) {
  // Calculate risk trend over time
  const riskTrend = auditRuns.map(ar => {
    const findings = ar.auditFindings;
    const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
    const highCount = findings.filter(f => f.severity === 'HIGH').length;
    const openCount = findings.filter(f => f.status === 'OPEN').length;
    
    const riskScore = criticalCount * 25 + highCount * 10 + openCount * 2;
    
    return {
      date: ar.createdAt.toISOString().split('T')[0],
      riskScore: Math.min(100, riskScore),
      auditRun: ar.name
    };
  });

  return riskTrend.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function calculateFrameworkMetrics(auditRuns: AuditRunData[]) {
  const frameworks = auditRuns.reduce((acc: Record<string, FrameworkMetrics>, ar) => {
    const frameworkName = ar.framework?.name || 'No Framework';
    if (!acc[frameworkName]) {
      acc[frameworkName] = {
        name: frameworkName,
        auditCount: 0,
        totalControls: 0,
        totalFindings: 0,
        controlsCount: 0,
        findingsCount: 0,
        complianceRate: 0
      };
    }
    
    acc[frameworkName].auditCount++;
    acc[frameworkName].totalControls += ar.auditControls.length;
    acc[frameworkName].totalFindings += ar.auditFindings.length;
    
    return acc;
  }, {});

  // Calculate compliance rates for each framework
  Object.values(frameworks).forEach((framework: FrameworkMetrics) => {
    const frameworkAudits = auditRuns.filter(ar => 
      (ar.framework?.name || 'No Framework') === framework.name
    );
    const allControls = frameworkAudits.flatMap(ar => ar.auditControls);
    const compliantControls = allControls.filter(c => c.status === 'COMPLIANT').length;
    framework.complianceRate = allControls.length > 0
      ? parseFloat((compliantControls / allControls.length * 100).toFixed(1))
      : 0;
  });

  return Object.values(frameworks);
}

function calculateActivityMetrics(auditRuns: AuditRunData[]) {
  const allActivities = auditRuns.flatMap(ar => ar.auditActivities);
  
  const activitiesByType = allActivities.reduce((acc: Record<string, number>, activity) => {
    acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
    return acc;
  }, {});

  const activitiesByUser = allActivities.reduce((acc: Record<string, number>, activity) => {
    const userName = activity.performedBy || 'Unknown';
    acc[userName] = (acc[userName] || 0) + 1;
    return acc;
  }, {});

  return {
    totalActivities: allActivities.length,
    activitiesByType,
    activitiesByUser,
    recentActivities: allActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  };
}
