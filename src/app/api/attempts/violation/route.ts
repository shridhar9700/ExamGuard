import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { AttemptStatus, Json } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { attemptId, type, details } = body;

    if (typeof attemptId !== 'string' || !attemptId || typeof type !== 'string' || !type.trim()) {
      return NextResponse.json({ error: 'attemptId and violation type required' }, { status: 400 });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          select: { maxViolationsAllowed: true },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.studentId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const cleanType = type.trim().slice(0, 64);
    const cleanDetails =
      typeof details === 'string' && details.trim()
        ? details.trim().slice(0, 1000)
        : 'Proctor security boundary triggered';

    // Lock the row for the duration of the read-modify-write so concurrent
    // strike events (tab blur + fullscreen exit) cannot overwrite each other.
    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM test_attempts WHERE id = ${attemptId} FOR UPDATE`;

      const fresh = await tx.testAttempt.findUnique({
        where: { id: attemptId },
        include: {
          assessment: {
            select: { maxViolationsAllowed: true },
          },
        },
      });

      if (!fresh) return { notFound: true as const };
      if (fresh.studentId !== user.id) return { denied: true as const };
      if (fresh.status !== AttemptStatus.IN_PROGRESS) {
        return {
          alreadyFinal: true as const,
          status: fresh.status,
          violationCount: fresh.violationCount,
          terminated: fresh.status === AttemptStatus.TERMINATED_FOR_VIOLATION,
        };
      }

      const currentLogs: Json[] = Array.isArray(fresh.violationLogs) ? fresh.violationLogs : [];
      const newViolationEvent: Json = {
        id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        type: cleanType,
        details: cleanDetails,
      };

      const updatedCount = fresh.violationCount + 1;
      const maxAllowed = fresh.assessment.maxViolationsAllowed;
      const isTerminated = updatedCount >= maxAllowed;

      const saved = await tx.testAttempt.update({
        where: { id: attemptId },
        data: {
          violationCount: updatedCount,
          violationLogs: [...currentLogs, newViolationEvent].slice(-200),
          status: isTerminated ? AttemptStatus.TERMINATED_FOR_VIOLATION : AttemptStatus.IN_PROGRESS,
          submittedAt: isTerminated ? new Date() : undefined,
        },
      });

      return {
        success: true as const,
        violationCount: updatedCount,
        maxViolationsAllowed: maxAllowed,
        terminated: isTerminated,
        status: saved.status,
      };
    });

    if (outcome.notFound) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    if (outcome.denied) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    if (outcome.alreadyFinal) {
      return NextResponse.json({
        terminated: outcome.terminated,
        status: outcome.status,
        violationCount: outcome.violationCount,
      });
    }

    return NextResponse.json(outcome);
  } catch (error) {
    console.error('Error logging violation:', error);
    return NextResponse.json({ error: 'Failed to record violation' }, { status: 500 });
  }
}
