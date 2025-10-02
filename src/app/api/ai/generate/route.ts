import { NextRequest, NextResponse } from 'next/server';
import { aiContentGenerator } from '@/lib/ai-content-generator';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentType, context, template, customInstructions, organizationId } = body;

    if (!contentType || !organizationId) {
      return NextResponse.json(
        { error: 'Content type and organization ID are required' },
        { status: 400 }
      );
    }

    const generationRequest = {
      organizationId,
      userId: session.user.id,
      contentType,
      context,
      template,
      customInstructions,
    };

    let generatedContent;

    switch (contentType) {
      case 'POLICY':
        generatedContent = await aiContentGenerator.generatePolicy(generationRequest);
        break;
      case 'EVIDENCE_DESCRIPTION':
        generatedContent = await aiContentGenerator.generateEvidenceDescription(generationRequest);
        break;
      case 'RISK_ASSESSMENT':
        generatedContent = await aiContentGenerator.generateRiskAssessment(generationRequest);
        break;
      case 'AUDIT_NARRATIVE':
        generatedContent = await aiContentGenerator.generateAuditNarrative(generationRequest);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported content type' },
          { status: 400 }
        );
    }

    return NextResponse.json(generatedContent);
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');

    if (!contentType) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      );
    }

    const templates = await aiContentGenerator.getTemplates(contentType);
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Template retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve templates' },
      { status: 500 }
    );
  }
}
