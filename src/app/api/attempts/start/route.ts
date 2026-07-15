import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { AttemptStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to attend this assessment.', requiresAuth: true },
        { status: 401 }
      );
    }

    if (user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only student accounts can start an assessment.' }, { status: 403 });
    }

    const body = await request.json();
    const { accessCode, labStation } = body;
    if (!accessCode || typeof accessCode !== 'string') {
      return NextResponse.json({ error: 'Access code required' }, { status: 400 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { accessCode: accessCode.toUpperCase().trim() },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (!assessment.isPublished) {
      return NextResponse.json({ error: 'This assessment is not currently available.' }, { status: 403 });
    }

    const cleanStation = labStation ? String(labStation).trim().slice(0, 50) : null;

    // Check for existing attempt
    let attempt = await prisma.testAttempt.findUnique({
      where: {
        assessmentId_studentId: {
          assessmentId: assessment.id,
          studentId: user.id,
        },
      },
    });

    let response: NextResponse;

    if (attempt) {
      // Server-side deadline: an expired in-progress attempt is finalized as
      // timed out instead of being resumable forever.
      const durationSeconds = assessment.durationMinutes * 60;
      const startedAtMs = new Date(attempt.startedAt).getTime();
      const expired =
        attempt.status === AttemptStatus.IN_PROGRESS &&
        Number.isFinite(startedAtMs) &&
        Date.now() > startedAtMs + (durationSeconds + 15) * 1000;

      if (expired) {
        await prisma.testAttempt.update({
          where: { id: attempt.id },
          data: { status: AttemptStatus.TIMED_OUT, submittedAt: new Date() },
        });
        return NextResponse.json(
          {
            error: 'The time for this assessment has expired.',
            attemptId: attempt.id,
            status: AttemptStatus.TIMED_OUT,
            alreadySubmitted: true,
          },
          { status: 409 }
        );
      }

      if (attempt.status !== AttemptStatus.IN_PROGRESS) {
        // Never delete a completed attempt: it is the student's official record.
        return NextResponse.json(
          {
            error: 'You have already completed this assessment.',
            attemptId: attempt.id,
            status: attempt.status,
            alreadySubmitted: true,
          },
          { status: 409 }
        );
      }

      // If station was updated or newly provided, save it
      if (cleanStation && attempt.labStation !== cleanStation) {
        attempt = await prisma.testAttempt.update({
          where: { id: attempt.id },
          data: { labStation: cleanStation },
        });
      }

      response = NextResponse.json({
        attemptId: attempt.id,
        startedAt: attempt.startedAt,
        labStation: attempt.labStation,
        answers: attempt.answers,
        violationCount: attempt.violationCount,
      });
    } else {
      // Create new attempt
      attempt = await prisma.testAttempt.create({
        data: {
          assessmentId: assessment.id,
          studentId: user.id,
          labStation: cleanStation,
          status: AttemptStatus.IN_PROGRESS,
          startedAt: new Date(),
          violationCount: 0,
          violationLogs: [],
          answers: {},
        },
      });

      response = NextResponse.json({
        attemptId: attempt.id,
        startedAt: attempt.startedAt,
        labStation: attempt.labStation,
        answers: {},
        violationCount: 0,
      });
    }

    return response;
  } catch (error) {
    console.error('Error starting attempt:', error);
    return NextResponse.json({ error: 'Failed to initiate secure assessment session' }, { status: 500 });
  }
}
