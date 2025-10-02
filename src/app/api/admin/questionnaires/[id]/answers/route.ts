import { NextRequest, NextResponse } from 'next/server';
import { QuestionnaireService } from '@/lib/questionnaire-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function POST(
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

    const body = await request.json();
    const { questionId, answerText, evidenceIds, sourceLibraryId, confidenceScore } = body;

    const answerId = await QuestionnaireService.saveAnswer(
      questionId,
      answerText,
      evidenceIds || [],
      session.user.id,
      sourceLibraryId,
      confidenceScore
    );

    return NextResponse.json({ 
      answerId,
      message: 'Answer saved successfully' 
    });
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const { action, answerId, ...data } = body;

    switch (action) {
      case 'submit':
        await QuestionnaireService.submitAnswer(
          answerId,
          session.user.id,
          data.reviewerId
        );
        break;
      
      case 'review':
        await QuestionnaireService.reviewAnswer(
          answerId,
          session.user.id,
          data.decision,
          data.reviewNotes,
          data.finalText
        );
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ message: 'Answer updated successfully' });
  } catch (error) {
    console.error('Error updating answer:', error);
    return NextResponse.json(
      { error: 'Failed to update answer' },
      { status: 500 }
    );
  }
}
