'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Shield,
  Plus,
  Clock,
  Timer,
  FileText,
  Award,
  Users,
  AlertTriangle,
  Copy,
  Check,
  Trash2,
  Eye,
  FileQuestion,
  Edit3,
  Terminal,
} from 'lucide-react';

interface AssessmentItem {
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
  maxViolationsAllowed: number;
  requireCamera: boolean;
  requireMicrophone: boolean;
  requireFullscreen: boolean;
  isPublished: boolean;
  createdAt: string;
  questions: { id: string; marks: number; questionType?: string }[];
  attempts: {
    id: string;
    status: string;
    score: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    violationCount: number;
    student: { id: string; name: string; email: string };
  }[];
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const fetchAssessments = async () => {
    try {
      const res = await fetch('/api/assessments?scope=teacher');
      if (res.status === 401 || res.status === 403) {
        router.push('/login?role=TEACHER');
        return;
      }
      const data = await res.json();
      setAssessments(data.assessments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/assessments/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setAssessments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert(data.error || 'Failed to delete assessment');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Delete error');
    } finally {
      setDeletingId(null);
    }
  };

  // Aggregated Stats
  const totalAssessments = assessments.length;
  const totalAttempts = assessments.reduce((acc, a) => acc + (a.attempts?.length || 0), 0);
  const totalViolations = assessments.reduce(
    (acc, a) => acc + (a.attempts?.reduce((v, att) => v + (att.violationCount || 0), 0) || 0),
    0
  );
  const terminatedAttempts = assessments.reduce(
    (acc, a) =>
      acc + (a.attempts?.filter((att) => att.status === 'TERMINATED_FOR_VIOLATION').length || 0),
    0
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '48px 0' }}>
        <div className="container">
          {/* Header Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
              marginBottom: '36px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>Teacher Dashboard</h1>
                <span className="badge badge-cyan">Examiner Workspace</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px' }}>
                Manage tests, configure proctoring boundaries, and review candidate results
              </p>
            </div>

            <Link href="/teacher/create" className="btn-primary" style={{ padding: '12px 22px' }}>
              <Plus style={{ width: '18px', height: '18px' }} />
              <span>Create New Assessment</span>
            </Link>
          </div>

          {/* Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 600 }}>Assessments Created</span>
                <FileQuestion style={{ width: '20px', height: '20px', color: '#0284c7' }} />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>{totalAssessments}</div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 600 }}>Candidate Attempts</span>
                <Users style={{ width: '20px', height: '20px', color: '#059669' }} />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>{totalAttempts}</div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 600 }}>Security Flags</span>
                <AlertTriangle style={{ width: '20px', height: '20px', color: '#d97706' }} />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#d97706' }}>
                {totalViolations} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>strikes</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 600 }}>Terminated for Violations</span>
                <Shield style={{ width: '20px', height: '20px', color: '#dc2626' }} />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#dc2626' }}>
                {terminatedAttempts}
              </div>
            </div>
          </div>

          {/* Assessments Grid */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
              Your Assessments
            </h2>

            {loading ? (
              <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#ffffff' }}>
                Loading assessments...
              </div>
            ) : assessments.length === 0 ? (
              <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', background: '#ffffff' }}>
                <FileQuestion style={{ width: '44px', height: '44px', color: '#94a3b8', margin: '0 auto 16px auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>No assessments created yet</h3>
                <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto 24px auto', fontSize: '0.92rem' }}>
                  Create your first secure assessment to set up questions, timers, and security thresholds.
                </p>
                <Link href="/teacher/create" className="btn-primary">
                  <Plus style={{ width: '16px', height: '16px' }} />
                  <span>Create Assessment</span>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '24px' }}>
                {assessments.map((test) => {
                  const attemptCount = test.attempts?.length || 0;
                  const passedCount = test.attempts?.filter((att) => att.passed).length || 0;
                  const passRate = attemptCount > 0 ? Math.round((passedCount / attemptCount) * 100) : 0;

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
                        {/* Access Code and Badges (Fully Responsive) */}
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
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                              CODE:
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(test.accessCode)}
                              className="badge badge-cyan"
                              style={{
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.82rem',
                                padding: '4px 10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                              title="Click to copy access code"
                            >
                              <span>{test.accessCode}</span>
                              {copiedCode === test.accessCode ? (
                                <Check style={{ width: '12px', height: '12px', color: '#059669' }} />
                              ) : (
                                <Copy style={{ width: '12px', height: '12px' }} />
                              )}
                            </button>
                            {test.isPublished !== false ? (
                              <span className="badge badge-emerald" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                                Published
                              </span>
                            ) : (
                              <span className="badge badge-amber" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                                Draft
                              </span>
                            )}
                            {test.examType === 'PRACTICAL' ? (
                              <span className="badge badge-cyan" style={{ fontSize: '0.74rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Terminal style={{ width: '11px', height: '11px' }} />
                                Practical Lab
                              </span>
                            ) : (
                              <span className="badge badge-purple" style={{ fontSize: '0.74rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <FileText style={{ width: '11px', height: '11px' }} />
                                MCQ Exam
                              </span>
                            )}
                          </div>

                          <div style={{ flexShrink: 0 }}>
                            {test.perQuestionTimer ? (
                              <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                <Timer style={{ width: '13px', height: '13px' }} />
                                <span>{test.secondsPerQuestion}s / Item</span>
                              </span>
                            ) : (
                              <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                <Clock style={{ width: '13px', height: '13px' }} />
                                <span>{test.durationMinutes} mins total</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', lineHeight: 1.35 }}>
                          {test.title}
                        </h3>

                        {(test.labName || test.batchName || test.subjectCode) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                            {test.subjectCode && (
                              <span style={{ fontSize: '0.75rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                {test.subjectCode}
                              </span>
                            )}
                            {test.labName && (
                              <span style={{ fontSize: '0.75rem', color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                                {test.labName}
                              </span>
                            )}
                            {test.batchName && (
                              <span style={{ fontSize: '0.75rem', color: '#059669', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                {test.batchName}
                              </span>
                            )}
                          </div>
                        )}

                        <p
                          style={{
                            color: '#64748b',
                            fontSize: '0.88rem',
                            marginBottom: '18px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {test.description || 'No description provided.'}
                        </p>

                        {/* Proctoring Settings Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              background: '#f1f5f9',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              color: '#475569',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            {test.examType === 'PRACTICAL' ? (
                              <>
                                <Terminal style={{ width: '13px', height: '13px', color: '#0284c7' }} />
                                <span>{test.questions?.length ?? 0} Practical Task{test.questions?.length === 1 ? '' : 's'}</span>
                              </>
                            ) : (
                              <>
                                <FileText style={{ width: '13px', height: '13px' }} />
                                <span>{test.questions?.length ?? 0} MCQs</span>
                              </>
                            )}
                          </span>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              background: '#f1f5f9',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              color: '#475569',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <Award style={{ width: '13px', height: '13px' }} />
                            <span>{test.totalMarks} Marks</span>
                          </span>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              color: '#dc2626',
                              fontWeight: 600,
                            }}
                          >
                            Max {test.maxViolationsAllowed} Strikes
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions (Responsive Wrap) */}
                      <div
                        style={{
                          borderTop: '1px solid #f1f5f9',
                          paddingTop: '16px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ fontSize: '0.84rem', whiteSpace: 'nowrap', minWidth: '120px' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{attemptCount}</span>
                          <span style={{ color: '#64748b' }}> attempts ({passRate}% pass)</span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                          <Link
                            href={`/teacher/edit/${test.id}`}
                            className="btn-secondary"
                            style={{ padding: '7px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
                            title="Edit Assessment"
                          >
                            <Edit3 style={{ width: '13px', height: '13px' }} />
                            <span>Edit</span>
                          </Link>

                          <Link
                            href={`/teacher/test/${test.id}`}
                            className="btn-primary"
                            style={{ padding: '7px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                          >
                            <Eye style={{ width: '14px', height: '14px' }} />
                            <span>Audit &amp; Submissions</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: test.id, title: test.title })}
                            disabled={deletingId === test.id}
                            style={{
                              padding: '7px 9px',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Delete Assessment"
                          >
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ maxWidth: '440px', padding: '32px', textAlign: 'center', background: '#ffffff' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <Trash2 style={{ width: '24px', height: '24px' }} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Delete Assessment?
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? All questions, student attempts, and audit logs will be permanently deleted.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary"
                disabled={!!deletingId}
                style={{ padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!!deletingId}
                className="btn-danger"
                style={{ padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 style={{ width: '14px', height: '14px' }} />
                <span>{deletingId ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
