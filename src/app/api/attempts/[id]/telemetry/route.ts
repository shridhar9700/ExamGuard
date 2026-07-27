import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Json } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      keystrokeMetrics,
      newSnapshots = [],
      activeStation,
      activeFile,
      liveStatus = 'ONLINE',
    } = body;

    if (!Array.isArray(newSnapshots)) {
      return NextResponse.json({ error: 'newSnapshots must be an array' }, { status: 400 });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id },
      select: { id: true, studentId: true, status: true, codeSnapshots: true, labStation: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.studentId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'This attempt is no longer accepting telemetry.' }, { status: 409 });
    }

    // Append incremental snapshots safely
    let existingSnapshots: any[] = [];
    if (Array.isArray(attempt.codeSnapshots)) {
      existingSnapshots = attempt.codeSnapshots;
    } else if (typeof attempt.codeSnapshots === 'string') {
      try {
        existingSnapshots = JSON.parse(attempt.codeSnapshots);
      } catch (e) {
        existingSnapshots = [];
      }
    }

    const snapshotCap = 50;
    const historyCap = 200;

    // Cap each batch as well as the stored history to avoid oversized writes.
    const incomingSnapshots = newSnapshots.slice(0, snapshotCap);
    const updatedSnapshots = [...existingSnapshots, ...incomingSnapshots];

    // Cap snapshots to last N to keep DB compact on long exams.
    const cappedSnapshots = updatedSnapshots.slice(-historyCap);

    // Cap keystrokeMetrics size and discard unknown fields so the JSON column
    // cannot be abused to grow without bound.
    let safeKeystrokeMetrics: Json | undefined;
    if (keystrokeMetrics && typeof keystrokeMetrics === 'object' && !Array.isArray(keystrokeMetrics)) {
      const raw = keystrokeMetrics as Record<string, unknown>;
      const safe: Json = {};
      const allowedKeys = ['totalKeystrokes', 'pasteEvents', 'avgWpm', 'currentWpm', 'integrityRating', 'organicCadenceScore'];
      for (const key of allowedKeys) {
        if (key in raw) (safe as Record<string, unknown>)[key] = raw[key];
      }
      const textified = JSON.stringify(safe);
      safeKeystrokeMetrics = textified.length > 4096 ? ({ truncated: true } as Json) : safe;
    }

    const updated = await prisma.testAttempt.update({
      where: { id },
      data: {
        keystrokeMetrics: safeKeystrokeMetrics,
        codeSnapshots: cappedSnapshots,
        labStation: activeStation || attempt.labStation,
      },
    });

    return NextResponse.json({
      success: true,
      snapshotCount: cappedSnapshots.length,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing telemetry:', error);
    return NextResponse.json({ error: 'Failed to record forensic telemetry' }, { status: 500 });
  }
}

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
      select: {
        id: true,
        studentId: true,
        status: true,
        labStation: true,
        startedAt: true,
        submittedAt: true,
        violationCount: true,
        violationLogs: true,
        keystrokeMetrics: true,
        codeSnapshots: true,
        submittedFiles: true,
        isVerifiedByTeacher: true,
        teacherFeedback: true,
        assessment: {
          select: {
            title: true,
            accessCode: true,
            teacherId: true,
            labName: true,
            batchName: true,
          },
        },
        student: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Authorization: student who took the test or teacher of the assessment
    const isOwnerStudent = attempt.studentId === user.id;
    const isOwnerTeacher = attempt.assessment.teacherId === user.id;

    if (!isOwnerStudent && !isOwnerTeacher) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      attemptId: attempt.id,
      labStation: attempt.labStation,
      student: attempt.student,
      keystrokeMetrics: attempt.keystrokeMetrics,
      codeSnapshots: attempt.codeSnapshots,
      submittedFiles: attempt.submittedFiles,
      violationLogs: attempt.violationLogs,
      violationCount: attempt.violationCount,
      isVerifiedByTeacher: attempt.isVerifiedByTeacher,
    });
  } catch (error) {
    console.error('Error fetching telemetry report:', error);
    return NextResponse.json({ error: 'Failed to retrieve telemetry report' }, { status: 500 });
  }
}
