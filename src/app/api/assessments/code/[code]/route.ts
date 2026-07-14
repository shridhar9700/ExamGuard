import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to open an assessment.', requiresAuth: true },
        { status: 401 }
      );
    }

    const { code } = await params;
    const cleanCode = code.toUpperCase().trim();

    const assessment = await prisma.assessment.findUnique({
      where: { accessCode: cleanCode },
      include: {
        teacher: {
          select: { id: true, name: true },
        },
        questions: {
          select: {
            id: true,
            orderIndex: true,
            questionText: true,
            marks: true,
            negativeMarks: true,
            options: true,
            questionType: true,
            starterFiles: true,
            testCases: true,
            rubric: true,
            // DO NOT select correctOptionId or explanation for student exam delivery
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: `No assessment found for code "${cleanCode}".` }, { status: 404 });
    }

    // Students only see published assessments. Teachers may preview their own.
    const isOwnerTeacher = user.role === 'TEACHER' && assessment.teacher.id === user.id;
    if (!assessment.isPublished && !isOwnerTeacher) {
      return NextResponse.json({ error: 'This assessment is currently unpublished by the examiner.' }, { status: 403 });
    }

    // Only return the fields the checkroom/exam room need from an existing
    // attempt. Score, answers and forensic telemetry are served by
    // /api/attempts/[id] under the result-release rules.
    let existingAttempt: { id: string; status: string } | null = null;
    const foundAttempt = await prisma.testAttempt.findUnique({
      where: {
        assessmentId_studentId: {
          assessmentId: assessment.id,
          studentId: user.id,
        },
      },
      select: { id: true, status: true },
    });
    if (foundAttempt) {
      existingAttempt = foundAttempt;
    }

    // If test specifies shuffleQuestions, shuffle order
    let deliveredQuestions = assessment.questions;
    if (assessment.shuffleQuestions) {
      deliveredQuestions = [...assessment.questions].sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({
      assessment: {
        ...assessment,
        questions: deliveredQuestions,
      },
      existingAttempt,
    });
  } catch (error) {
    console.error('Error fetching assessment by code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
