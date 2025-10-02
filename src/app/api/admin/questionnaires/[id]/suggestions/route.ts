import { NextRequest, NextResponse } from 'next/server';
import { AISuggestionEngine } from '@/lib/ai-suggestion-engine';
import { QuestionnaireService } from '@/lib/questionnaire-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: questionnaireId } = await params;
    // Validate questionnaire exists and user has access
    const questionnaire = await QuestionnaireService.getQuestionnaireById(questionnaireId);
    if (!questionnaire) {
      return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const organizationId = 'org-123'; // Replace with actual org ID

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    const suggestions = await AISuggestionEngine.generateSuggestions(
      questionId,
      organizationId
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
