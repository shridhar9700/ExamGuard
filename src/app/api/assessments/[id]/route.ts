import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sanitizeAllowedResources, sanitizeJsonArray } from '@/lib/assessmentInput';

export const dynamic = 'force-dynamic';

interface IncomingQuestion {
  questionText?: unknown;
  marks?: unknown;
  negativeMarks?: unknown;
  questionType?: unknown;
  starterFiles?: unknown;
  testCases?: unknown;
  rubric?: unknown;
  options?: unknown;
  correctOptionId?: unknown;
  explanation?: unknown;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized. Teacher session required.' }, { status: 403 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        attempts: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Only the teacher who owns the assessment may see its full question bank,
    // correct answers and student attempt records.
    if (assessment.teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Error fetching assessment by ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized. Teacher session required.' }, { status: 403 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Ensure only the owner teacher can update
    if (assessment.teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied. You can only modify assessments you created.' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (title.length < 3 || title.length > 200) {
        return NextResponse.json({ error: 'Title must be between 3 and 200 characters.' }, { status: 400 });
      }
      updateData.title = title;
    }
    if (body.description !== undefined) updateData.description = String(body.description).trim().slice(0, 5000);
    if (body.examType !== undefined) updateData.examType = body.examType === 'MCQ' ? 'MCQ' : body.examType === 'HYBRID' ? 'HYBRID' : 'PRACTICAL';
    if (body.labName !== undefined) updateData.labName = String(body.labName).trim().slice(0, 120);
    if (body.batchName !== undefined) updateData.batchName = String(body.batchName).trim().slice(0, 120);
    if (body.subjectCode !== undefined) updateData.subjectCode = String(body.subjectCode).trim().slice(0, 40);
    if (body.allowedResources !== undefined) {
      const resources = sanitizeAllowedResources(body.allowedResources);
      if (resources === null) {
        return NextResponse.json(
          { error: 'allowedResources must be an array of up to 50 objects with an http(s) URL and a title.' },
          { status: 400 }
        );
      }
      updateData.allowedResources = resources;
    }
    if (body.durationMinutes !== undefined) {
      const duration = Number(body.durationMinutes);
      if (!Number.isFinite(duration)) {
        return NextResponse.json({ error: 'Duration must be a number.' }, { status: 400 });
      }
      updateData.durationMinutes = Math.min(600, Math.max(1, Math.round(duration)));
    }
    if (body.perQuestionTimer !== undefined) updateData.perQuestionTimer = Boolean(body.perQuestionTimer);
    if (body.secondsPerQuestion !== undefined) {
      const seconds = Number(body.secondsPerQuestion);
      if (!Number.isFinite(seconds)) {
        return NextResponse.json({ error: 'Seconds per question must be a number.' }, { status: 400 });
      }
      updateData.secondsPerQuestion = Math.min(3600, Math.max(10, Math.round(seconds)));
    }
    if (body.passingPercentage !== undefined) {
      const percentage = Number(body.passingPercentage);
      if (!Number.isFinite(percentage)) {
        return NextResponse.json({ error: 'Passing percentage must be a number.' }, { status: 400 });
      }
      updateData.passingPercentage = Math.min(100, Math.max(1, Math.round(percentage)));
    }
    if (body.showResultImmediately !== undefined) updateData.showResultImmediately = Boolean(body.showResultImmediately);
    if (body.maxViolationsAllowed !== undefined) {
      const maxViolations = Number(body.maxViolationsAllowed);
      if (!Number.isFinite(maxViolations)) {
        return NextResponse.json({ error: 'Maximum violations must be a number.' }, { status: 400 });
      }
      updateData.maxViolationsAllowed = Math.min(20, Math.max(1, Math.round(maxViolations)));
    }
    if (body.requireCamera !== undefined) updateData.requireCamera = Boolean(body.requireCamera);
    if (body.requireMicrophone !== undefined) updateData.requireMicrophone = Boolean(body.requireMicrophone);
    if (body.requireFullscreen !== undefined) updateData.requireFullscreen = Boolean(body.requireFullscreen);
    if (body.shuffleQuestions !== undefined) updateData.shuffleQuestions = Boolean(body.shuffleQuestions);
    if (body.isPublished !== undefined) updateData.isPublished = Boolean(body.isPublished);

    // Validate accessCode if changing
    if (body.accessCode !== undefined) {
      const cleanCode = String(body.accessCode).toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
      if (cleanCode.length < 3 || cleanCode.length > 32) {
        return NextResponse.json({ error: 'Access code must be between 3 and 32 characters (A-Z, 0-9, _ or -).' }, { status: 400 });
      }

      const existingCode = await prisma.assessment.findFirst({
        where: {
          accessCode: cleanCode,
          NOT: { id },
        },
      });

      if (existingCode) {
        return NextResponse.json({ error: `Access code "${cleanCode}" is already in use by another assessment.` }, { status: 400 });
      }
      updateData.accessCode = cleanCode;
    }

    // Handle full questions update if provided
    if (body.questions && Array.isArray(body.questions)) {
      if (body.questions.length === 0) {
        return NextResponse.json({ error: 'Assessment must contain at least one question.' }, { status: 400 });
      }

      if (body.questions.length > 200) {
        return NextResponse.json({ error: 'An assessment can contain at most 200 questions/tasks.' }, { status: 400 });
      }

      // Attempts store answers keyed by question id. Recreating questions would
      // silently invalidate every existing attempt, so refuse the edit instead.
      const attemptCount = await prisma.testAttempt.count({ where: { assessmentId: id } });
      if (attemptCount > 0) {
        return NextResponse.json(
          { error: 'Questions cannot be changed after students have started this assessment.' },
          { status: 409 }
        );
      }

      for (const question of body.questions) {
        if (typeof question?.questionText !== 'string' || !question.questionText.trim()) {
          return NextResponse.json({ error: 'Every question needs non-empty text.' }, { status: 400 });
        }
      }

      let calculatedTotalMarks = 0;
      const formattedQuestions = (body.questions as IncomingQuestion[]).map((q, idx) => {
        const qMarks = Math.min(1000, Math.max(1, Number(q.marks) || 1));
        calculatedTotalMarks += qMarks;
        return {
          assessmentId: id,
          orderIndex: idx,
          questionText: String(q.questionText || '').trim().slice(0, 10000),
          marks: qMarks,
          negativeMarks: Math.min(1000, Math.max(0, Number(q.negativeMarks) || 0)),
          questionType:
            typeof q.questionType === 'string' && q.questionType ? q.questionType.slice(0, 40) : 'PRACTICAL_WEB',
          starterFiles: sanitizeJsonArray(q.starterFiles, 50),
          testCases: sanitizeJsonArray(q.testCases, 100),
          rubric: sanitizeJsonArray(q.rubric, 50),
          options: sanitizeJsonArray(q.options, 10),
          correctOptionId: typeof q.correctOptionId === 'string' && q.correctOptionId ? q.correctOptionId.slice(0, 10) : 'A',
          explanation: typeof q.explanation === 'string' ? q.explanation.slice(0, 5000) : '',
        };
      });

      updateData.totalMarks = calculatedTotalMarks;

      const result = await prisma.$transaction(async (tx) => {
        // Delete old questions
        await tx.question.deleteMany({
          where: { assessmentId: id },
        });

        // Insert updated questions
        await tx.question.createMany({
          data: formattedQuestions,
        });

        // Update assessment metadata
        return await tx.assessment.update({
          where: { id },
          data: updateData,
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        });
      });

      return NextResponse.json({ success: true, assessment: result });
    }

    // Otherwise, simple scalar update
    const updated = await prisma.assessment.update({
      where: { id },
      data: updateData,
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return NextResponse.json({ success: true, assessment: updated });
  } catch (error) {
    console.error('Error updating assessment:', error);
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'That access code is already in use.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized. Teacher session required.' }, { status: 403 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (assessment.teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied. You can only delete assessments you created.' }, { status: 403 });
    }

    // Student attempts hold official scores and forensic evidence. Refuse to
    // destroy them; the examiner can unpublish the assessment instead.
    const attemptCount = await prisma.testAttempt.count({ where: { assessmentId: id } });
    if (attemptCount > 0) {
      return NextResponse.json(
        {
          error:
            'This assessment already has student attempts, so it cannot be deleted. Set it to Draft to stop new attempts while keeping the records.',
        },
        { status: 409 }
      );
    }

    // Atomically delete associated questions and the assessment
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { assessmentId: id } }),
      prisma.assessment.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, message: 'Assessment and question bank deleted successfully.' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 });
  }
}
