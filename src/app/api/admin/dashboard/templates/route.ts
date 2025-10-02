import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { DashboardRole } from '@prisma/client';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const role = searchParams.get('role') as DashboardRole | null;
    const includePublic = searchParams.get('includePublic') === 'true';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check permissions
    await requireAuditPermission(organizationId);

    // Build where clause
    const whereClause: Record<string, unknown> = {
      OR: [
        { organizationId },
        { isPublic: true }
      ]
    };

    if (role) {
      whereClause.role = role;
    }

    if (!includePublic) {
      whereClause.OR = [{ organizationId }];
    }

    // Get templates
    const templates = await prisma.dashboardTemplate.findMany({
      where: whereClause,
      orderBy: [
        { isDefault: 'desc' },
        { isPublic: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ templates });

  } catch (error) {
    console.error('Error fetching dashboard templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard templates' },
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

    const {
      organizationId,
      name,
      description,
      role,
      widgets,
      isPublic = false,
      isDefault = false
    } = await request.json();

    if (!organizationId || !name || !role || !widgets) {
      return NextResponse.json({
        error: 'Organization ID, name, role, and widgets are required'
      }, { status: 400 });
    }

    // Check permissions
    await requireAuditPermission(organizationId);

    // Validate widgets structure
    if (!Array.isArray(widgets)) {
      return NextResponse.json({
        error: 'Widgets must be an array'
      }, { status: 400 });
    }

    // If this is set as default, unset other defaults for this role
    if (isDefault) {
      await prisma.dashboardTemplate.updateMany({
        where: {
          organizationId,
          role,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Create template
    const template = await prisma.dashboardTemplate.create({
      data: {
        organizationId,
        name,
        description,
        role,
        widgets,
        isPublic,
        isDefault
      }
    });

    // Log dashboard event
    await prisma.dashboardEvent.create({
      data: {
        organizationId,
        eventType: 'USER_ACTION',
        eventData: {
          action: 'TEMPLATE_CREATED',
          templateId: template.id,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      template
    });

  } catch (error) {
    console.error('Error creating dashboard template:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard template' },
      { status: 500 }
    );
  }
}

// Create default templates for new organizations
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check permissions
    await requireAuditPermission(organizationId);

    // Check if templates already exist
    const existingTemplates = await prisma.dashboardTemplate.count({
      where: { organizationId }
    });

    if (existingTemplates > 0) {
      return NextResponse.json({
        success: true,
        message: 'Templates already exist for this organization'
      });
    }

    // Create default templates
    const defaultTemplates = [
      {
        name: 'Executive Dashboard',
        description: 'High-level compliance overview for executives',
        role: 'EXECUTIVE' as DashboardRole,
        widgets: [
          {
            type: 'COMPLIANCE_SCORE',
            position: { x: 0, y: 0, width: 6, height: 4 },
            size: 'LARGE',
            config: { showTrend: true, showBreakdown: true }
          },
          {
            type: 'FRAMEWORK_COVERAGE',
            position: { x: 6, y: 0, width: 6, height: 4 },
            size: 'LARGE',
            config: { showProgress: true }
          },
          {
            type: 'EVIDENCE_EXPIRATION_MONITOR',
            position: { x: 0, y: 4, width: 4, height: 3 },
            size: 'MEDIUM',
            config: { alertThreshold: 30 }
          },
          {
            type: 'AUDIT_READINESS_SCORECARD',
            position: { x: 4, y: 4, width: 4, height: 3 },
            size: 'MEDIUM',
            config: { showDetails: false }
          },
          {
            type: 'FINDINGS_MANAGEMENT_ANALYTICS',
            position: { x: 8, y: 4, width: 4, height: 3 },
            size: 'MEDIUM',
            config: { showSeverity: true }
          }
        ],
        isDefault: true
      },
      {
        name: 'Manager Dashboard',
        description: 'Operational metrics and team performance',
        role: 'MANAGER' as DashboardRole,
        widgets: [
          {
            type: 'TASK_MANAGEMENT_DASHBOARD',
            position: { x: 0, y: 0, width: 6, height: 4 },
            size: 'LARGE',
            config: { showAssignees: true, showSLA: true }
          },
          {
            type: 'WORKFLOW_EFFICIENCY_METRICS',
            position: { x: 6, y: 0, width: 6, height: 4 },
            size: 'LARGE',
            config: { showBottlenecks: true }
          },
          {
            type: 'EVIDENCE_APPROVAL_PIPELINE',
            position: { x: 0, y: 4, width: 6, height: 3 },
            size: 'MEDIUM',
            config: { showBacklog: true }
          },
          {
            type: 'CONTROL_STATUS_DISTRIBUTION',
            position: { x: 6, y: 4, width: 6, height: 3 },
            size: 'MEDIUM',
            config: { showDetails: true }
          }
        ],
        isDefault: true
      },
      {
        name: 'Analyst Dashboard',
        description: 'Detailed compliance analysis and evidence management',
        role: 'ANALYST' as DashboardRole,
        widgets: [
          {
            type: 'COMPLIANCE_HEATMAP',
            position: { x: 0, y: 0, width: 8, height: 4 },
            size: 'LARGE',
            config: { showControls: true, showFamilies: true }
          },
          {
            type: 'EVIDENCE_UTILIZATION_ANALYTICS',
            position: { x: 8, y: 0, width: 4, height: 4 },
            size: 'MEDIUM',
            config: { showReuse: true }
          },
          {
            type: 'CONTROL_STATUS_DISTRIBUTION',
            position: { x: 0, y: 4, width: 6, height: 3 },
            size: 'MEDIUM',
            config: { showDetails: true }
          },
          {
            type: 'TREND_ANALYSIS',
            position: { x: 6, y: 4, width: 6, height: 3 },
            size: 'MEDIUM',
            config: { timeframe: '30d' }
          }
        ],
        isDefault: true
      },
      {
        name: 'Auditor Dashboard',
        description: 'Audit preparation and findings management',
        role: 'AUDITOR' as DashboardRole,
        widgets: [
          {
            type: 'AUDIT_READINESS_SCORECARD',
            position: { x: 0, y: 0, width: 6, height: 4 },
            size: 'LARGE',
            config: { showDetails: true, showEvidence: true }
          },
          {
            type: 'AUDIT_HISTORY_TIMELINE',
            position: { x: 6, y: 0, width: 6, height: 4 },
            size: 'LARGE',
            config: { showSuccess: true }
          },
          {
            type: 'FINDINGS_MANAGEMENT_ANALYTICS',
            position: { x: 0, y: 4, width: 6, height: 3 },
            size: 'MEDIUM',
            config: { showSeverity: true, showOwners: true }
          },
          {
            type: 'EVIDENCE_EXPIRATION_MONITOR',
            position: { x: 6, y: 4, width: 6, height: 3 },
            size: 'MEDIUM',
            config: { alertThreshold: 60 }
          }
        ],
        isDefault: true
      }
    ];

    const createdTemplates = [];

    for (const templateData of defaultTemplates) {
      const template = await prisma.dashboardTemplate.create({
        data: {
          organizationId,
          name: templateData.name,
          description: templateData.description,
          role: templateData.role,
          widgets: templateData.widgets,
          isPublic: false,
          isDefault: templateData.isDefault
        }
      });
      createdTemplates.push(template);
    }

    return NextResponse.json({
      success: true,
      templates: createdTemplates,
      message: 'Default templates created successfully'
    });

  } catch (error) {
    console.error('Error creating default templates:', error);
    return NextResponse.json(
      { error: 'Failed to create default templates' },
      { status: 500 }
    );
  }
}
