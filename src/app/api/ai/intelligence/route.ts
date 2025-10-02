import { NextRequest, NextResponse } from 'next/server';
import { aiProactiveIntelligence } from '@/lib/ai-proactive-intelligence';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type'); // 'gaps', 'recommendations', 'audit-readiness'

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'gaps':
        result = await aiProactiveIntelligence.analyzeComplianceGaps(organizationId);
        break;
      case 'recommendations':
        result = await aiProactiveIntelligence.generateOptimizationRecommendations(organizationId);
        break;
      case 'audit-readiness':
        const frameworkId = searchParams.get('frameworkId');
        result = await aiProactiveIntelligence.generateAuditReadinessAssessment(organizationId, frameworkId || undefined);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: gaps, recommendations, or audit-readiness' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Proactive intelligence error:', error);
    return NextResponse.json(
      { error: 'Failed to generate proactive intelligence' },
      { status: 500 }
    );
  }
}
