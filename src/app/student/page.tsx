'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Shield,
  Clock,
  Timer,
  ArrowRight,
  CheckCircle2,
  Award,
  User,
  FileText,
  Terminal,
} from 'lucide-react';

interface AvailableAssessment {
  id: string;
  title: string;
  description: string;
  accessCode: string;
  examType?: 'PRACTICAL' | 'MCQ' | 'HYBRID';
  subjectCode?: string | null;
  labName?: string | null;
  batchName?: string | null;
  durationMinutes: number;
  perQuestionTimer: boolean;
  secondsPerQuestion: number;
  totalMarks: number;
  passingPercentage: number;
  teacher: { name: string; email: string };
  _count: { questions: number; attempts: number };
  showResultImmediately?: boolean;
  attempts?: {
    id: string;
    status: string;
    score: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    violationCount: number;
    submittedAt: string | null;
  }[];
}

export default function StudentDashboard() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [assessments, setAssessments] = useState<AvailableAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login?role=STUDENT');
          return null;
        }
        return res.json();
      })
      .then((userData) => {
        if (!userData?.user) {
          router.push('/login?role=STUDENT');
          return;
        }

        if (userData.user.role !== 'STUDENT') {
          router.push('/teacher');
          return;
        }

        return fetch('/api/assessments?scope=student')
          .then((res) => res.json())
          .then((data) => {
            if (data?.assessments) {
              setAssessments(data.assessments);
            }
          });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLaunchCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    router.push(`/exam/${accessCode.trim().toUpperCase()}/check`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '48px 0' }}>
        <div className="container">
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>Student Portal</h1>
              <span className="badge badge-emerald">Candidate Workspace</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px' }}>
              Enter your assessment access code or start assigned tests
            </p>
          </div>

          {/* Code Launch Card */}
          <div
            className="glass-panel"
            style={{
              padding: '36px',
              marginBottom: '44px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ maxWidth: '640px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Have an Assessment Access Code?
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
                Enter the code provided by your instructor to complete hardware check and take your examination.
              </p>

              <form onSubmit={handleLaunchCode} style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CS101"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    fontSize: '1rem',
                  }}
                  required
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}
                >
                  <span>Start Checkroom</span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </button>
              </form>
            </div>
          </div>

          {/* Available Tests */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
              Available Assessments
            </h2>

            {loading ? (
              <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#ffffff' }}>
                Loading assessments...
              </div>
            ) : assessments.length === 0 ? (
              <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#ffffff' }}>
                No public assessments found. Please enter an Access Code above.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '24px' }}>
                {assessments.map((test) => {
                  const studentAttempt = test.attempts && test.attempts.length > 0 ? test.attempts[0] : null;

                  return (
                    <div
                      key={test.id}
                      className="glass-panel glass-panel-interactive"
                      style={{
                        padding: '24px 28px',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            marginBottom: '16px',
                          }}
                        >
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                            <span
                              className="badge badge-cyan"
                              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                            >
                              CODE: {test.accessCode}
                            </span>
                            {test.examType === 'PRACTICAL' ? (
                              <span className="badge badge-emerald" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Terminal size={11} /> Practical Lab
                              </span>
                            ) : (
                              <span className="badge badge-purple" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <FileText size={11} /> MCQ Exam
                              </span>
                            )}
                          </div>

                          <div style={{ flexShrink: 0 }}>
                            {test.perQuestionTimer ? (
                              <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                <Timer size={13} /> {test.secondsPerQuestion}s / Item
                              </span>
                            ) : (
                              <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                <Clock size={13} /> {test.durationMinutes} mins total
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', lineHeight: 1.35 }}>
                          {test.title}
                        </h3>

                        {(test.subjectCode || test.labName || test.batchName) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                            {test.subjectCode && (
                              <span style={{ fontSize: '0.75rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                {test.subjectCode}
                              </span>
                            )}
                            {test.labName && (
                              <span style={{ fontSize: '0.75rem', color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                                {test.labName}
                              </span>
                            )}
                            {test.batchName && (
                              <span style={{ fontSize: '0.75rem', color: '#059669', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                {test.batchName}
                              </span>
                            )}
                          </div>
                        )}

                        <p
                          style={{
                            color: '#64748b',
                            fontSize: '0.88rem',
                            marginBottom: '20px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {test.description || 'Proctored examination.'}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                          <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <User size={13} /> {test.teacher?.name || 'Instructor'}
                          </span>
                          <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {test.examType === 'PRACTICAL' ? (
                              <>
                                <Terminal size={13} /> {test._count?.questions ?? 0} Practical Task{test._count?.questions === 1 ? '' : 's'}
                              </>
                            ) : (
                              <>
                                <FileText size={13} /> {test._count?.questions ?? 0} Questions
                              </>
                            )}
                          </span>
                          <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Award size={13} /> {test.totalMarks} Marks
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div
                        style={{
                          borderTop: '1px solid #f1f5f9',
                          paddingTop: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        {studentAttempt ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Status:</div>
                              {studentAttempt.status === 'IN_PROGRESS' ? (
                                <span className="badge badge-cyan">In Progress</span>
                              ) : studentAttempt.status === 'TERMINATED_FOR_VIOLATION' ? (
                                <span className="badge badge-crimson">Terminated for Violations</span>
                              ) : test.showResultImmediately === false ? (
                                <span className="badge badge-amber">Submitted - Results Pending</span>
                              ) : studentAttempt.passed ? (
                                <span className="badge badge-emerald">Passed ({studentAttempt.percentage}%)</span>
                              ) : (
                                <span className="badge badge-amber">Completed ({studentAttempt.percentage}%)</span>
                              )}
                            </div>

                            <Link
                              href={
                                studentAttempt.status === 'IN_PROGRESS'
                                  ? `/exam/${test.accessCode}`
                                  : `/exam/${test.accessCode}/result`
                              }
                              className="btn-secondary"
                              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                            >
                              <span>
                                {studentAttempt.status === 'IN_PROGRESS'
                                  ? 'Resume Exam'
                                  : test.showResultImmediately === false &&
                                      studentAttempt.status !== 'TERMINATED_FOR_VIOLATION'
                                    ? 'View Submission Receipt'
                                    : 'View Score Report'}
                              </span>
                            </Link>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.82rem', fontWeight: 600 }}>
                              <CheckCircle2 style={{ width: '15px', height: '15px' }} />
                              <span>Ready to Attempt</span>
                            </div>

                            <Link
                              href={`/exam/${test.accessCode}/check`}
                              className="btn-emerald"
                              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                            >
                              <span>Start Exam</span>
                              <ArrowRight style={{ width: '15px', height: '15px' }} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
