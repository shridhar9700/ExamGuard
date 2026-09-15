'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import confetti from 'canvas-confetti';
import {
  Shield,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Mail,
  Clock,
  Terminal,
  FileCode2,
  FileText,
} from 'lucide-react';

interface ResultData {
  attempt: {
    id: string;
    status: string;
    score: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    violationCount: number;
    startedAt: string;
    submittedAt: string | null;
    labStation?: string | null;
    submittedFiles?: any;
    isVerifiedByTeacher?: boolean;
    teacherFeedback?: string | null;
    answers: Record<string, string>;
    student: { name: string; email: string };
    assessment: {
      title: string;
      accessCode: string;
      examType?: string;
      subjectCode?: string | null;
      labName?: string | null;
      batchName?: string | null;
      passingPercentage: number;
      showResultImmediately?: boolean;
      teacher: { name: string };
      questions: {
        id: string;
        questionText: string;
        marks: number;
        negativeMarks: number;
        options: { id: string; text: string }[];
        correctOptionId: string | null;
        explanation: string | null;
      }[];
    };
  };
}

export default function ExamResultPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const accessCode = resolvedParams.code.toUpperCase();

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/assessments/code/${accessCode}`)
      .then((res) => res.json())
      .then(async (testRes) => {
        if (!testRes.existingAttempt) {
          throw new Error('No examination attempt found for this access code.');
        }

        if (testRes.existingAttempt.status === 'IN_PROGRESS') {
          window.location.replace(`/exam/${accessCode}`);
          return;
        }

        const attemptRes = await fetch(`/api/attempts/${testRes.existingAttempt.id}`);
        const attemptData = await attemptRes.json();
        if (!attemptRes.ok) throw new Error(attemptData.error || 'Failed to load results');

        setData(attemptData);

        if (attemptData.attempt.passed && attemptData.attempt.assessment?.showResultImmediately !== false) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Unable to retrieve score results');
      })
      .finally(() => setLoading(false));
  }, [accessCode]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#64748b' }}>Calculating score report...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <Navbar />
        <div className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '48px', maxWidth: '480px', textAlign: 'center', background: '#ffffff' }}>
            <AlertTriangle style={{ width: '48px', height: '48px', color: '#d97706', margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>No Result Found</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              {error || 'You have not submitted an attempt for this assessment.'}
            </p>
            <Link href="/student" className="btn-primary">
              Return to Student Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { attempt } = data;
  const isTerminated = attempt.status === 'TERMINATED_FOR_VIOLATION';
  const showImmediately = attempt.assessment?.showResultImmediately !== false;

  // Practical Exam Submission Receipt Mode
  if (attempt.assessment?.examType === 'PRACTICAL') {
    const submittedFilesObj = attempt.submittedFiles as Record<string, any[]> | null;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <Navbar />

        <main style={{ flex: 1, padding: '48px 0' }}>
          <div className="container-narrow">
            <div
              className="glass-panel"
              style={{
                padding: '48px 36px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
              }}
            >
              {/* Header Badge & Title */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <CheckCircle2 style={{ width: '32px', height: '32px', color: '#16a34a' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)' }}>
                    CODE: {attempt.assessment.accessCode}
                  </span>
                  <span className="badge badge-emerald">PRACTICAL SOLUTION RECORDED</span>
                </div>

                <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  Practical Examination Receipt
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 auto', maxWidth: '540px' }}>
                  Your code solution bundle, live test preview state, and telemetry trail have been securely captured for the examining committee.
                </p>
              </div>

              {/* Workstation & Student Metadata Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '20px',
                  marginBottom: '28px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>LAB STATION NUMBER</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-mono)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={16} />
                    <span>{attempt.labStation || 'PC-01'}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>LABORATORY HALL</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                    {attempt.assessment.labName || 'Computer Systems Lab'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>STUDENT BATCH</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                    {attempt.assessment.batchName || 'General Batch'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>CANDIDATE</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                    {attempt.student.name}
                  </div>
                </div>
              </div>

              {/* Submitted Code Files List */}
              <div style={{ marginBottom: '28px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#f1f5f9', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCode2 size={16} color="#0284c7" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                      Bundled Practical Source Files
                    </span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                    Digitally Sealed
                  </span>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {submittedFilesObj && Object.keys(submittedFilesObj).length > 0 ? (
                    Object.entries(submittedFilesObj).map(([taskId, files]: [string, any]) => (
                      <div key={taskId} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                          Task Solution Files:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {Array.isArray(files) && files.map((f: any) => (
                            <span
                              key={f.filename}
                              style={{
                                fontSize: '0.78rem',
                                fontFamily: 'var(--font-mono)',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                padding: '3px 10px',
                                borderRadius: '4px',
                                color: '#0284c7',
                                fontWeight: 600,
                              }}
                            >
                              {f.filename} ({(f.content || '').length} chars)
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#64748b', fontSize: '0.84rem' }}>
                      All starter and modified source files successfully archived in examination record.
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Actions */}
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '16px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={20} color="#059669" />
                <div style={{ fontSize: '0.84rem', color: '#065f46' }}>
                  <strong>Evaluation Status:</strong> Awaiting invigilator forensic verification and itemized rubric marking. Results will be posted to your student portal upon teacher sign-off.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
                <Link href="/student" className="btn-primary" style={{ padding: '10px 24px' }}>
                  Return to Student Hub
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // View Mode: Email Delivery Scheduled
  if (!showImmediately) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <Navbar />

        <main style={{ flex: 1, padding: '60px 0' }}>
          <div className="container-narrow">
            <div
              className="glass-panel"
              style={{
                padding: '52px 36px',
                textAlign: 'center',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <CheckCircle2 style={{ width: '32px', height: '32px', color: '#16a34a' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
                <span className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)' }}>
                  CODE: {attempt.assessment.accessCode}
                </span>
                <span className="badge badge-emerald">SUBMITTED &amp; RECORDED</span>
              </div>

              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                Assessment Submitted Successfully
              </h1>
              <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 28px auto', lineHeight: 1.5 }}>
                Your responses for <strong>{attempt.assessment.title}</strong> have been securely recorded and finalized.
              </p>

              {/* Email Delivery Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '28px',
                  maxWidth: '560px',
                  margin: '0 auto 36px auto',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Mail style={{ width: '22px', height: '22px', color: '#0284c7' }} />
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                    Results Scheduled for Email Delivery
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
                  Your instructor has configured this examination to release detailed scorecards and question breakdowns later via email.
                </p>

                <div style={{ background: '#f0f9ff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.84rem', color: '#0369a1', fontWeight: 600 }}>
                    Recipient Address:
                  </span>
                  <span style={{ fontSize: '0.88rem', color: '#0c4a6e', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {attempt.student?.email}
                  </span>
                </div>
              </div>

              {/* Submission Summary Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '16px',
                  maxWidth: '560px',
                  margin: '0 auto 36px auto',
                }}
              >
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>ATTEMPTED</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {Object.keys(attempt.answers).length} / {attempt.assessment.questions.length}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>CANDIDATE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {attempt.student?.name}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>INTEGRITY</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: attempt.violationCount === 0 ? '#16a34a' : '#d97706', marginTop: '6px' }}>
                    {attempt.violationCount === 0 ? 'Clean (0 Strikes)' : `${attempt.violationCount} Strikes`}
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/student"
                  className="btn-primary"
                  style={{ padding: '12px 28px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Return to Student Portal</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '48px 0' }}>
        <div className="container-narrow">
          {/* Main Result Card */}
          <div
            className="glass-panel"
            style={{
              padding: '48px 36px',
              textAlign: 'center',
              marginBottom: '36px',
              background: '#ffffff',
              border: `2px solid ${isTerminated ? '#fecaca' : attempt.passed ? '#a7f3d0' : '#fde68a'}`,
            }}
          >
            {/* Status Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: isTerminated
                  ? '#fef2f2'
                  : attempt.passed
                  ? '#ecfdf5'
                  : '#fffbeb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              {isTerminated ? (
                <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626' }} />
              ) : attempt.passed ? (
                <Award style={{ width: '32px', height: '32px', color: '#059669' }} />
              ) : (
                <XCircle style={{ width: '32px', height: '32px', color: '#d97706' }} />
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="badge badge-cyan">{attempt.assessment.accessCode}</span>
              {isTerminated ? (
                <span className="badge badge-crimson">TERMINATED FOR VIOLATIONS</span>
              ) : attempt.passed ? (
                <span className="badge badge-emerald">ASSESSMENT PASSED</span>
              ) : (
                <span className="badge badge-amber">DID NOT PASS</span>
              )}
            </div>

            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              {attempt.assessment.title}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '32px' }}>
              Candidate: <strong style={{ color: '#0f172a' }}>{attempt.student.name}</strong> • Evaluated by {attempt.assessment.teacher.name}
            </p>

            {/* Score Numbers */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '40px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '24px 32px',
                borderRadius: '8px',
                maxWidth: '480px',
                margin: '0 auto 32px auto',
              }}
            >
              <div>
                <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {attempt.score}
                  <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>/{attempt.totalMarks}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px' }}>
                  Total Points
                </div>
              </div>

              <div style={{ width: '1px', height: '48px', background: '#cbd5e1' }} />

              <div>
                <div
                  style={{
                    fontSize: '2.6rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: attempt.passed ? '#059669' : '#d97706',
                  }}
                >
                  {attempt.percentage}%
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px' }}>
                  Pass Req: {attempt.assessment.passingPercentage}%
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '0.86rem',
                background: attempt.violationCount > 0 ? '#fef2f2' : '#ecfdf5',
                border: `1px solid ${attempt.violationCount > 0 ? '#fecaca' : '#a7f3d0'}`,
                color: attempt.violationCount > 0 ? '#dc2626' : '#059669',
                fontWeight: 500,
              }}
            >
              <Shield style={{ width: '16px', height: '16px' }} />
              <span>
                {attempt.violationCount === 0
                  ? 'Zero Security Violations • Verified Integrity'
                  : `${attempt.violationCount} Security Strikes Logged During Exam`}
              </span>
            </div>
          </div>

          {/* Question Review Section */}
          <div className="glass-panel" style={{ padding: '36px', background: '#ffffff', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen style={{ width: '20px', height: '20px', color: '#0284c7' }} />
              <span>Question Review &amp; Explanations</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {attempt.assessment.questions.map((q, idx) => {
                const selected = attempt.answers ? attempt.answers[q.id] : undefined;
                const isCorrect = selected === q.correctOptionId;

                return (
                  <div
                    key={q.id}
                    style={{
                      background: '#f8fafc',
                      border: `1px solid ${isCorrect ? '#a7f3d0' : '#fecaca'}`,
                      borderRadius: '8px',
                      padding: '24px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span className="badge badge-cyan" style={{ fontSize: '0.8rem' }}>
                        Question {idx + 1}
                      </span>

                      {isCorrect ? (
                        <span className="badge badge-emerald">+{q.marks} pts (Correct)</span>
                      ) : selected ? (
                        <span className="badge badge-crimson">-{q.negativeMarks} pts (Incorrect)</span>
                      ) : (
                        <span className="badge badge-amber">0 pts (Unanswered)</span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', marginBottom: '18px', lineHeight: 1.5 }}>
                      {q.questionText}
                    </h3>

                    {/* Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                      {q.options.map((opt) => {
                        const wasChosen = selected === opt.id;
                        const isRightAnswer = q.correctOptionId === opt.id;

                        let optBg = '#ffffff';
                        let optBorder = '#e2e8f0';
                        let optColor = '#334155';

                        if (isRightAnswer) {
                          optBg = '#ecfdf5';
                          optBorder = '#a7f3d0';
                          optColor = '#065f46';
                        } else if (wasChosen && !isRightAnswer) {
                          optBg = '#fef2f2';
                          optBorder = '#fecaca';
                          optColor = '#991b1b';
                        }

                        return (
                          <div
                            key={opt.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderRadius: '6px',
                              background: optBg,
                              border: `1.5px solid ${optBorder}`,
                              color: optColor,
                              fontSize: '0.92rem',
                            }}
                          >
                            <span
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '4px',
                                background: isRightAnswer ? '#059669' : wasChosen ? '#dc2626' : '#f1f5f9',
                                color: isRightAnswer || wasChosen ? '#ffffff' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                              }}
                            >
                              {opt.id}
                            </span>
                            <span style={{ flex: 1, fontWeight: isRightAnswer || wasChosen ? 600 : 400 }}>
                              {opt.text}
                            </span>
                            {isRightAnswer && (
                              <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={14} /> Correct Answer
                              </span>
                            )}
                            {wasChosen && !isRightAnswer && (
                              <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <XCircle size={14} /> Your Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div
                        style={{
                          background: '#f0f9ff',
                          borderLeft: '3px solid #0284c7',
                          padding: '12px 16px',
                          borderRadius: '0 6px 6px 0',
                          fontSize: '0.86rem',
                          color: '#334155',
                        }}
                      >
                        <strong style={{ color: '#0369a1' }}>Explanation: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ textAlign: 'center' }}>
            <Link href="/student" className="btn-primary" style={{ padding: '12px 32px' }}>
              <span>Return to Student Portal</span>
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
