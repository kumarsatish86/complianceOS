import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { FindingSeverity, FindingStatus } from '@prisma/client';
import { Session } from 'next-auth';

// GET /api/admin/audit-findings - List audit findings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const auditRunId = searchParams.get('auditRunId');
    const severity = searchParams.get('severity') as FindingSeverity | null;
    const status = searchParams.get('status') as FindingStatus | null;
    const ownerId = searchParams.get('ownerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    await requireAuditPermission(organizationId);

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {
      auditRun: {
        organizationId,
      },
    };

    if (auditRunId) {
      where.auditRunId = auditRunId;
    }

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    const [findings, total] = await Promise.all([
      prisma.auditFinding.findMany({
        where,
        skip,
        take: limit,
        include: {
          auditRun: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          control: {
            select: {
              id: true,
              name: true,
              criticality: true,
              framework: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
          auditControl: {
            select: {
              id: true,
              status: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          resolutionEvidence: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.auditFinding.count({ where }),
    ]);

    return NextResponse.json({
      findings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching audit findings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/audit-findings - Create audit finding
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      auditRunId,
      controlId,
      auditControlId,
      severity,
      title,
      description,
      remediationPlan,
      ownerId,
      dueDate,
    } = body;

    if (!organizationId || !auditRunId || !severity || !title || !description) {
      return NextResponse.json({
        error: 'Organization ID, audit run ID, severity, title, and description are required'
      }, { status: 400 });
    }

    // Check create permission
    await requireAuditPermission(organizationId);

    // Verify audit run exists and is not locked
    const auditRun = await prisma.auditRun.findFirst({
      where: {
        id: auditRunId,
        organizationId,
      },
    });

    if (!auditRun) {
      return NextResponse.json({ error: 'Audit run not found' }, { status: 404 });
    }

    if (auditRun.status === 'LOCKED') {
      return NextResponse.json({ error: 'Cannot modify locked audit run' }, { status: 400 });
    }

    // Create audit finding
    const finding = await prisma.auditFinding.create({
      data: {
        auditRunId,
        controlId,
        auditControlId,
        severity,
        title,
        description,
        remediationPlan,
        ownerId,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'OPEN',
      },
      include: {
        auditRun: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        control: {
          select: {
            id: true,
            name: true,
            criticality: true,
            framework: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create remediation task if owner is assigned
    if (ownerId) {
      await prisma.task.create({
        data: {
          organizationId,
          type: 'GAP_REMEDIATION',
          controlId,
          auditRunId,
          auditPhase: 'REMEDIATION',
          assigneeId: ownerId,
          status: 'OPEN',
          priority: severity === 'CRITICAL' ? 'HIGH' : severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
          comments: `Remediate finding: ${title}`,
          createdBy: session.user.id,
        },
      });
    }

    // Log activity
    await prisma.auditRunActivity.create({
      data: {
        auditRunId,
        activityType: 'FINDING_CREATED',
        performedBy: session.user.id,
        targetEntity: 'audit_finding',
        newValue: JSON.stringify({ 
          id: finding.id, 
          title, 
          severity, 
          status: 'OPEN' 
        }),
      },
    });

    return NextResponse.json({
      finding,
      message: 'Audit finding created successfully',
    }, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating audit finding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
