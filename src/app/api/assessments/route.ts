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

function sanitizeResults<T extends { showResultImmediately: boolean; attempts?: unknown }>(assessments: T[]) {
  return assessments.map((assessment) => {
    if (!Array.isArray(assessment.attempts) || assessment.showResultImmediately) {
      return assessment;
    }

    return {
      ...assessment,
      attempts: assessment.attempts.map((attempt) => ({
        ...(attempt as Record<string, unknown>),
        score: 0,
        percentage: 0,
        passed: false,
      })),
    };
  });
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');

    // If teacher scope requested or authenticated teacher viewing dashboard
    if (scope === 'teacher' || (user && user.role === 'TEACHER' && scope !== 'student' && scope !== 'explore')) {
      if (!user || user.role !== 'TEACHER') {
        return NextResponse.json({ error: 'Unauthorized. Teacher privileges required.' }, { status: 401 });
      }

      const assessments = await prisma.assessment.findMany({
        where: { teacherId: user.id },
        include: {
          questions: {
            select: { id: true, marks: true, questionType: true },
          },
          attempts: {
            select: {
              id: true,
              status: true,
              score: true,
              totalMarks: true,
              percentage: true,
              passed: true,
              violationCount: true,
              student: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ assessments });
    }

    // Default: Return published assessments to signed-in students.
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const assessments = await prisma.assessment.findMany({
      where: { isPublished: true },
      include: {
        teacher: {
          select: { name: true },
        },
        questions: {
          select: { id: true },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
        attempts: user ? {
          where: { studentId: user.id },
          select: {
            id: true,
            status: true,
            score: true,
            totalMarks: true,
            percentage: true,
            passed: true,
            violationCount: true,
            submittedAt: true,
          },
        } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ assessments: sanitizeResults(assessments) });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized. Teacher privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      accessCode,
      examType = 'PRACTICAL',
      labName = 'Systems & Web Technologies Lab',
      batchName = 'Batch A1',
      subjectCode = 'CS301',
      allowedResources = [],
      durationMinutes,
      perQuestionTimer,
      secondsPerQuestion,
      passingPercentage,
      showResultImmediately,
      maxViolationsAllowed,
      requireCamera,
      requireMicrophone,
      requireFullscreen,
      shuffleQuestions,
      questions,
    } = body;

    if (!title || !accessCode || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Title, unique access code, and at least 1 question/task are required.' }, { status: 400 });
    }

    if (questions.length > 200) {
      return NextResponse.json({ error: 'An assessment can contain at most 200 questions/tasks.' }, { status: 400 });
    }

    const cleanTitle = String(title).trim();
    if (cleanTitle.length < 3 || cleanTitle.length > 200) {
      return NextResponse.json({ error: 'Title must be between 3 and 200 characters.' }, { status: 400 });
    }

    const cleanCode = String(accessCode).toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode.length < 3 || cleanCode.length > 32) {
      return NextResponse.json({ error: 'Access code must be between 3 and 32 characters (A-Z, 0-9, _ or -).' }, { status: 400 });
    }

    const safeAllowedResources = sanitizeAllowedResources(allowedResources);
    if (safeAllowedResources === null) {
      return NextResponse.json(
        { error: 'allowedResources must be an array of up to 50 objects with an http(s) URL and a title.' },
        { status: 400 }
      );
    }

    for (const question of questions) {
      if (typeof question?.questionText !== 'string' || !question.questionText.trim()) {
        return NextResponse.json({ error: 'Every question/task needs non-empty text.' }, { status: 400 });
      }
    }

    const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
    };

    // Check if access code already exists
    const existingCode = await prisma.assessment.findUnique({
      where: { accessCode: cleanCode },
    });
    if (existingCode) {
      return NextResponse.json({ error: `Access code "${cleanCode}" is already in use. Please choose another.` }, { status: 400 });
    }

    // Calculate total marks from questions
    let calculatedTotalMarks = 0;
    const formattedQuestions = questions.map((q: IncomingQuestion, idx: number) => {
      const qMarks = clampNumber(q.marks, 1, 1000, examType === 'PRACTICAL' ? 25 : 1);
      calculatedTotalMarks += qMarks;
      return {
        orderIndex: idx,
        questionText: String(q.questionText).trim().slice(0, 10000),
        marks: qMarks,
        negativeMarks: Math.min(1000, Math.max(0, Number(q.negativeMarks) || 0)),
        questionType:
          typeof q.questionType === 'string' && q.questionType
            ? q.questionType.slice(0, 40)
            : examType === 'PRACTICAL'
              ? 'PRACTICAL_WEB'
              : 'MCQ',
        starterFiles: sanitizeJsonArray(q.starterFiles, 50),
        testCases: sanitizeJsonArray(q.testCases, 100),
        rubric: sanitizeJsonArray(q.rubric, 50),
        options: sanitizeJsonArray(q.options, 10),
        correctOptionId: typeof q.correctOptionId === 'string' && q.correctOptionId ? q.correctOptionId.slice(0, 10) : 'A',
        explanation: typeof q.explanation === 'string' ? q.explanation.slice(0, 5000) : '',
      };
    });

    const newAssessment = await prisma.assessment.create({
      data: {
        title: cleanTitle,
        description: description ? String(description).trim().slice(0, 5000) : '',
        accessCode: cleanCode,
        teacherId: user.id,
        examType: examType === 'MCQ' ? 'MCQ' : examType === 'HYBRID' ? 'HYBRID' : 'PRACTICAL',
        labName: labName ? String(labName).trim().slice(0, 120) : 'Systems & Web Technologies Lab',
        batchName: batchName ? String(batchName).trim().slice(0, 120) : 'Batch A1',
        subjectCode: subjectCode ? String(subjectCode).trim().slice(0, 40) : 'CS301',
        allowedResources: safeAllowedResources,
        durationMinutes: clampNumber(durationMinutes, 1, 600, examType === 'PRACTICAL' ? 60 : 30),
        perQuestionTimer: Boolean(perQuestionTimer),
        secondsPerQuestion: clampNumber(secondsPerQuestion, 10, 3600, 60),
        totalMarks: calculatedTotalMarks,
        passingPercentage: clampNumber(passingPercentage, 1, 100, examType === 'PRACTICAL' ? 40 : 50),
        showResultImmediately: showResultImmediately === true,
        maxViolationsAllowed: clampNumber(maxViolationsAllowed, 1, 20, 3),
        requireCamera: requireCamera !== false,
        requireMicrophone: requireMicrophone !== false,
        requireFullscreen: requireFullscreen !== false,
        shuffleQuestions: Boolean(shuffleQuestions),
        isPublished: true,
        questions: {
          create: formattedQuestions,
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json({ success: true, assessment: newAssessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'That access code was just taken. Please choose another.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}
