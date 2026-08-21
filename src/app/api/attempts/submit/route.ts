import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { AttemptStatus, Json } from '@prisma/client';

// Snapshots recorded by the telemetry endpoint are the forensic source of
// truth. On submit we only append snapshots that are not already stored so a
// client cannot erase the existing record.
function mergeSnapshots(existing: unknown, incoming: unknown): Json[] {
  const existingList: Json[] = Array.isArray(existing) ? (existing as Json[]) : [];
  const incomingList: Json[] = Array.isArray(incoming) ? (incoming as Json[]).slice(-100) : [];

  const seen = new Set(
    existingList.map((snapshot) => `${(snapshot as Record<string, unknown>)?.snapshotIndex ?? ''}:${(snapshot as Record<string, unknown>)?.timestamp ?? ''}`),
  );

  const merged = [...existingList];
  for (const snapshot of incomingList) {
    const key = `${(snapshot as Record<string, unknown>)?.snapshotIndex ?? ''}:${(snapshot as Record<string, unknown>)?.timestamp ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(snapshot);
  }

  return merged.slice(-200);
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to submit an assessment.' }, { status: 401 });
    }

    const body = await request.json();
    const { attemptId, accessCode, answers, submittedFiles, codeSnapshots, reason } = body;

    if (answers !== undefined && (answers === null || typeof answers !== 'object' || Array.isArray(answers))) {
      return NextResponse.json({ error: 'answers must be an object keyed by question id' }, { status: 400 });
    }

    let targetAttemptId = attemptId ? String(attemptId) : null;

    // Fallback: If attemptId was not passed, locate the ongoing attempt by accessCode & user
    if (!targetAttemptId && accessCode && typeof accessCode === 'string') {
      const assessment = await prisma.assessment.findUnique({
        where: { accessCode: accessCode.toUpperCase().trim() },
      });
      if (assessment) {
        const found = await prisma.testAttempt.findUnique({
          where: {
            assessmentId_studentId: {
              assessmentId: assessment.id,
              studentId: user.id,
            },
          },
        });
        if (found) targetAttemptId = found.id;
      }
    }

    if (!targetAttemptId) {
      return NextResponse.json({ error: 'Valid attemptId or accessCode is required to submit' }, { status: 400 });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: targetAttemptId },
      include: {
        assessment: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Assessment attempt not found' }, { status: 404 });
    }

    // A student may only submit their own attempt.
    if (attempt.studentId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If already finalized, return current status
    if (attempt.status !== AttemptStatus.IN_PROGRESS && attempt.submittedAt) {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        attemptId: attempt.id,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        passed: attempt.passed,
        status: attempt.status,
      });
    }

    const validReasons = new Set(['NORMAL', 'TIMEOUT', 'VIOLATION']);
    const submitReason = typeof reason === 'string' && validReasons.has(reason) ? reason : undefined;

    const isPractical = attempt.assessment.examType === 'PRACTICAL';

    // Evaluate answers
    const studentAnswers = answers || (attempt.answers as Record<string, string>) || {};
    let earnedMarks = 0;
    let possibleMarks = 0;

    for (const q of attempt.assessment.questions) {
      const qMarks = q.marks;
      possibleMarks += qMarks;

      if (!isPractical) {
        const selectedOpt = studentAnswers[q.id];
        if (selectedOpt !== undefined && selectedOpt !== null && selectedOpt !== '') {
          if (selectedOpt === q.correctOptionId) {
            earnedMarks += qMarks;
          } else {
            earnedMarks -= (q.negativeMarks || 0);
          }
        }
      }
    }

    // Ensure score does not go below zero
    earnedMarks = Math.max(0, earnedMarks);
    const percentage = possibleMarks > 0 ? Math.round((earnedMarks / possibleMarks) * 100 * 10) / 10 : 0;
    const passed = isPractical ? false : (percentage >= attempt.assessment.passingPercentage);

    // Server-side deadline: a client-side timer can be disabled, so the
    // backend enforces the assessment duration as well.
    const durationSeconds = attempt.assessment.durationMinutes * 60;
    const startedAtMs = new Date(attempt.startedAt).getTime();
    const deadlinePassed = Number.isFinite(startedAtMs) && Date.now() > startedAtMs + (durationSeconds + 15) * 1000;

    let finalStatus: AttemptStatus = AttemptStatus.SUBMITTED;
    if (submitReason === 'VIOLATION' || attempt.violationCount >= attempt.assessment.maxViolationsAllowed) {
      finalStatus = AttemptStatus.TERMINATED_FOR_VIOLATION;
    } else if (deadlinePassed || submitReason === 'TIMEOUT') {
      finalStatus = AttemptStatus.TIMED_OUT;
    }

    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: targetAttemptId },
      data: {
        answers: studentAnswers,
        submittedFiles: submittedFiles !== undefined ? submittedFiles : attempt.submittedFiles,
        // Forensic telemetry is written by the authenticated telemetry endpoint.
        // Merge (never replace) so the stored record cannot be wiped here.
        codeSnapshots: mergeSnapshots(attempt.codeSnapshots, codeSnapshots),
        score: earnedMarks,
        totalMarks: possibleMarks,
        percentage: percentage,
        passed: passed,
        status: finalStatus,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: updatedAttempt.id,
      score: earnedMarks,
      totalMarks: possibleMarks,
      percentage: percentage,
      passed: passed,
      status: finalStatus,
    });
  } catch (error) {
    console.error('Error submitting attempt:', error);
    return NextResponse.json({ error: 'Failed to finalize assessment submission' }, { status: 500 });
  }
}
