import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { requireEvidencePermission } from '@/lib/evidence-permissions';
import { taskAutomation } from '@/lib/task-automation';
import { Session } from 'next-auth';

// POST /api/admin/tasks/generate - Generate automated tasks
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, taskTypes } = body;

    if (!organizationId) {
      return NextResponse.json({
        error: 'Organization ID is required'
      }, { status: 400 });
    }

    // Check create permission
    await requireEvidencePermission(organizationId, 'tasks', 'create');

    // Generate specific task types or all if not specified
    if (!taskTypes || taskTypes.includes('EVIDENCE_RENEWAL')) {
      await taskAutomation.generateEvidenceRenewalTasks(organizationId);
    }

    if (!taskTypes || taskTypes.includes('CONTROL_REVIEW')) {
      await taskAutomation.generateControlReviewTasks(organizationId);
    }

    if (!taskTypes || taskTypes.includes('GAP_REMEDIATION')) {
      await taskAutomation.generateGapRemediationTasks(organizationId);
    }

    // Get counts of newly generated tasks
    const taskCounts = await taskAutomation.generateAllTasks(organizationId);

    return NextResponse.json({
      message: 'Automated tasks generated successfully',
      ___results: taskCounts,
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error generating automated tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
