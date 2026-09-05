'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Shield,
  ArrowLeft,
  Users,
  AlertTriangle,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Timer,
  Video,
  Mic,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Settings,
  Mail,
  Edit3,
  Trash2,
  Terminal,
  Activity,
  Eye,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import InvigilatorLabCommandCenter from '@/components/InvigilatorLabCommandCenter';
import ForensicAuditModal from '@/components/ForensicAuditModal';

interface AttemptLog {
  id: string;
  timestamp: string;
  type: string;
  details: string;
}

interface AttemptItem {
  id: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  violationCount: number;
  violationLogs: AttemptLog[];
  answers: Record<string, string>;
  labStation?: string | null;
  keystrokeMetrics?: any;
  codeSnapshots?: any[];
  submittedFiles?: any;
  isVerifiedByTeacher?: boolean;
  teacherFeedback?: string | null;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

interface AssessmentDetail {
  id: string;
  title: string;
  description: string;
  accessCode: string;
  durationMinutes: number;
  perQuestionTimer: boolean;
  secondsPerQuestion: number;
  totalMarks: number;
  passingPercentage: number;
  showResultImmediately: boolean;
  maxViolationsAllowed: number;
  requireCamera: boolean;
  requireMicrophone: boolean;
  requireFullscreen: boolean;
  examType?: 'PRACTICAL' | 'MCQ';
  subjectCode?: string | null;
  labName?: string | null;
  batchName?: string | null;
  allowedResources?: any;
  questions: {
    id: string;
    questionText: string;
    marks: number;
    negativeMarks: number;
    options: { id: string; text: string }[];
    correctOptionId: string;
    explanation: string;
    questionType?: string;
    rubric?: any;
  }[];
  attempts: AttemptItem[];
}

export default function TestAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  // Practical Exam View Mode: 'LAB_GRID' | 'TABULAR'
  const [practicalViewMode, setPracticalViewMode] = useState<'LAB_GRID' | 'TABULAR'>('LAB_GRID');
  const [auditAttemptId, setAuditAttemptId] = useState<string | null>(null);

  // Timing Configuration Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editPerQuestion, setEditPerQuestion] = useState(false);
  const [editDuration, setEditDuration] = useState(30);
  const [editSeconds, setEditSeconds] = useState(60);
  const [editShowResult, setEditShowResult] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);

  const loadAssessment = () => {
    fetch(`/api/assessments/${resolvedParams.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setAssessment(data.assessment);
        if (data.assessment) {
          setEditPerQuestion(data.assessment.perQuestionTimer);
          setEditDuration(data.assessment.durationMinutes);
          setEditSeconds(data.assessment.secondsPerQuestion);
          setEditShowResult(data.assessment.showResultImmediately ?? true);
        }
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to load assessment details');
        router.push('/teacher');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAssessment();
  }, [resolvedParams.id, router]);

  const handleSaveTiming = async () => {
    if (!assessment) return;
    setSavingConfig(true);
    try {
      const res = await fetch(`/api/assessments/${assessment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perQuestionTimer: editPerQuestion,
          durationMinutes: editDuration,
          secondsPerQuestion: editSeconds,
          showResultImmediately: editShowResult,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update timing configuration');
      setAssessment((prev) => (prev ? { ...prev, ...data.assessment } : null));
      setShowConfigModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAssessment = async () => {
    if (!assessment) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/assessments/${assessment.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete assessment');
      router.push('/teacher');
    } catch (err: any) {
      alert(err.message);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#64748b' }}>Loading assessment audit and submissions...</p>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const totalAttempts = assessment.attempts.length;
  const passedAttempts = assessment.attempts.filter((a) => a.passed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
  const terminatedCount = assessment.attempts.filter((a) => a.status === 'TERMINATED_FOR_VIOLATION').length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(assessment.attempts.reduce((acc, a) => acc + a.score, 0) / totalAttempts)
      : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '48px 0' }}>
        <div className="container">
          {/* Back link */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href="/teacher"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#64748b',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              <span>Back to Assessments</span>
            </Link>
          </div>

          {/* Assessment Header Card */}
          <div className="glass-panel" style={{ padding: '36px', background: '#ffffff', marginBottom: '32px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  ACCESS CODE: {assessment.accessCode}
                </span>
                <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
                  {assessment.title}
                </h1>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {assessment.perQuestionTimer ? (
                  <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Timer style={{ width: '13px', height: '13px' }} />
                    <span>{assessment.secondsPerQuestion}s / Question</span>
                  </span>
                ) : (
                  <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock style={{ width: '13px', height: '13px' }} />
                    <span>{assessment.durationMinutes} mins total</span>
                  </span>
                )}
                <span className="badge badge-crimson">Strike Limit: {assessment.maxViolationsAllowed}</span>
                <Link
                  href={`/teacher/edit/${assessment.id}`}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit3 size={13} />
                  <span>Edit Assessment</span>
                </Link>

                <button
                  onClick={() => {
                    setEditPerQuestion(assessment.perQuestionTimer);
                    setEditDuration(assessment.durationMinutes);
                    setEditSeconds(assessment.secondsPerQuestion);
                    setEditShowResult(assessment.showResultImmediately ?? true);
                    setShowConfigModal(true);
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Settings size={13} />
                  <span>Configure Exam</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '820px', lineHeight: 1.6 }}>
              {assessment.description || 'No description provided.'}
            </p>

            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
              {assessment.examType === 'PRACTICAL' ? (
                <>
                  <span className="badge badge-cyan" style={{ fontWeight: 800 }}>PRACTICAL LAB EXAM</span>
                  {assessment.labName && <span className="badge badge-cyan">{assessment.labName}</span>}
                  {assessment.batchName && <span className="badge badge-emerald">{assessment.batchName}</span>}
                  {assessment.subjectCode && <span className="badge badge-cyan">{assessment.subjectCode}</span>}
                  <span className="badge badge-cyan">{assessment.questions.length} Practical Task(s)</span>
                </>
              ) : (
                <span className="badge badge-cyan">{assessment.questions.length} MCQs</span>
              )}
              <span className="badge badge-emerald">Camera Required</span>
              <span className="badge badge-emerald">Mic Required</span>
              <span className="badge badge-cyan">Fullscreen Enforced</span>
              <span className="badge badge-cyan">{assessment.totalMarks} Total Marks</span>
              <span className="badge badge-amber">Passing: {assessment.passingPercentage}%</span>
              <span className={`badge ${assessment.showResultImmediately ? 'badge-cyan' : 'badge-emerald'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {assessment.showResultImmediately ? <Award size={12} /> : <Mail size={12} />}
                <span>{assessment.showResultImmediately ? 'Results: Immediate Display' : 'Results: Release via Email'}</span>
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '36px',
            }}
          >
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Candidates Attempted</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{totalAttempts}</div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Pass Rate</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>{passRate}%</div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Average Score</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                {avgScore} / {assessment.totalMarks}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Terminated for Violations</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
                {terminatedCount}
              </div>
            </div>
          </div>

          {/* Practical Lab Mode Toggle & Invigilator Command Grid */}
          {assessment.examType === 'PRACTICAL' && (
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setPracticalViewMode('LAB_GRID')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: practicalViewMode === 'LAB_GRID' ? '#0f172a' : 'transparent',
                    color: practicalViewMode === 'LAB_GRID' ? '#ffffff' : '#64748b',
                  }}
                >
                  <LayoutGrid size={14} />
                  <span>Invigilator Lab Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPracticalViewMode('TABULAR')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: practicalViewMode === 'TABULAR' ? '#0f172a' : 'transparent',
                    color: practicalViewMode === 'TABULAR' ? '#ffffff' : '#64748b',
                  }}
                >
                  <List size={14} />
                  <span>Tabular Submissions ({assessment.attempts.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* If Practical & Lab Grid Mode is selected */}
          {assessment.examType === 'PRACTICAL' && practicalViewMode === 'LAB_GRID' ? (
            <div style={{ marginBottom: '36px' }}>
              <InvigilatorLabCommandCenter
                assessment={assessment as any}
                onRefresh={loadAssessment}
              />
            </div>
          ) : (
            /* Submissions List */
            <div className="glass-panel" style={{ padding: '32px', background: '#ffffff' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Candidate Submissions ({assessment.attempts.length})
                </h2>

                {!assessment.showResultImmediately && assessment.attempts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStatusMsg(`Scorecards successfully dispatched to ${assessment.attempts.length} candidate email(s).`);
                      setTimeout(() => setEmailStatusMsg(null), 5000);
                    }}
                    className="btn-emerald"
                    style={{ padding: '8px 16px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Mail size={14} />
                    <span>Send Results to Candidates via Email</span>
                  </button>
                )}
              </div>

              {emailStatusMsg && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>{emailStatusMsg}</span>
                </div>
              )}

              {assessment.attempts.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
                  No candidate has attempted this assessment yet. Provide access code{' '}
                  <strong style={{ color: '#0284c7' }}>{assessment.accessCode}</strong> to begin.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {assessment.attempts.map((attempt) => {
                    const isExpanded = expandedAttemptId === attempt.id;
                    const logs = Array.isArray(attempt.violationLogs) ? attempt.violationLogs : [];

                    return (
                      <div
                        key={attempt.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Summary Row */}
                        <div
                          style={{
                            padding: '20px 24px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '20px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            {attempt.labStation && (
                              <div
                                style={{
                                  background: '#0f172a',
                                  color: '#38bdf8',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Terminal size={13} />
                                <span>{attempt.labStation}</span>
                              </div>
                            )}

                            <div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{attempt.student.name}</div>
                              <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '2px' }}>
                                {attempt.student.email} • Started {new Date(attempt.startedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            {attempt.status === 'TERMINATED_FOR_VIOLATION' ? (
                              <span className="badge badge-crimson">Terminated for Violations</span>
                            ) : attempt.passed ? (
                              <span className="badge badge-emerald">Passed ({attempt.percentage}%)</span>
                            ) : (
                              <span className="badge badge-amber">Failed ({attempt.percentage}%)</span>
                            )}

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
                                {attempt.score} / {attempt.totalMarks}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Score</div>
                            </div>

                            <div
                              style={{
                                background: attempt.violationCount > 0 ? '#fef2f2' : '#ecfdf5',
                                color: attempt.violationCount > 0 ? '#dc2626' : '#059669',
                                border: `1px solid ${attempt.violationCount > 0 ? '#fecaca' : '#a7f3d0'}`,
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                              }}
                            >
                              {attempt.violationCount} Strikes
                            </div>

                            {/* Practical Forensic Verification Button */}
                            {assessment.examType === 'PRACTICAL' && (
                              <button
                                type="button"
                                onClick={() => setAuditAttemptId(attempt.id)}
                                className="btn-secondary"
                                style={{
                                  padding: '8px 14px',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: '#ffffff',
                                  borderColor: '#0284c7',
                                  color: '#0284c7',
                                }}
                              >
                                <Eye size={14} />
                                <span>Forensic Audit</span>
                              </button>
                            )}

                            <button
                              onClick={() => setExpandedAttemptId(isExpanded ? null : attempt.id)}
                              className="btn-secondary"
                              style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                            >
                              <span>{isExpanded ? 'Hide Details' : 'View Audit Trail'}</span>
                              {isExpanded ? <ChevronUp style={{ width: '14px', height: '14px' }} /> : <ChevronDown style={{ width: '14px', height: '14px' }} />}
                            </button>
                          </div>
                        </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <div
                          style={{
                            borderTop: '1px solid #e2e8f0',
                            background: '#ffffff',
                            padding: '28px',
                          }}
                        >
                          {/* Violation Logs */}
                          <div style={{ marginBottom: '28px' }}>
                            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#dc2626', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <AlertTriangle style={{ width: '16px', height: '16px' }} />
                              <span>Recorded Anti-Cheat Boundary Violations ({logs.length})</span>
                            </h4>

                            {logs.length === 0 ? (
                              <p style={{ fontSize: '0.88rem', color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle2 style={{ width: '15px', height: '15px' }} />
                                <span>No violations detected. Candidate maintained full compliance throughout the exam.</span>
                              </p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {logs.map((log, lIdx) => (
                                  <div
                                    key={lIdx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      background: '#fef2f2',
                                      border: '1px solid #fecaca',
                                      padding: '10px 14px',
                                      borderRadius: '6px',
                                      fontSize: '0.84rem',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontWeight: 700, color: '#dc2626' }}>[{log.type}]</span>
                                      <span style={{ color: '#0f172a' }}>{log.details}</span>
                                    </div>
                                    <span style={{ color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                                      {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Candidate Answers */}
                          <div>
                            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
                              Question-by-Question Response Breakdown
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {assessment.questions.map((q, qIndex) => {
                                const selected = attempt.answers ? attempt.answers[q.id] : undefined;
                                const isCorrect = selected === q.correctOptionId;

                                return (
                                  <div
                                    key={q.id}
                                    style={{
                                      background: '#f8fafc',
                                      padding: '16px 20px',
                                      borderRadius: '6px',
                                      border: `1px solid ${isCorrect ? '#a7f3d0' : '#fecaca'}`,
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                                        Q{qIndex + 1}: {q.questionText}
                                      </span>
                                      {isCorrect ? (
                                        <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                                          +{q.marks} pts (Correct)
                                        </span>
                                      ) : selected ? (
                                        <span className="badge badge-crimson" style={{ fontSize: '0.72rem' }}>
                                          -{q.negativeMarks} pts (Incorrect)
                                        </span>
                                      ) : (
                                        <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                                          Unanswered (0 pts)
                                        </span>
                                      )}
                                    </div>

                                    <div style={{ fontSize: '0.84rem', color: '#475569' }}>
                                      Candidate Selected: <strong style={{ color: isCorrect ? '#059669' : '#dc2626' }}>Option {selected || 'None'}</strong> | Correct Answer: <strong style={{ color: '#059669' }}>Option {q.correctOptionId}</strong>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>
      </main>

      {/* Timing Configuration Modal */}
      {showConfigModal && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ maxWidth: '520px', width: '90%', padding: '32px', background: '#ffffff', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings style={{ width: '20px', height: '20px', color: '#0284c7' }} />
              <span>Configure Exam Timing</span>
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
              Select between total exam duration or a per-question strict countdown timer.
            </p>

            {/* Model Selector Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div
                onClick={() => setEditPerQuestion(false)}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: !editPerQuestion ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: !editPerQuestion ? '#f0f9ff' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: '6px' }}>
                  <Clock size={16} color={!editPerQuestion ? '#0284c7' : '#64748b'} />
                  <span>Overall Time</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Total exam minutes. Students pace themselves freely.
                </p>
              </div>

              <div
                onClick={() => setEditPerQuestion(true)}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: editPerQuestion ? '2px solid #d97706' : '1px solid #e2e8f0',
                  background: editPerQuestion ? '#fffbeb' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: '6px' }}>
                  <Timer size={16} color={editPerQuestion ? '#d97706' : '#64748b'} />
                  <span>Per-Question</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Strict countdown per question (e.g. 30s-60s).
                </p>
              </div>
            </div>

            {/* Timing Inputs */}
            {!editPerQuestion ? (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Total Exam Duration (Minutes)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {[15, 30, 45, 60, 90, 120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditDuration(m)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: editDuration === m ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                        background: editDuration === m ? '#f0f9ff' : '#ffffff',
                        color: editDuration === m ? '#0284c7' : '#475569',
                      }}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    max={360}
                    value={editDuration}
                    onChange={(e) => setEditDuration(Math.max(1, Number(e.target.value)))}
                    style={{ maxWidth: '140px' }}
                  />
                  <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Minutes total</span>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Seconds Allowed Per MCQ Question
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {[30, 45, 60, 90, 120].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditSeconds(s)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: editSeconds === s ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                        background: editSeconds === s ? '#fffbeb' : '#ffffff',
                        color: editSeconds === s ? '#d97706' : '#475569',
                      }}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    className="form-input"
                    min={10}
                    max={600}
                    value={editSeconds}
                    onChange={(e) => setEditSeconds(Math.max(10, Number(e.target.value)))}
                    style={{ maxWidth: '140px' }}
                  />
                  <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Seconds per question</span>
                </div>
              </div>
            )}

            {/* Result Publication Mode in Modal */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Result Publication &amp; Delivery
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setEditShowResult(true)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: editShowResult ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: editShowResult ? '#f0f9ff' : '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={14} color={editShowResult ? '#0284c7' : '#64748b'} />
                    <span>Direct Screen</span>
                  </div>
                  <p style={{ fontSize: '0.74rem', color: '#64748b', margin: 0, lineHeight: 1.35 }}>
                    Show score &amp; answers immediately after test submission.
                  </p>
                </div>

                <div
                  onClick={() => setEditShowResult(false)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: !editShowResult ? '2px solid #059669' : '1px solid #e2e8f0',
                    background: !editShowResult ? '#ecfdf5' : '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} color={!editShowResult ? '#059669' : '#64748b'} />
                    <span>Email Delivery</span>
                  </div>
                  <p style={{ fontSize: '0.74rem', color: '#64748b', margin: 0, lineHeight: 1.35 }}>
                    Withhold answers on screen. Send scorecards via email later.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="btn-secondary"
                style={{ padding: '8px 18px', fontSize: '0.86rem' }}
                disabled={savingConfig}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTiming}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.86rem' }}
                disabled={savingConfig}
              >
                {savingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
              Are you sure you want to delete <strong>"{assessment.title}"</strong>? All questions, candidate attempts, and audit logs will be permanently deleted.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={deleting}
                style={{ padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAssessment}
                disabled={deleting}
                className="btn-danger"
                style={{ padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 style={{ width: '14px', height: '14px' }} />
                <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practical Forensic Audit & Verification Modal */}
      {auditAttemptId && assessment && (
        <ForensicAuditModal
          attemptId={auditAttemptId}
          assessmentTitle={assessment.title}
          rubric={assessment.questions?.[0]?.rubric || []}
          onClose={() => setAuditAttemptId(null)}
          onGraded={() => {
            loadAssessment();
          }}
        />
      )}
    </div>
  );
}
