/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { AuditRunStatus, ExportFormat } from '@prisma/client';
import { createHash } from 'crypto';
import { Session } from 'next-auth';
// import { writeFileSync, mkdirSync } from 'fs';
// import { join } from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: auditRunId } = await params;
    const { format = 'PDF', scope = 'FULL' } = await request.json();

    // Get audit run with all related data
    const auditRun = await prisma.auditRun.findUnique({
      where: { id: auditRunId },
      include: {
        organization: true,
        framework: true,
        creator: true,
        auditControls: {
          include: {
            control: {
              include: {
                framework: true
              }
            },
            reviewer: true,
            approver: true,
            auditFindings: {
              include: {
                owner: true,
                resolutionEvidence: true
              }
            }
          }
        },
        auditEvidenceLinks: {
          include: {
            evidence: {
              include: {
                uploader: true,
                versions: {
                  orderBy: { version: 'desc' },
                  take: 1
                }
              }
            },
            control: true,
            linker: true
          }
        },
        auditFindings: {
          include: {
            control: true,
            auditControl: true,
            owner: true,
            resolutionEvidence: true
          }
        },
        auditActivities: {
          include: {
            performer: true
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!auditRun) {
      return NextResponse.json({ error: 'Audit run not found' }, { status: 404 });
    }

    // Check permissions
    await requireAuditPermission(auditRun.organizationId);

    // Generate audit pack based on format
    let exportData: unknown;
    let fileName: string;
    let mimeType: string;

    switch (format) {
      case ExportFormat.PDF:
        exportData = await generatePDFAuditPack(auditRun);
        fileName = `audit-pack-${auditRun.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
        mimeType = 'application/pdf';
        break;
      case ExportFormat.EXCEL:
        exportData = await generateExcelAuditPack(auditRun);
        fileName = `audit-pack-${auditRun.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case ExportFormat.JSON:
        exportData = await generateJSONAuditPack(auditRun, scope);
        fileName = `audit-pack-${auditRun.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      case ExportFormat.ZIP:
        exportData = await generateZIPAuditPack(auditRun);
        fileName = `audit-pack-${auditRun.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.zip`;
        mimeType = 'application/zip';
        break;
      default:
        return NextResponse.json({ error: 'Invalid export format' }, { status: 400 });
    }

    // Calculate checksum
    const checksum = createHash('sha256').update(JSON.stringify(exportData)).digest('hex');

    // Save export record
    const auditPackExport = await prisma.auditPackExport.create({
      data: {
        auditRunId: auditRun.id,
        fileId: fileName,
        format: format as ExportFormat,
        exportScope: scope,
        requestedBy: session.user.id,
        checksum,
        immutableFlag: auditRun.status === AuditRunStatus.LOCKED
      }
    });

    // Log activity
    await prisma.auditRunActivity.create({
      data: {
        auditRunId: auditRun.id,
        activityType: 'PACKAGE_EXPORTED',
        performedBy: session.user.id,
        targetEntity: 'audit_pack_export',
        newValue: JSON.stringify({
          format,
          scope,
          fileName,
          checksum
        })
      }
    });

    return NextResponse.json({
      success: true,
      exportId: auditPackExport.id,
      fileName,
      mimeType,
      checksum,
      downloadUrl: `/api/admin/audit-runs/${auditRunId}/export/${auditPackExport.id}/download`
    });

  } catch (error) {
    console.error('Error generating audit pack:', error);
    return NextResponse.json(
      { error: 'Failed to generate audit pack' },
      { status: 500 }
    );
  }
}

async function generatePDFAuditPack(auditRun: any) {
  // This would integrate with a PDF generation library like puppeteer or jsPDF
  // For now, return structured data that can be converted to PDF
  return {
    executiveSummary: generateExecutiveSummary(auditRun),
    controlMatrix: generateControlMatrix(auditRun),
    evidenceIndex: generateEvidenceIndex(auditRun),
    findingsReport: generateFindingsReport(auditRun),
    complianceDashboard: generateComplianceDashboard(auditRun),
    methodology: generateMethodology(auditRun)
  };
}

async function generateExcelAuditPack(auditRun: any) {
  // This would integrate with an Excel generation library like exceljs
  return {
    sheets: {
      'Executive Summary': generateExecutiveSummary(auditRun),
      'Control Matrix': generateControlMatrix(auditRun),
      'Evidence Index': generateEvidenceIndex(auditRun),
      'Findings Report': generateFindingsReport(auditRun),
      'Compliance Dashboard': generateComplianceDashboard(auditRun),
      'Raw Data': generateRawData(auditRun)
    }
  };
}

async function generateJSONAuditPack(auditRun: any, scope: string) {
  return {
    metadata: {
      auditRunId: auditRun.id,
      organization: auditRun.organization.name,
      framework: auditRun.framework?.name,
      status: auditRun.status,
      exportDate: new Date().toISOString(),
      exportScope: scope,
      version: '1.0'
    },
    auditRun: auditRun,
    summary: generateExecutiveSummary(auditRun),
    controls: generateControlMatrix(auditRun),
    evidence: generateEvidenceIndex(auditRun),
    findings: generateFindingsReport(auditRun),
    dashboard: generateComplianceDashboard(auditRun)
  };
}

async function generateZIPAuditPack(auditRun: any) {
  // This would create a ZIP file with multiple documents
  return {
    files: [
      { name: 'executive-summary.pdf', content: generateExecutiveSummary(auditRun) },
      { name: 'control-matrix.xlsx', content: generateControlMatrix(auditRun) },
      { name: 'evidence-index.pdf', content: generateEvidenceIndex(auditRun) },
      { name: 'findings-report.pdf', content: generateFindingsReport(auditRun) },
      { name: 'compliance-dashboard.pdf', content: generateComplianceDashboard(auditRun) },
      { name: 'raw-data.json', content: generateRawData(auditRun) }
    ]
  };
}

function generateExecutiveSummary(auditRun: any) {
  const totalControls = auditRun.auditControls.length;
  const compliantControls = auditRun.auditControls.filter((ac: any) => ac.status === 'COMPLIANT').length;
  const nonCompliantControls = auditRun.auditControls.filter((ac: any) => ac.status === 'NON_COMPLIANT').length;
  const gapControls = auditRun.auditControls.filter((ac: any) => ac.status === 'GAP').length;
  const totalFindings = auditRun.auditFindings.length;
  const openFindings = auditRun.auditFindings.filter((f: any) => f.status === 'OPEN').length;

  return {
    auditOverview: {
      name: auditRun.name,
      organization: auditRun.organization.name,
      framework: auditRun.framework?.name,
      scope: auditRun.scope,
      period: `${auditRun.startDate.toISOString().split('T')[0]} to ${auditRun.endDate.toISOString().split('T')[0]}`,
      status: auditRun.status
    },
    keyMetrics: {
      totalControls,
      compliantControls,
      nonCompliantControls,
      gapControls,
      complianceRate: totalControls > 0 ? (compliantControls / totalControls * 100).toFixed(1) : 0,
      totalFindings,
      openFindings,
      criticalFindings: auditRun.auditFindings.filter((f: any) => f.severity === 'CRITICAL').length,
      highFindings: auditRun.auditFindings.filter((f: any) => f.severity === 'HIGH').length
    },
    executiveSummary: `This audit covered ${totalControls} controls across the ${auditRun.framework?.name || 'selected framework'}. 
    The overall compliance rate is ${totalControls > 0 ? (compliantControls / totalControls * 100).toFixed(1) : 0}%. 
    ${totalFindings} findings were identified, with ${openFindings} still requiring remediation.`
  };
}

function generateControlMatrix(auditRun: any) {
  return auditRun.auditControls.map((ac: any) => ({
    controlId: ac.control.id,
    controlName: ac.control.name,
    description: ac.control.description,
    category: ac.control.category?.name,
    framework: ac.control.framework?.name,
    status: ac.status,
    reviewer: ac.reviewer?.name,
    approver: ac.approver?.name,
    submittedAt: ac.submittedAt,
    approvedAt: ac.approvedAt,
    notes: ac.notes,
    findings: ac.auditFindings.map((f: any) => ({
      id: f.id,
      severity: f.severity,
      title: f.title,
      status: f.status
    }))
  }));
}

function generateEvidenceIndex(auditRun: any) {
  return auditRun.auditEvidenceLinks.map((ael: any) => ({
    evidenceId: ael.evidence.id,
    evidenceName: ael.evidence.name,
    evidenceType: ael.evidence.type,
    controlId: ael.control.id,
    controlName: ael.control.name,
    linkedBy: ael.linker.name,
    linkedAt: ael.linkedAt,
    lockedFlag: ael.lockedFlag,
    versionLocked: ael.versionLocked,
    fileSize: ael.evidence.fileSize,
    uploadedBy: ael.evidence.uploadedBy.name,
    uploadedAt: ael.evidence.uploadedAt
  }));
}

function generateFindingsReport(auditRun: any) {
  return auditRun.auditFindings.map((f: any) => ({
    id: f.id,
    severity: f.severity,
    title: f.title,
    description: f.description,
    controlId: f.control?.id,
    controlName: f.control?.name,
    status: f.status,
    owner: f.owner?.name,
    dueDate: f.dueDate,
    remediationPlan: f.remediationPlan,
    resolutionEvidence: f.resolutionEvidence?.name,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt
  }));
}

function generateComplianceDashboard(auditRun: any) {
  const controlsByStatus = auditRun.auditControls.reduce((acc: any, ac: any) => {
    acc[ac.status] = (acc[ac.status] || 0) + 1;
    return acc;
  }, {});

  const findingsBySeverity = auditRun.auditFindings.reduce((acc: any, f: any) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {});

  const findingsByStatus = auditRun.auditFindings.reduce((acc: any, f: any) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {});

  return {
    controlsByStatus,
    findingsBySeverity,
    findingsByStatus,
    complianceRate: auditRun.auditControls.length > 0 ? 
      (auditRun.auditControls.filter((ac: any) => ac.status === 'COMPLIANT').length / auditRun.auditControls.length * 100).toFixed(1) : 0,
    riskLevel: calculateRiskLevel(findingsBySeverity),
    recommendations: generateRecommendations(auditRun)
  };
}

function generateMethodology(auditRun: any) {
  return {
    auditType: auditRun.auditType,
    framework: auditRun.framework?.name,
    scope: auditRun.scope,
    methodology: 'Risk-based audit methodology following industry best practices',
    sampling: 'Statistical sampling where applicable',
    testing: 'Combination of automated and manual testing procedures',
    documentation: 'Comprehensive documentation of all audit procedures and findings'
  };
}

function generateRawData(auditRun: any) {
  return {
    auditRun: auditRun,
    activities: auditRun.auditActivities,
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: auditRun.auditControls.length + auditRun.auditFindings.length + auditRun.auditEvidenceLinks.length
    }
  };
}

function calculateRiskLevel(findingsBySeverity: any) {
  const critical = findingsBySeverity.CRITICAL || 0;
  const high = findingsBySeverity.HIGH || 0;
  const medium = findingsBySeverity.MEDIUM || 0;
  // const low = findingsBySeverity.LOW || 0;

  if (critical > 0) return 'CRITICAL';
  if (high > 2) return 'HIGH';
  if (high > 0 || medium > 5) return 'MEDIUM';
  return 'LOW';
}

function generateRecommendations(auditRun: any) {
  const recommendations = [];
  
  const openFindings = auditRun.auditFindings.filter((f: any) => f.status === 'OPEN');
  if (openFindings.length > 0) {
    recommendations.push(`Address ${openFindings.length} open findings to improve compliance posture`);
  }

  const gapControls = auditRun.auditControls.filter((ac: any) => ac.status === 'GAP');
  if (gapControls.length > 0) {
    recommendations.push(`Implement controls for ${gapControls.length} identified gaps`);
  }

  const criticalFindings = auditRun.auditFindings.filter((f: any) => f.severity === 'CRITICAL');
  if (criticalFindings.length > 0) {
    recommendations.push(`Prioritize remediation of ${criticalFindings.length} critical findings`);
  }

  return recommendations;
}
