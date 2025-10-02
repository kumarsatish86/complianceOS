import { prisma } from './prisma';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  organizationId: string;
  widgetTypes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeCharts?: boolean;
}

export interface ExportData {
  dashboard: {
    name: string;
    organization: string;
    exportedAt: string;
    widgets: Record<string, unknown>[];
  };
  metrics: {
    complianceScore: number;
    evidenceCount: number;
    auditCount: number;
    findingsCount: number;
    riskScore: number;
  };
  trends: Record<string, unknown>[];
  frameworks: Record<string, unknown>[];
  controls: Record<string, unknown>[];
  evidence: Record<string, unknown>[];
  audits: Record<string, unknown>[];
  findings: Record<string, unknown>[];
}

export class ExportService {
  static async generateDashboardExport(options: ExportOptions): Promise<ExportData> {
    const { organizationId, dateRange } = options;
    
    // Fetch organization data
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true }
    });

    // Fetch dashboard widgets
    const widgets = await prisma.dashboardWidget.findMany({
      where: { organizationId },
      include: { user: { select: { name: true } } }
    });

    // Fetch metrics data
    const metrics = await this.fetchMetricsData(organizationId, dateRange);

    // Fetch trends data
    const trends = await this.fetchTrendsData(organizationId, dateRange);

    // Fetch frameworks data
    const frameworks = await prisma.framework.findMany({
      where: { organizationId },
      include: { controls: true }
    });

    // Fetch controls data
    const controls = await prisma.control.findMany({
      where: { organizationId },
      include: { framework: true }
    });

    // Fetch evidence data
    const evidence = await prisma.evidence.findMany({
      where: { organizationId },
      include: { uploader: { select: { name: true } } }
    });

    // Fetch audits data
    const audits = await prisma.auditRun.findMany({
      where: { organizationId },
      include: { 
        framework: true,
        auditControls: true,
        auditFindings: true
      }
    });

    // Fetch findings data
    const findings = await prisma.auditFinding.findMany({
      where: { 
        auditRun: { organizationId }
      },
      include: { auditRun: { include: { framework: true } } }
    });

    return {
      dashboard: {
        name: 'Security Posture Dashboard',
        organization: organization?.name || 'Unknown Organization',
        exportedAt: new Date().toISOString(),
        widgets: widgets.map(w => ({
          type: w.widgetType,
          config: w.config,
          position: w.position,
          createdAt: w.createdAt
        }))
      },
      metrics,
      trends,
      frameworks: frameworks.map(f => ({
        name: f.name,
        type: f.type,
        description: f.description,
        controlsCount: f.controls.length,
        createdAt: f.createdAt
      })),
      controls: controls.map(c => ({
        name: c.name,
        description: c.description,
        status: c.status,
        framework: c.framework.name,
        createdAt: c.createdAt
      })),
      evidence: evidence.map(e => ({
        name: e.title,
        description: e.description,
        type: e.type,
        status: e.status,
        uploadedBy: e.uploader?.name || 'Unknown',
        createdAt: e.createdAt
      })),
      audits: audits.map(a => ({
        name: a.name,
        type: a.auditType,
        status: a.status,
        framework: a.framework?.name || 'No Framework',
        startDate: a.startDate,
        endDate: a.endDate,
        controlsCount: a.auditControls.length,
        findingsCount: a.auditFindings.length
      })),
      findings: findings.map(f => ({
        title: f.title,
        description: f.description,
        severity: f.severity,
        status: f.status,
        framework: f.auditRun.framework?.name || 'No Framework',
        auditRun: f.auditRun.name,
        createdAt: f.createdAt
      }))
    };
  }

  private static async fetchMetricsData(organizationId: string, dateRange?: { start: Date; end: Date }) {
    // Fetch latest metric snapshots
    const metrics = await prisma.metricSnapshot.findMany({
      where: {
        organizationId,
        ...(dateRange && {
          capturedAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        })
      },
      orderBy: { capturedAt: 'desc' },
      take: 1
    });

    // Calculate aggregated metrics
    const complianceScore = metrics.find(m => m.metricType === 'COMPLIANCE_SCORE')?.value || 0;
    const evidenceCount = await prisma.evidence.count({ where: { organizationId } });
    const auditCount = await prisma.auditRun.count({ where: { organizationId } });
    const findingsCount = await prisma.auditFinding.count({
      where: { auditRun: { organizationId } }
    });
    const riskScore = metrics.find(m => m.metricType === 'RISK_POSTURE')?.value || 0;

    return {
      complianceScore,
      evidenceCount,
      auditCount,
      findingsCount,
      riskScore
    };
  }

  private static async fetchTrendsData(organizationId: string, dateRange?: { start: Date; end: Date }) {
    const trends = await prisma.metricSnapshot.findMany({
      where: {
        organizationId,
        ...(dateRange && {
          capturedAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        })
      },
      orderBy: { capturedAt: 'asc' }
    });

    // Group by date and metric type
    const groupedTrends = trends.reduce((acc, metric) => {
      const date = metric.capturedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date };
      }
      acc[date][metric.metricType.toLowerCase()] = metric.value;
      return acc;
    }, {} as Record<string, Record<string, unknown>>);

    return Object.values(groupedTrends);
  }

  static async exportToCSV(data: ExportData): Promise<string> {
    const csvRows: string[] = [];
    
    // Dashboard summary
    csvRows.push('Dashboard Summary');
    csvRows.push(`Organization,${data.dashboard.organization}`);
    csvRows.push(`Exported At,${data.dashboard.exportedAt}`);
    csvRows.push(`Widgets Count,${data.dashboard.widgets.length}`);
    csvRows.push('');

    // Metrics
    csvRows.push('Metrics');
    csvRows.push('Metric,Value');
    csvRows.push(`Compliance Score,${data.metrics.complianceScore}`);
    csvRows.push(`Evidence Count,${data.metrics.evidenceCount}`);
    csvRows.push(`Audit Count,${data.metrics.auditCount}`);
    csvRows.push(`Findings Count,${data.metrics.findingsCount}`);
    csvRows.push(`Risk Score,${data.metrics.riskScore}`);
    csvRows.push('');

    // Frameworks
    csvRows.push('Frameworks');
    csvRows.push('Name,Type,Controls Count,Created At');
    data.frameworks.forEach(f => {
      csvRows.push(`${f.name},${f.type},${f.controlsCount},${f.createdAt}`);
    });
    csvRows.push('');

    // Controls
    csvRows.push('Controls');
    csvRows.push('Name,Framework,Status,Created At');
    data.controls.forEach(c => {
      csvRows.push(`${c.name},${c.framework},${c.status},${c.createdAt}`);
    });
    csvRows.push('');

    // Evidence
    csvRows.push('Evidence');
    csvRows.push('Name,Type,Status,Uploaded By,Created At');
    data.evidence.forEach(e => {
      csvRows.push(`${e.name},${e.type},${e.status},${e.uploadedBy},${e.createdAt}`);
    });
    csvRows.push('');

    // Audits
    csvRows.push('Audits');
    csvRows.push('Name,Framework,Status,Start Date,End Date,Controls Count,Findings Count');
    data.audits.forEach(a => {
      csvRows.push(`${a.name},${a.framework},${a.status},${a.startDate},${a.endDate},${a.controlsCount},${a.findingsCount}`);
    });
    csvRows.push('');

    // Findings
    csvRows.push('Findings');
    csvRows.push('Title,Severity,Status,Framework,Audit Run,Created At');
    data.findings.forEach(f => {
      csvRows.push(`${f.title},${f.severity},${f.status},${f.framework},${f.auditRun},${f.createdAt}`);
    });

    return csvRows.join('\n');
  }

  static async exportToJSON(data: ExportData): Promise<string> {
    return JSON.stringify(data, null, 2);
  }

  static async exportToExcel(data: ExportData): Promise<Buffer> {
    // This would require a library like 'exceljs' or 'xlsx'
    // For now, return CSV format as Excel-compatible
    const csv = await this.exportToCSV(data);
    return Buffer.from(csv, 'utf-8');
  }

  static async exportToPDF(data: ExportData): Promise<Buffer> {
    // This would require a library like 'puppeteer' or 'jsPDF'
    // For now, return JSON format
    const json = await this.exportToJSON(data);
    return Buffer.from(json, 'utf-8');
  }
}
