import { NextResponse } from 'next/server';
import { CS_QUESTION_BANK, CS_SUBJECTS, filterQuestionBank, autoGenerateQuestions } from '@/lib/questionBank';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized. Teacher privileges required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || 'ALL';
    const difficulty = searchParams.get('difficulty') || 'ALL';
    const search = searchParams.get('search') || '';
    const count = parseInt(searchParams.get('count') || '0', 10);
    const mode = searchParams.get('mode') || 'filter'; // 'filter' | 'generate'

    if (mode === 'generate') {
      const generated = autoGenerateQuestions({
        subject,
        difficulty,
        count: count > 0 ? count : 5,
      });
      return NextResponse.json({ questions: generated, total: generated.length });
    }

    const questions = filterQuestionBank({
      subject,
      difficulty,
      search,
      count: count > 0 ? count : undefined,
    });

    return NextResponse.json({
      subjects: CS_SUBJECTS,
      totalBankSize: CS_QUESTION_BANK.length,
      questions,
      total: questions.length,
    });
  } catch (error) {
    console.error('Error in question bank API:', error);
    return NextResponse.json({ error: 'Failed to retrieve question bank items' }, { status: 500 });
  }
}
