'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  CS_QUESTION_BANK,
  CS_SUBJECTS,
  SubjectKey,
  DifficultyLevel,
  autoGenerateQuestions,
  filterQuestionBank,
  BankQuestion,
} from '@/lib/questionBank';
import {
  Shield,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Timer,
  AlertTriangle,
  HelpCircle,
  Video,
  Mic,
  Maximize2,
  Shuffle,
  BookOpen,
  Sparkles,
  Search,
  Filter,
  Check,
  Save,
} from 'lucide-react';

interface QuestionOption {
  id: string;
  text: string;
}

interface QuestionDraft {
  id?: string;
  questionText: string;
  marks: number;
  negativeMarks: number;
  options: QuestionOption[];
  correctOptionId: string;
  explanation?: string;
}

export default function EditAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const assessmentId = resolvedParams.id;

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [perQuestionTimer, setPerQuestionTimer] = useState(false);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(60);
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [showResultImmediately, setShowResultImmediately] = useState(true);
  const [maxViolationsAllowed, setMaxViolationsAllowed] = useState(3);
  const [requireCamera, setRequireCamera] = useState(true);
  const [requireMicrophone, setRequireMicrophone] = useState(true);
  const [requireFullscreen, setRequireFullscreen] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  // Questions State
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  // Question Bank Modal State
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSubject, setBankSubject] = useState<SubjectKey | 'ALL'>('ALL');
  const [bankDifficulty, setBankDifficulty] = useState<DifficultyLevel | 'ALL'>('Medium');
  const [bankCount, setBankCount] = useState<number>(3);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());
  const [bankFeedback, setBankFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadAssessment() {
      try {
        const res = await fetch(`/api/assessments/${assessmentId}`);
        if (!res.ok) {
          throw new Error('Assessment not found or access denied.');
        }
        const data = await res.json();
        const a = data.assessment;

        setTitle(a.title || '');
        setDescription(a.description || '');
        setAccessCode(a.accessCode || '');
        setDurationMinutes(a.durationMinutes || 30);
        setPerQuestionTimer(Boolean(a.perQuestionTimer));
        setSecondsPerQuestion(a.secondsPerQuestion || 60);
        setPassingPercentage(a.passingPercentage || 50);
        setShowResultImmediately(a.showResultImmediately !== false);
        setMaxViolationsAllowed(a.maxViolationsAllowed || 3);
        setRequireCamera(a.requireCamera !== false);
        setRequireMicrophone(a.requireMicrophone !== false);
        setRequireFullscreen(a.requireFullscreen !== false);
        setShuffleQuestions(a.shuffleQuestions !== false);
        setIsPublished(a.isPublished !== false);

        if (a.questions && Array.isArray(a.questions) && a.questions.length > 0) {
          setQuestions(
            a.questions.map((q: any) => ({
              id: q.id,
              questionText: q.questionText || '',
              marks: q.marks || 1,
              negativeMarks: Number(q.negativeMarks) || 0,
              options: Array.isArray(q.options)
                ? q.options
                : [
                    { id: 'A', text: '' },
                    { id: 'B', text: '' },
                    { id: 'C', text: '' },
                    { id: 'D', text: '' },
                  ],
              correctOptionId: q.correctOptionId || 'A',
              explanation: q.explanation || '',
            }))
          );
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setInitialLoading(false);
      }
    }

    loadAssessment();
  }, [assessmentId]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        questionText: '',
        marks: 1,
        negativeMarks: 0,
        options: [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' },
        ],
        correctOptionId: 'A',
        explanation: '',
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('Assessment must contain at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const updateOptionText = (qIdx: number, optIdx: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const opts = [...copy[qIdx].options];
      opts[optIdx] = { ...opts[optIdx], text };
      copy[qIdx] = { ...copy[qIdx], options: opts };
      return copy;
    });
  };

  // Question Bank Auto-Prepare
  const handleAutoPrepareFromBank = () => {
    const generated = autoGenerateQuestions({
      subject: bankSubject,
      difficulty: bankDifficulty,
      count: bankCount,
    });

    const newDrafts: QuestionDraft[] = generated.map((bq, idx) => ({
      id: `bank_${Date.now()}_${idx}`,
      questionText: bq.questionText,
      marks: bq.defaultMarks,
      negativeMarks: 0, // Zero negative marking by default
      options: bq.options.map((opt) => ({ ...opt })),
      correctOptionId: bq.correctOptionId,
      explanation: bq.explanation,
    }));

    if (questions.length === 1 && !questions[0].questionText.trim()) {
      setQuestions(newDrafts);
    } else {
      setQuestions((prev) => [...prev, ...newDrafts]);
    }

    setBankFeedback(`Appended ${newDrafts.length} ${bankDifficulty} questions from question bank.`);
    setTimeout(() => setBankFeedback(null), 4000);
  };

  const toggleBankSelect = (id: string) => {
    setSelectedBankIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelectedFromBank = () => {
    const questionsToAdd = CS_QUESTION_BANK.filter((bq) => selectedBankIds.has(bq.id));
    const newDrafts: QuestionDraft[] = questionsToAdd.map((bq, idx) => ({
      id: `bank_${Date.now()}_${idx}`,
      questionText: bq.questionText,
      marks: bq.defaultMarks,
      negativeMarks: 0,
      options: bq.options.map((opt) => ({ ...opt })),
      correctOptionId: bq.correctOptionId,
      explanation: bq.explanation,
    }));

    setQuestions((prev) => [...prev, ...newDrafts]);
    setShowBankModal(false);
    setSelectedBankIds(new Set());
    setBankFeedback(`Added ${newDrafts.length} questions from question bank.`);
    setTimeout(() => setBankFeedback(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setError('Assessment Title is required.');
      return;
    }

    if (!accessCode.trim()) {
      setError('Access Code is required.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setError(`Question #${i + 1} is missing question text.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          setError(`Question #${i + 1}, Option ${q.options[j].id} cannot be empty.`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          accessCode,
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
          isPublished,
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update assessment');
      }

      setSuccessMsg('Assessment updated successfully!');
      setTimeout(() => {
        router.push(`/teacher/test/${assessmentId}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error updating assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete assessment');
      }

      router.push('/teacher');
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const filteredBankQuestions = filterQuestionBank({
    subject: bankSubject === 'ALL' ? undefined : bankSubject,
    difficulty: bankDifficulty === 'ALL' ? undefined : bankDifficulty,
    search: bankSearch,
  });

  if (initialLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#64748b' }}>Loading assessment editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '48px 0' }}>
        <div className="container-narrow">
          {/* Back Navigation & Delete Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <Link
              href={`/teacher/test/${assessmentId}`}
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
              <span>Back to Assessment Audit</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Trash2 style={{ width: '14px', height: '14px' }} />
              <span>Delete Assessment</span>
            </button>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>Edit Assessment</h1>
              <span className={isPublished ? 'badge badge-emerald' : 'badge badge-amber'}>
                {isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px' }}>
              Modify test parameters, timing constraints, proctoring boundaries, and questions.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '16px',
                borderRadius: '8px',
                color: '#dc2626',
                marginBottom: '24px',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '16px',
                borderRadius: '8px',
                color: '#15803d',
                marginBottom: '24px',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Section 1: Basic Information */}
            <div className="glass-panel" style={{ padding: '32px', background: '#ffffff' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                1. General Settings
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Assessment Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Instructions / Description</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Access Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input font-mono"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Publishing Status</label>
                    <select
                      className="form-input"
                      value={isPublished ? 'published' : 'draft'}
                      onChange={(e) => setIsPublished(e.target.value === 'published')}
                    >
                      <option value="published">Published (Live for students)</option>
                      <option value="draft">Draft (Hidden from students)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Timing & Scoring */}
            <div className="glass-panel" style={{ padding: '32px', background: '#ffffff' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                2. Examination Timing &amp; Result Delivery
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <label
                    onClick={() => setPerQuestionTimer(false)}
                    style={{
                      border: !perQuestionTimer ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: !perQuestionTimer ? '#f0f9ff' : '#ffffff',
                      padding: '16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a' }}>
                      <Clock style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                      <span>Overall Exam Duration</span>
                    </div>
                    <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                      Candidate has a shared total countdown (e.g. 30 minutes) to answer all questions.
                    </span>
                  </label>

                  <label
                    onClick={() => setPerQuestionTimer(true)}
                    style={{
                      border: perQuestionTimer ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: perQuestionTimer ? '#f0f9ff' : '#ffffff',
                      padding: '16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a' }}>
                      <Timer style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                      <span>Strict Per-Question Timer</span>
                    </div>
                    <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                      Each question has an individual countdown (e.g. 45s). Automatically advances when time expires.
                    </span>
                  </label>
                </div>

                {!perQuestionTimer ? (
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Total Duration (Minutes)</label>
                    <input
                      type="number"
                      min={1}
                      max={360}
                      className="form-input"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Seconds Allocated Per Question</label>
                    <input
                      type="number"
                      min={10}
                      max={600}
                      className="form-input"
                      value={secondsPerQuestion}
                      onChange={(e) => setSecondsPerQuestion(Number(e.target.value))}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Passing Grade Percentage (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="form-input"
                      value={passingPercentage}
                      onChange={(e) => setPassingPercentage(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Result Delivery Timing</label>
                    <select
                      className="form-input"
                      value={showResultImmediately ? 'immediate' : 'later'}
                      onChange={(e) => setShowResultImmediately(e.target.value === 'immediate')}
                    >
                      <option value="immediate">Show Results Immediately after submission</option>
                      <option value="later">Release Results Later via Email</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Proctoring Boundaries */}
            <div className="glass-panel" style={{ padding: '32px', background: '#ffffff' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                3. Security &amp; Anti-Cheat Perimeter
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={requireCamera}
                    onChange={(e) => setRequireCamera(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.94rem' }}>
                      Require Camera &amp; In-Browser AI Face Tracking
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Detects absence, multiple persons in frame, and persistent gaze diversion.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={requireMicrophone}
                    onChange={(e) => setRequireMicrophone(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.94rem' }}>
                      Require Microphone &amp; Acoustic Voice Analysis
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Monitors room audio for human speech frequencies and whispered assistance.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={requireFullscreen}
                    onChange={(e) => setRequireFullscreen(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.94rem' }}>
                      Mandatory Fullscreen Lockdown
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Exiting fullscreen mode or switching browser tabs logs an immediate security strike.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.94rem' }}>
                      Shuffle Question Delivery Order
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Randomizes question order for each candidate to prevent side-by-side collaboration.
                    </div>
                  </div>
                </label>

                <div style={{ marginTop: '10px' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Maximum Allowed Security Strikes before Auto-Termination
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="form-input"
                    style={{ maxWidth: '180px' }}
                    value={maxViolationsAllowed}
                    onChange={(e) => setMaxViolationsAllowed(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Question Manager */}
            <div className="glass-panel" style={{ padding: '32px', background: '#ffffff' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                    4. Assessment Questions ({questions.length})
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '2px' }}>
                    Author custom questions or append more from the CS Fundamentals Question Bank.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowBankModal(true)}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <BookOpen style={{ width: '14px', height: '14px', color: '#0284c7' }} />
                    <span>Browse Question Bank</span>
                  </button>
                </div>
              </div>

              {/* Question Bank Fast Generator Bar */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles style={{ width: '16px', height: '16px', color: '#0284c7' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    Auto-Prepare More Questions:
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <select
                    value={bankSubject}
                    onChange={(e) => setBankSubject(e.target.value as any)}
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.84rem', width: 'auto' }}
                  >
                    <option value="ALL">All CS Subjects</option>
                    {CS_SUBJECTS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={bankDifficulty}
                    onChange={(e) => setBankDifficulty(e.target.value as any)}
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.84rem', width: 'auto' }}
                  >
                    <option value="Easy">Easy Level</option>
                    <option value="Medium">Medium Level</option>
                    <option value="Hard">Hard Level</option>
                  </select>

                  <select
                    value={bankCount}
                    onChange={(e) => setBankCount(Number(e.target.value))}
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.84rem', width: 'auto' }}
                  >
                    <option value={1}>+ 1 Question</option>
                    <option value={3}>+ 3 Questions</option>
                    <option value={5}>+ 5 Questions</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleAutoPrepareFromBank}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.84rem' }}
                  >
                    <span>Append Questions</span>
                  </button>
                </div>
              </div>

              {bankFeedback && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                  <span>{bankFeedback}</span>
                </div>
              )}

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {questions.map((q, qIndex) => (
                  <div
                    key={q.id || qIndex}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '24px',
                      background: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                      }}
                    >
                      <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
                        Question #{qIndex + 1}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Marks:</span>
                          <input
                            type="number"
                            min={1}
                            className="form-input"
                            style={{ width: '65px', padding: '4px 8px', fontSize: '0.85rem' }}
                            value={q.marks}
                            onChange={(e) => updateQuestion(qIndex, 'marks', Number(e.target.value))}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Negative:</span>
                          <input
                            type="number"
                            min={0}
                            step="0.25"
                            className="form-input"
                            style={{ width: '65px', padding: '4px 8px', fontSize: '0.85rem' }}
                            value={q.negativeMarks}
                            onChange={(e) => updateQuestion(qIndex, 'negativeMarks', Number(e.target.value))}
                          />
                        </div>

                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            style={{
                              color: '#dc2626',
                              background: '#fef2f2',
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #fecaca',
                              cursor: 'pointer',
                            }}
                            title="Remove Question"
                          >
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>Question Text *</label>
                      <textarea
                        rows={2}
                        required
                        className="form-input"
                        value={q.questionText}
                        onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                      />
                    </div>

                    {/* Options Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      {q.options.map((opt, optIndex) => (
                        <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '4px',
                              background: q.correctOptionId === opt.id ? '#10b981' : '#e2e8f0',
                              color: q.correctOptionId === opt.id ? '#ffffff' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              flexShrink: 0,
                              cursor: 'pointer',
                            }}
                            onClick={() => updateQuestion(qIndex, 'correctOptionId', opt.id)}
                            title="Click to mark as correct answer"
                          >
                            {opt.id}
                          </span>
                          <input
                            type="text"
                            required
                            className="form-input"
                            style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                            value={opt.text}
                            onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                            placeholder={`Option ${opt.id}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Correct Answer:</span>
                        <select
                          value={q.correctOptionId}
                          onChange={(e) => updateQuestion(qIndex, 'correctOptionId', e.target.value)}
                          className="form-input"
                          style={{ width: 'auto', padding: '4px 10px', fontSize: '0.85rem' }}
                        >
                          {q.options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              Option {opt.id}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '4px 10px', fontSize: '0.84rem' }}
                          value={q.explanation || ''}
                          onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                          placeholder="Optional answer explanation"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="btn-secondary"
                  style={{ padding: '12px', borderStyle: 'dashed' }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  <span>Add Another Question</span>
                </button>
              </div>
            </div>

            {/* Bottom Submit Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', paddingBottom: '60px' }}>
              <Link href={`/teacher/test/${assessmentId}`} className="btn-secondary" style={{ padding: '12px 24px' }}>
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ padding: '12px 36px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Save style={{ width: '16px', height: '16px' }} />
                <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

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
              Are you sure you want to delete <strong>"{title}"</strong>? All questions, student attempts, and audit logs will be permanently removed.
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

      {/* Question Bank Modal */}
      {showBankModal && (
        <div className="modal-overlay">
          <div
            className="glass-panel"
            style={{
              maxWidth: '860px',
              width: '92%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              borderRadius: '12px',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen style={{ width: '22px', height: '22px', color: '#0284c7' }} />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    CS Fundamentals Question Bank
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Select curated engineering questions to append to your assessment.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#64748b', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px 0', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <Search style={{ width: '16px', height: '16px', color: '#94a3b8', position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Search topics or keywords..."
                  className="form-input"
                  style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                />
              </div>

              <select
                value={bankSubject}
                onChange={(e) => setBankSubject(e.target.value as any)}
                className="form-input"
                style={{ width: 'auto', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Subjects</option>
                {CS_SUBJECTS.map((s) => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </select>

              <select
                value={bankDifficulty}
                onChange={(e) => setBankDifficulty(e.target.value as any)}
                className="form-input"
                style={{ width: 'auto', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Questions Grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredBankQuestions.map((bq) => {
                const isSelected = selectedBankIds.has(bq.id);
                return (
                  <div
                    key={bq.id}
                    onClick={() => toggleBankSelect(bq.id)}
                    style={{
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: isSelected ? '2px solid #0284c7' : '2px solid #cbd5e1',
                        background: isSelected ? '#0284c7' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2px',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && <Check style={{ width: '14px', height: '14px', color: '#ffffff' }} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>{bq.subject}</span>
                        <span
                          className={`badge ${bq.difficulty === 'Easy' ? 'badge-emerald' : bq.difficulty === 'Medium' ? 'badge-amber' : 'badge-crimson'}`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {bq.difficulty}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>{bq.topic}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                        {bq.questionText}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '0.8rem', color: '#475569' }}>
                        {bq.options.map((opt) => (
                          <div key={opt.id}>
                            <strong>{opt.id}:</strong> {opt.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                {selectedBankIds.size} questions selected
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSelectedFromBank}
                  disabled={selectedBankIds.size === 0}
                  className="btn-primary"
                  style={{ padding: '8px 22px' }}
                >
                  Add Selected to Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
