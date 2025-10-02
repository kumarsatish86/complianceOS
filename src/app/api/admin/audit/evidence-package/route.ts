/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { requireEvidencePermission } from '@/lib/evidence-permissions';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

// GET /api/admin/audit/evidence-package - Generate audit evidence package
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const frameworkId = searchParams.get('frameworkId');
    const auditType = searchParams.get('auditType') || 'SOC2_TYPE_II';
    const includeExpired = searchParams.get('includeExpired') === 'true';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    await requireEvidencePermission(organizationId, 'audit', 'read');

    // Build evidence package
    const evidencePackage = await buildEvidencePackage(
      organizationId,
      frameworkId || undefined,
      auditType,
      includeExpired
    );

    return NextResponse.json({
      auditType,
      frameworkId,
      generatedAt: new Date().toISOString(),
      generatedBy: session.user.id,
      organizationId,
      package: evidencePackage,
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error generating evidence package:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function buildEvidencePackage(
  organizationId: string,
  frameworkId?: string,
  auditType?: string,
  includeExpired: boolean = false
) {
  // Get framework information
  const framework = frameworkId ? 
    await prisma.framework.findFirst({
      where: { id: frameworkId, organizationId },
    }) : 
    await prisma.framework.findFirst({
      where: { organizationId, type: auditType as "SOC2_TYPE_II" | "ISO_27001" | "PCI_DSS" | "GDPR" | "HIPAA" | "CUSTOM" },
    });

  if (!framework) {
    throw new Error('Framework not found');
  }

  // Build where clause for evidence
  const evidenceWhere: Record<string, unknown> = {
    organizationId,
    status: {
      in: ['APPROVED', 'LOCKED'],
    },
  };

  if (!includeExpired) {
    evidenceWhere.OR = [
      { expiryDate: null },
      { expiryDate: { gte: new Date() } },
    ];
  }

  // Get all controls for the framework
  const controls = await prisma.control.findMany({
    where: {
      organizationId,
      frameworkId: framework.id,
    },
    include: {
      evidenceLinks: {
        where: evidenceWhere,
        include: {
          evidence: {
            include: {
              uploader: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              tagLinks: {
                include: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
              },
              versions: {
                include: {
                  uploader: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: { version: 'desc' },
              },
            },
          },
        },
      },
      _count: {
        select: {
          evidenceLinks: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Organize evidence by control
  const controlEvidenceMap = new Map();
  const allEvidence = new Set();

  controls.forEach(control => {
    const evidenceList = control.evidenceLinks.map(link => ({
      id: link.evidence.id,
      title: link.evidence.title,
      description: link.evidence.description,
      type: link.evidence.type,
      status: link.evidence.status,
      uploadedAt: link.evidence.addedAt,
      expiryDate: link.evidence.expiryDate,
      uploader: link.evidence.uploader,
      hash: link.evidence.hash,
      version: link.evidence.version,
      metadata: link.evidence.metadata,
      tags: link.evidence.tagLinks.map(tl => tl.tag),
      versions: link.evidence.versions,
      effectivenessRating: link.effectivenessRating,
      linkNotes: link.notes,
    }));

    controlEvidenceMap.set(control.id, {
      control: {
        id: control.id,
        name: control.name,
        description: control.description,
        status: control.status,
        criticality: control.criticality,
        category: control.category,
      },
      evidence: evidenceList,
      evidenceCount: control._count.evidenceLinks,
    });

    evidenceList.forEach(evidence => allEvidence.add(evidence.id));
  });

  // Generate audit trail
  const auditTrail = await generateAuditTrail(organizationId, framework.id);

  // Calculate compliance metrics
  const complianceMetrics = calculateComplianceMetrics(controls);

  return {
    framework: {
      id: framework.id,
      name: framework.name,
      version: framework.version,
      type: framework.type,
      description: framework.description,
    },
    summary: {
      totalControls: controls.length,
      controlsWithEvidence: controls.filter(c => c._count.evidenceLinks > 0).length,
      totalEvidence: allEvidence.size,
      compliancePercentage: complianceMetrics.overallCompliance,
      statusBreakdown: complianceMetrics.statusBreakdown,
    },
    controls: Array.from(controlEvidenceMap.values()),
    auditTrail,
    generatedAt: new Date().toISOString(),
  };
}

async function generateAuditTrail(organizationId: string, frameworkId: string) {
  // Get recent changes to controls and evidence
  const recentChanges = await prisma.$queryRaw`
    SELECT 
      'control' as type,
      c.id,
      c.name,
      c.status,
      c.updated_at,
      u.name as updated_by
    FROM controls c
    LEFT JOIN users u ON c.updated_by = u.id
    WHERE c.organization_id = ${organizationId} 
      AND c.framework_id = ${frameworkId}
      AND c.updated_at >= NOW() - INTERVAL '90 days'
    
    UNION ALL
    
    SELECT 
      'evidence' as type,
      e.id,
      e.title as name,
      e.status,
      e.updated_at,
      u.name as updated_by
    FROM evidence e
    LEFT JOIN users u ON e.added_by = u.id
    WHERE e.organization_id = ${organizationId}
      AND e.updated_at >= NOW() - INTERVAL '90 days'
    
    ORDER BY updated_at DESC
    LIMIT 100
  `;

  return recentChanges;
}

function calculateComplianceMetrics(controls: Record<string, any>[]) {
  const totalControls = controls.length;
  const controlsWithEvidence = controls.filter(c => c._count.evidenceLinks > 0).length;
  
  const statusBreakdown = controls.reduce((acc, control) => {
    acc[control.status] = (acc[control.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const metControls = statusBreakdown.MET || 0;
  const partialControls = statusBreakdown.PARTIAL || 0;
  const overallCompliance = totalControls > 0 ? 
    ((metControls + (partialControls * 0.5)) / totalControls) * 100 : 0;

  return {
    totalControls,
    controlsWithEvidence,
    overallCompliance: Math.round(overallCompliance * 100) / 100,
    statusBreakdown,
  };
}
