import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        assessment: {
          include: {
            teacher: {
              select: { id: true, name: true, email: true },
            },
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Permission check: only the student who took it OR the teacher who owns the assessment can view
    const isOwnerStudent = attempt.studentId === user.id;
    const isOwnerTeacher = attempt.assessment.teacherId === user.id;

    if (!isOwnerStudent && !isOwnerTeacher) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Students must not be able to read the answer key while the exam is live.
    if (isOwnerStudent && !isOwnerTeacher && attempt.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'This attempt is still in progress. Submit it before viewing results.' },
        { status: 409 }
      );
    }

    // Teachers always see full scoring. Students only see the answer key and
    // score when the assessment is configured for immediate result release.
    const canRevealResults = isOwnerTeacher || attempt.assessment.showResultImmediately;
    if (canRevealResults) {
      return NextResponse.json({ attempt });
    }

    const attemptWithoutAnswers = {
      ...attempt,
      score: 0,
      percentage: 0,
      passed: false,
      assessment: {
        ...attempt.assessment,
        questions: attempt.assessment.questions.map((question) => ({
          ...question,
          correctOptionId: null,
          explanation: null,
        })),
      },
    };

    return NextResponse.json({ attempt: attemptWithoutAnswers });
  } catch (error) {
    console.error('Error fetching attempt result:', error);
    return NextResponse.json({ error: 'Failed to retrieve assessment results' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized examiner' }, { status: 401 });
    }

    const { score, totalMarks, percentage, passed, teacherFeedback, isVerifiedByTeacher } =
      await request.json();

    const attempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: { assessment: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.assessment.teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied: not the examiner of this assessment' }, { status: 403 });
    }

    if (attempt.status === 'IN_PROGRESS') {
      return NextResponse.json({ error: 'This attempt is still in progress and cannot be evaluated yet.' }, { status: 409 });
    }

    const scoreCeiling =
      typeof totalMarks === 'number' && Number.isFinite(totalMarks) && totalMarks > 0
        ? totalMarks
        : attempt.totalMarks > 0
          ? attempt.totalMarks
          : Number.POSITIVE_INFINITY;

    const safeScore =
      typeof score === 'number' && Number.isFinite(score)
        ? Math.min(Math.max(0, score), scoreCeiling)
        : attempt.score;
    const safeTotalMarks =
      typeof totalMarks === 'number' && Number.isFinite(totalMarks) && totalMarks > 0
        ? totalMarks
        : attempt.totalMarks;
    const safePercentage =
      typeof percentage === 'number' && Number.isFinite(percentage)
        ? Math.min(100, Math.max(0, percentage))
        : safeTotalMarks > 0
          ? Math.round((safeScore / safeTotalMarks) * 1000) / 10
          : attempt.percentage;

    const updated = await prisma.testAttempt.update({
      where: { id },
      data: {
        score: safeScore,
        totalMarks: safeTotalMarks,
        percentage: safePercentage,
        passed:
          typeof passed === 'boolean'
            ? passed
            : safePercentage >= attempt.assessment.passingPercentage,
        teacherFeedback:
          typeof teacherFeedback === 'string' ? teacherFeedback.slice(0, 5000) : attempt.teacherFeedback,
        isVerifiedByTeacher:
          typeof isVerifiedByTeacher === 'boolean' ? isVerifiedByTeacher : attempt.isVerifiedByTeacher,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, attempt: updated });
  } catch (error) {
    console.error('Error updating evaluation:', error);
    return NextResponse.json({ error: 'Failed to save evaluation marks' }, { status: 500 });
  }
}

