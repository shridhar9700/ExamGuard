'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Shield,
  Clock,
  Timer,
  CheckCircle2,
  Video,
  Mic,
  Maximize2,
  Plus,
  Trash2,
  AlertCircle,
  ArrowLeft,
  Settings,
  HelpCircle,
  Mail,
  Award,
  BookOpen,
  Sparkles,
  Search,
  Check,
  X,
  Layers,
  Terminal,
  FileCode2,
  ExternalLink,
  Code,
  FileText,
  Globe,
  Database,
  Cpu,
} from 'lucide-react';
import {
  CS_SUBJECTS,
  CS_QUESTION_BANK,
  autoGenerateQuestions,
  filterQuestionBank,
  BankQuestion,
} from '@/lib/questionBank';
import {
  PRACTICAL_SUBJECTS,
  PRACTICAL_QUESTION_BANK,
  DEFAULT_WHITELISTED_RESOURCES,
  filterPracticalBank,
  PracticalBankItem,
  WhitelistedResource,
  StarterFile,
  EvaluationCriterion,
} from '@/lib/practicalBank';

interface McqQuestionDraft {
  id: string;
  questionText: string;
  marks: number;
  negativeMarks: number;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

interface PracticalQuestionDraft {
  id: string;
  title: string;
  problemStatement: string;
  questionType: 'PRACTICAL_WEB' | 'PRACTICAL_CODE' | 'PRACTICAL_SQL';
  marks: number;
  constraints: string[];
  starterFiles: StarterFile[];
  rubric: EvaluationCriterion[];
}

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exam Type Selector ('PRACTICAL' is primary college exam mode)
  const [examType, setExamType] = useState<'PRACTICAL' | 'MCQ'>('PRACTICAL');

  // Assessment Settings
  const [title, setTitle] = useState('Web Technologies End-Semester Practical Examination');
  const [description, setDescription] = useState(
    'Students will build a responsive, validated client-side web application in the ExamGuard workstation with live preview and whitelisted technical documentation.'
  );
  const [accessCode, setAccessCode] = useState('');
  const [subjectCode, setSubjectCode] = useState('WT-301');
  const [labName, setLabName] = useState('Lab 3 — Web Architecture & Systems Lab');
  const [batchName, setBatchName] = useState('Batch A1 (Roll 1-35)');

  // Timers & Policies
  const [perQuestionTimer, setPerQuestionTimer] = useState(false);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(60);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxViolationsAllowed, setMaxViolationsAllowed] = useState(3);
  const [passingPercentage, setPassingPercentage] = useState(40);
  const [showResultImmediately, setShowResultImmediately] = useState(true);
  const [requireCamera, setRequireCamera] = useState(true);
  const [requireMicrophone, setRequireMicrophone] = useState(true);
  const [requireFullscreen, setRequireFullscreen] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);

  // Whitelisted Resources for Practical Exams
  const [allowedResources, setAllowedResources] = useState<WhitelistedResource[]>(
    DEFAULT_WHITELISTED_RESOURCES
  );
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceDesc, setNewResourceDesc] = useState('');
  const [showAddResource, setShowAddResource] = useState(false);

  // Practical Questions State
  const [practicalQuestions, setPracticalQuestions] = useState<PracticalQuestionDraft[]>([
    {
      id: 'prac_init_1',
      title: PRACTICAL_QUESTION_BANK[0].title,
      problemStatement: PRACTICAL_QUESTION_BANK[0].problemStatement,
      questionType: PRACTICAL_QUESTION_BANK[0].practicalType,
      marks: PRACTICAL_QUESTION_BANK[0].marks,
      constraints: [...PRACTICAL_QUESTION_BANK[0].constraints],
      starterFiles: PRACTICAL_QUESTION_BANK[0].starterFiles.map((f) => ({ ...f })),
      rubric: PRACTICAL_QUESTION_BANK[0].rubric.map((r) => ({ ...r })),
    },
  ]);

  // Practical Bank Modal State
  const [showPracticalModal, setShowPracticalModal] = useState(false);
  const [practicalModalSubject, setPracticalModalSubject] = useState('ALL');
  const [practicalModalDifficulty, setPracticalModalDifficulty] = useState('ALL');
  const [practicalSearch, setPracticalSearch] = useState('');

  // Active Starter File Tab per practical question
  const [activeFileTab, setActiveFileTab] = useState<Record<string, number>>({});

  // CS MCQ Question Bank Assistant State
  const [bankSubject, setBankSubject] = useState<string>('ALL');
  const [bankDifficulty, setBankDifficulty] = useState<string>('MIXED');
  const [bankCount, setBankCount] = useState<number>(5);
  const [showBankModal, setShowBankModal] = useState<boolean>(false);
  const [bankSearch, setBankSearch] = useState<string>('');
  const [modalSubject, setModalSubject] = useState<string>('ALL');
  const [modalDifficulty, setModalDifficulty] = useState<string>('ALL');
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());
  const [bankFeedback, setBankFeedback] = useState<string | null>(null);

  // Initial MCQ Question
  const [mcqQuestions, setMcqQuestions] = useState<McqQuestionDraft[]>([
    {
      id: 'q_1',
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

  const generateAccessCode = () => {
    const prefix = examType === 'PRACTICAL' ? 'LAB-' : 'PRC-';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = prefix;
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAccessCode(code);
  };

  // Add Custom Practical Question
  const addPracticalQuestion = () => {
    const newId = `prac_${Date.now()}`;
    setPracticalQuestions((prev) => [
      ...prev,
      {
        id: newId,
        title: 'New Practical Laboratory Task',
        problemStatement: 'Enter detailed task specifications, input requirements, and expected functionality...',
        questionType: 'PRACTICAL_WEB',
        marks: 25,
        constraints: ['Strict adherence to problem specification.'],
        starterFiles: [
          { filename: 'index.html', language: 'html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Practical Task</title>\n</head>\n<body>\n  <h1>Exam Workstation</h1>\n</body>\n</html>' },
          { filename: 'style.css', language: 'css', content: '/* Custom Styles */\nbody { font-family: sans-serif; margin: 20px; }' },
          { filename: 'script.js', language: 'javascript', content: '// Student implementation\nconsole.log("ExamGuard Active");' },
        ],
        rubric: [
          { criteria: 'Implementation logic & syntactic correctness', marks: 15 },
          { criteria: 'Validation & edge-case handling', marks: 10 },
        ],
      },
    ]);
  };

  const removePracticalQuestion = (index: number) => {
    if (practicalQuestions.length <= 1) {
      alert('A practical examination must have at least one task.');
      return;
    }
    setPracticalQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Import practical item from bank
  const handleImportPractical = (item: PracticalBankItem) => {
    const newDraft: PracticalQuestionDraft = {
      id: `prac_imported_${Date.now()}`,
      title: item.title,
      problemStatement: item.problemStatement,
      questionType: item.practicalType,
      marks: item.marks,
      constraints: [...item.constraints],
      starterFiles: item.starterFiles.map((f) => ({ ...f })),
      rubric: item.rubric.map((r) => ({ ...r })),
    };

    // If initial task was blank, replace it; else append
    if (
      practicalQuestions.length === 1 &&
      practicalQuestions[0].title === 'New Practical Laboratory Task'
    ) {
      setPracticalQuestions([newDraft]);
    } else {
      setPracticalQuestions((prev) => [...prev, newDraft]);
    }

    // Automatically incorporate whitelisted resources from the item if not present
    if (item.whitelistedResources && item.whitelistedResources.length > 0) {
      setAllowedResources((existing) => {
        const existingUrls = new Set(existing.map((r) => r.url));
        const toAdd = item.whitelistedResources.filter((r) => !existingUrls.has(r.url));
        return [...existing, ...toAdd];
      });
    }

    setShowPracticalModal(false);
  };

  // Resource Management
  const handleAddCustomResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceTitle.trim() || !newResourceUrl.trim()) return;

    let formattedUrl = newResourceUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setAllowedResources((prev) => [
      ...prev,
      {
        title: newResourceTitle.trim(),
        url: formattedUrl,
        description: newResourceDesc.trim() || 'Custom whitelisted documentation reference',
        category: 'DOCUMENTATION',
      },
    ]);

    setNewResourceTitle('');
    setNewResourceUrl('');
    setNewResourceDesc('');
    setShowAddResource(false);
  };

  const handleRemoveResource = (url: string) => {
    setAllowedResources((prev) => prev.filter((r) => r.url !== url));
  };

  // MCQ Handlers
  const addMcqQuestion = () => {
    const newId = `q_${Date.now()}`;
    setMcqQuestions((prev) => [
      ...prev,
      {
        id: newId,
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

  const handleAutoGenerateMcqs = () => {
    const generated = autoGenerateQuestions({
      subject: bankSubject,
      difficulty: bankDifficulty,
      count: bankCount,
    });

    const newDrafts: McqQuestionDraft[] = generated.map((bq, idx) => ({
      id: `bank_${Date.now()}_${idx}`,
      questionText: bq.questionText,
      marks: bq.defaultMarks,
      negativeMarks: 0,
      options: bq.options.map((opt) => ({ ...opt })),
      correctOptionId: bq.correctOptionId,
      explanation: bq.explanation,
    }));

    if (
      mcqQuestions.length === 1 &&
      !mcqQuestions[0].questionText.trim() &&
      !mcqQuestions[0].options[0].text.trim()
    ) {
      setMcqQuestions(newDrafts);
    } else {
      setMcqQuestions((prev) => [...prev, ...newDrafts]);
    }

    setBankFeedback(
      `Generated ${newDrafts.length} ${bankDifficulty} questions from ${bankSubject === 'ALL' ? 'CS Fundamentals' : bankSubject}.`
    );
    setTimeout(() => setBankFeedback(null), 4500);
  };

  const handleAddSelectedFromBank = () => {
    const questionsToAdd = CS_QUESTION_BANK.filter((bq) => selectedBankIds.has(bq.id));
    const newDrafts: McqQuestionDraft[] = questionsToAdd.map((bq, idx) => ({
      id: `bank_${Date.now()}_${idx}`,
      questionText: bq.questionText,
      marks: bq.defaultMarks,
      negativeMarks: 0,
      options: bq.options.map((opt) => ({ ...opt })),
      correctOptionId: bq.correctOptionId,
      explanation: bq.explanation,
    }));

    if (
      mcqQuestions.length === 1 &&
      !mcqQuestions[0].questionText.trim() &&
      !mcqQuestions[0].options[0].text.trim()
    ) {
      setMcqQuestions(newDrafts);
    } else {
      setMcqQuestions((prev) => [...prev, ...newDrafts]);
    }

    setShowBankModal(false);
    setSelectedBankIds(new Set());
    setBankFeedback(`Added ${newDrafts.length} selected questions to your assessment.`);
    setTimeout(() => setBankFeedback(null), 4500);
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Assessment Title is required.');
      return;
    }

    if (!accessCode.trim()) {
      setError('Access Code is required.');
      return;
    }

    let payloadQuestions: any[] = [];

    if (examType === 'PRACTICAL') {
      if (practicalQuestions.length === 0) {
        setError('At least one practical task is required.');
        return;
      }

      for (let i = 0; i < practicalQuestions.length; i++) {
        const pq = practicalQuestions[i];
        if (!pq.title.trim() || !pq.problemStatement.trim()) {
          setError(`Practical Task #${i + 1} must have a title and problem statement.`);
          return;
        }
        if (!pq.starterFiles || pq.starterFiles.length === 0) {
          setError(`Practical Task #${i + 1} must contain at least one starter file.`);
          return;
        }
      }

      payloadQuestions = practicalQuestions.map((pq, idx) => ({
        orderIndex: idx,
        questionText: `${pq.title}\n\n${pq.problemStatement}`,
        marks: Number(pq.marks) || 25,
        negativeMarks: 0,
        questionType: pq.questionType,
        starterFiles: pq.starterFiles,
        testCases: pq.constraints || [],
        rubric: pq.rubric || [],
        options: [],
        correctOptionId: 'A',
        explanation: pq.constraints.join('; '),
      }));
    } else {
      if (mcqQuestions.length === 0) {
        setError('At least one MCQ question is required.');
        return;
      }

      for (let i = 0; i < mcqQuestions.length; i++) {
        const q = mcqQuestions[i];
        if (!q.questionText.trim()) {
          setError(`MCQ Question #${i + 1} is missing question text.`);
          return;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text.trim()) {
            setError(`Question #${i + 1}, Option ${q.options[j].id} cannot be empty.`);
            return;
          }
        }
      }

      payloadQuestions = mcqQuestions.map((q, idx) => ({
        orderIndex: idx,
        questionText: q.questionText,
        marks: Number(q.marks) || 1,
        negativeMarks: Number(q.negativeMarks) || 0,
        questionType: 'MCQ',
        options: q.options,
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
      }));
    }

    setLoading(true);
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          accessCode,
          examType,
          subjectCode,
          labName,
          batchName,
          allowedResources,
          durationMinutes,
          perQuestionTimer: examType === 'MCQ' ? perQuestionTimer : false,
          secondsPerQuestion,
          passingPercentage,
          showResultImmediately,
          maxViolationsAllowed,
          requireCamera,
          requireMicrophone,
          requireFullscreen,
          shuffleQuestions: examType === 'MCQ' ? shuffleQuestions : false,
          questions: payloadQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create assessment');
      }

      router.push('/teacher');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '48px 0' }}>
        <div className="container-narrow">
          {/* Back Navigation */}
          <div style={{ marginBottom: '28px' }}>
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
              <span>Back to Teacher Dashboard</span>
            </Link>
          </div>

          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.78rem' }}>ExamGuard Core Architecture</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.78rem' }}>Laboratory Integrity</span>
            </div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>Create Examination</h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px' }}>
              Conduct modern practical laboratory exams with multi-file code workstations, whitelisted documentation access, and tamper-proof forensic telemetry.
            </p>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '14px 18px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                marginBottom: '28px',
              }}
            >
              <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Examination Format Switcher */}
            <div className="glass-panel" style={{ padding: '24px 32px', background: '#ffffff' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Select Examination Type *
                </label>
                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                  Choose whether this assessment is an in-laboratory practical coding exam or a standardized objective quiz.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Practical Exam Format */}
                <div
                  onClick={() => {
                    setExamType('PRACTICAL');
                    if (!accessCode || accessCode.startsWith('PRC-')) generateAccessCode();
                  }}
                  style={{
                    padding: '20px',
                    borderRadius: '10px',
                    border: examType === 'PRACTICAL' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: examType === 'PRACTICAL' ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Terminal style={{ width: '20px', height: '20px', color: examType === 'PRACTICAL' ? '#0284c7' : '#64748b' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a' }}>
                        Practical Laboratory Examination
                      </span>
                    </div>
                    {examType === 'PRACTICAL' ? (
                      <CheckCircle2 style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                    ) : (
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                    In-browser code editor, live HTML/CSS output preview, starter repository files, and whitelisted technical documentation browser.
                  </p>
                </div>

                {/* MCQ Assessment Format */}
                <div
                  onClick={() => {
                    setExamType('MCQ');
                    if (!accessCode || accessCode.startsWith('LAB-')) generateAccessCode();
                  }}
                  style={{
                    padding: '20px',
                    borderRadius: '10px',
                    border: examType === 'MCQ' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: examType === 'MCQ' ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText style={{ width: '20px', height: '20px', color: examType === 'MCQ' ? '#0284c7' : '#64748b' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a' }}>
                        Objective MCQ Assessment
                      </span>
                    </div>
                    {examType === 'MCQ' ? (
                      <CheckCircle2 style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                    ) : (
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                    Standardized timed multiple choice questions with options, per-question timers, and CS question bank assistance.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. General & Laboratory Details */}
            <div className="glass-panel" style={{ padding: '32px', background: '#ffffff' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                <span>1. General &amp; Laboratory Details</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Examination Title *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Web Technologies End-Semester Practical Examination"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Examination Instructions &amp; Lab Guidelines
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Enter instructions, laboratory conduct guidelines, and permitted resources..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* College Lab Station Configurations */}
                {examType === 'PRACTICAL' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        Subject Code *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. WT-301 or CS-204"
                        value={subjectCode}
                        onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                        style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        Computer Laboratory / Room *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Lab 3 — Web Architecture Lab"
                        value={labName}
                        onChange={(e) => setLabName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        Student Batch Identifier *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Batch A1 (Roll 1-35)"
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                      Access Code *
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. LAB-WT01"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.04em' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={generateAccessCode}
                        className="btn-secondary"
                        style={{ padding: '0 16px', whiteSpace: 'nowrap', fontSize: '0.85rem' }}
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                      Passing Grade (%)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      max={100}
                      value={passingPercentage}
                      onChange={(e) => setPassingPercentage(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Timing & Proctoring Configuration */}
            <div className="glass-panel" style={{ padding: '32px', background: '#ffffff' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock style={{ width: '18px', height: '18px', color: '#059669' }} />
                <span>2. Timing &amp; Proctoring Configuration</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Active Timing Setup */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    Exam Duration (Minutes) *
                  </label>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '14px' }}>
                    Candidates have a master countdown for their practical laboratory tasks.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                    {[30, 45, 60, 90, 120, 180].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: durationMinutes === mins ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                          background: durationMinutes === mins ? '#f0f9ff' : '#ffffff',
                          color: durationMinutes === mins ? '#0284c7' : '#475569',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {mins} mins {mins === 60 ? '(1 hr)' : mins === 120 ? '(2 hrs - Standard Lab)' : ''}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="number"
                      className="form-input"
                      min={5}
                      max={360}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Math.max(5, Number(e.target.value)))}
                      style={{ maxWidth: '160px' }}
                    />
                    <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>Minutes total duration</span>
                  </div>
                </div>

                {/* Result Publication Mode */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    Result Publication &amp; Scorecard Delivery *
                  </label>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '16px' }}>
                    Determine whether candidates see their practical submission verification immediately or upon teacher audit.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div
                      onClick={() => setShowResultImmediately(true)}
                      style={{
                        padding: '20px',
                        borderRadius: '10px',
                        border: showResultImmediately ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: showResultImmediately ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Award style={{ width: '20px', height: '20px', color: showResultImmediately ? '#0284c7' : '#64748b' }} />
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Direct Screen Result</span>
                        </div>
                        {showResultImmediately ? (
                          <CheckCircle2 style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                        ) : (
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1' }} />
                        )}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                        Candidate receives code submission receipt, preliminary checks, and violation audit log immediately upon submission.
                      </p>
                    </div>

                    <div
                      onClick={() => setShowResultImmediately(false)}
                      style={{
                        padding: '20px',
                        borderRadius: '10px',
                        border: !showResultImmediately ? '2px solid #059669' : '1px solid #e2e8f0',
                        background: !showResultImmediately ? '#ecfdf5' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Mail style={{ width: '20px', height: '20px', color: !showResultImmediately ? '#059669' : '#64748b' }} />
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Release Later on Email / Portal</span>
                        </div>
                        {!showResultImmediately ? (
                          <CheckCircle2 style={{ width: '18px', height: '18px', color: '#059669' }} />
                        ) : (
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1' }} />
                        )}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                        Grades withheld until the invigilator verifies practical code snapshots, keystroke cadence, and test cases.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proctoring Constraints */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
                    Active Lab Telemetry Constraints
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={requireFullscreen}
                        onChange={(e) => setRequireFullscreen(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
                      />
                      <span>Enforce Fullscreen Kiosk Mode</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={requireCamera}
                        onChange={(e) => setRequireCamera(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
                      />
                      <span>Webcam Facial Telemetry</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={requireMicrophone}
                        onChange={(e) => setRequireMicrophone(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
                      />
                      <span>Audio Decibel Sensor</span>
                    </label>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.86rem', color: '#334155', fontWeight: 600 }}>Maximum Violation Tolerance:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={maxViolationsAllowed}
                      onChange={(e) => setMaxViolationsAllowed(Number(e.target.value))}
                      className="form-input"
                      style={{ maxWidth: '90px' }}
                    />
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>strikes before session termination</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Whitelisted Technical Resources (Practical Only) */}
            {examType === 'PRACTICAL' && (
              <div className="glass-panel" style={{ padding: '32px', background: '#ffffff' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                      <span>3. Whitelisted Technical Documentation References</span>
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                      Students require genuine documentation in practical exams. These URLs are accessible in the student&apos;s in-app resource browser while blocking AI chatbots and unmonitored tabs.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setAllowedResources(DEFAULT_WHITELISTED_RESOURCES)}
                      className="btn-secondary"
                      style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                    >
                      Reset to Defaults
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddResource(!showAddResource)}
                      className="btn-primary"
                      style={{ padding: '7px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={14} />
                      <span>Add Allowed URL</span>
                    </button>
                  </div>
                </div>

                {/* Add Resource Form Modal/Inline */}
                {showAddResource && (
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                      Add Permitted Technical Resource
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Resource Title *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. TailwindCSS Docs"
                          value={newResourceTitle}
                          onChange={(e) => setNewResourceTitle(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.84rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Exact URL *
                        </label>
                        <input
                          type="text"
                          placeholder="https://tailwindcss.com/docs"
                          value={newResourceUrl}
                          onChange={(e) => setNewResourceUrl(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.84rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Description
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Utility class reference"
                          value={newResourceDesc}
                          onChange={(e) => setNewResourceDesc(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.84rem' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setShowAddResource(false)}
                        className="btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomResource}
                        className="btn-primary"
                        style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                      >
                        Add to Whitelist
                      </button>
                    </div>
                  </div>
                )}

                {/* Whitelist Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {allowedResources.map((res, rIdx) => (
                    <div
                      key={res.url + rIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#e0f2fe', color: '#0369a1', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ExternalLink size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{res.title}</span>
                            <span className="badge badge-cyan" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                              {res.category}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                            {res.url}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveResource(res.url)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                        title="Remove resource"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Practical Tasks & Assessment Rubric (If Practical Selected) */}
            {examType === 'PRACTICAL' && (
              <div className="glass-panel" style={{ padding: '32px', background: '#ffffff' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Terminal style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                      <span>4. Practical Laboratory Tasks ({practicalQuestions.length})</span>
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                      Define candidate tasks, starter templates (HTML/CSS/JS, Python, SQL), constraints, and itemized evaluation rubrics.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowPracticalModal(true)}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Sparkles size={14} />
                      <span>Import from Practical Bank</span>
                    </button>
                    <button
                      type="button"
                      onClick={addPracticalQuestion}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={14} />
                      <span>Add Custom Task</span>
                    </button>
                  </div>
                </div>

                {/* Practical Tasks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  {practicalQuestions.map((pq, pqIdx) => {
                    const activeTab = activeFileTab[pq.id] || 0;

                    return (
                      <div
                        key={pq.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          padding: '24px',
                        }}
                      >
                        {/* Task Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="badge badge-cyan" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                              Practical Task #{pqIdx + 1}
                            </span>
                            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                              {pq.questionType}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Marks:</label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={pq.marks}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setPracticalQuestions((prev) => {
                                    const copy = [...prev];
                                    copy[pqIdx].marks = val;
                                    return copy;
                                  });
                                }}
                                className="form-input"
                                style={{ width: '70px', padding: '4px 8px', fontSize: '0.84rem' }}
                              />
                            </div>

                            {practicalQuestions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePracticalQuestion(pqIdx)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                                title="Delete task"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Type */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                              Task Title *
                            </label>
                            <input
                              type="text"
                              value={pq.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPracticalQuestions((prev) => {
                                  const copy = [...prev];
                                  copy[pqIdx].title = val;
                                  return copy;
                                });
                              }}
                              className="form-input"
                              placeholder="e.g. Student Registration & Validation Portal"
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                              Environment Target *
                            </label>
                            <select
                              value={pq.questionType}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setPracticalQuestions((prev) => {
                                  const copy = [...prev];
                                  copy[pqIdx].questionType = val;
                                  return copy;
                                });
                              }}
                              className="form-input"
                            >
                              <option value="PRACTICAL_WEB">Web Application (HTML/CSS/JS with Live Sandbox)</option>
                              <option value="PRACTICAL_CODE">Algorithm / Scripting (Python / C++ / Java)</option>
                              <option value="PRACTICAL_SQL">Relational Database &amp; SQL Query</option>
                            </select>
                          </div>
                        </div>

                        {/* Problem Statement */}
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Problem Statement &amp; Requirements *
                          </label>
                          <textarea
                            rows={5}
                            value={pq.problemStatement}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPracticalQuestions((prev) => {
                                const copy = [...prev];
                                copy[pqIdx].problemStatement = val;
                                return copy;
                              });
                            }}
                            className="form-input"
                            placeholder="Detailed requirements, edge cases, input/output format..."
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                          />
                        </div>

                        {/* Starter Code Files Editor */}
                        <div style={{ marginBottom: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                          <div style={{ background: '#f1f5f9', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileCode2 size={16} color="#0284c7" />
                              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>Starter Code Files</span>
                            </div>

                            {/* File Tabs */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {pq.starterFiles.map((file, fIdx) => (
                                <button
                                  key={file.filename}
                                  type="button"
                                  onClick={() => setActiveFileTab((prev) => ({ ...prev, [pq.id]: fIdx }))}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    fontFamily: 'var(--font-mono)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: activeTab === fIdx ? '#ffffff' : 'transparent',
                                    color: activeTab === fIdx ? '#0284c7' : '#64748b',
                                    boxShadow: activeTab === fIdx ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                  }}
                                >
                                  {file.filename}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Active File Editor */}
                          {pq.starterFiles[activeTab] && (
                            <div style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                                  File: <strong>{pq.starterFiles[activeTab].filename}</strong> ({pq.starterFiles[activeTab].language})
                                </span>
                              </div>
                              <textarea
                                rows={8}
                                value={pq.starterFiles[activeTab].content}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPracticalQuestions((prev) => {
                                    const copy = [...prev];
                                    const fCopy = [...copy[pqIdx].starterFiles];
                                    fCopy[activeTab] = { ...fCopy[activeTab], content: val };
                                    copy[pqIdx].starterFiles = fCopy;
                                    return copy;
                                  });
                                }}
                                className="form-input"
                                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', background: '#f8fafc' }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Evaluation Rubric Breakdown */}
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Award size={15} color="#059669" />
                            <span>Evaluation Rubric Breakdown</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {pq.rubric.map((rub, rIdx) => (
                              <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                  type="text"
                                  value={rub.criteria}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setPracticalQuestions((prev) => {
                                      const copy = [...prev];
                                      const rCopy = [...copy[pqIdx].rubric];
                                      rCopy[rIdx] = { ...rCopy[rIdx], criteria: val };
                                      copy[pqIdx].rubric = rCopy;
                                      return copy;
                                    });
                                  }}
                                  className="form-input"
                                  style={{ flex: 1, fontSize: '0.82rem', padding: '6px 10px' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={rub.marks}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setPracticalQuestions((prev) => {
                                        const copy = [...prev];
                                        const rCopy = [...copy[pqIdx].rubric];
                                        rCopy[rIdx] = { ...rCopy[rIdx], marks: val };
                                        copy[pqIdx].rubric = rCopy;
                                        return copy;
                                      });
                                    }}
                                    className="form-input"
                                    style={{ width: '60px', fontSize: '0.82rem', padding: '6px 8px' }}
                                  />
                                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>pts</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. MCQ Questions (If MCQ Format Selected) */}
            {examType === 'MCQ' && (
              <div className="glass-panel" style={{ padding: '32px', background: '#ffffff' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HelpCircle style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                      <span>4. Objective MCQ Questions ({mcqQuestions.length})</span>
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                      Configure multiple-choice questions or auto-generate from the CS Question Bank.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowBankModal(true)}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <BookOpen style={{ width: '15px', height: '15px' }} />
                      <span>Browse MCQ Bank</span>
                    </button>
                    <button
                      type="button"
                      onClick={addMcqQuestion}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus style={{ width: '16px', height: '16px' }} />
                      <span>Add Custom MCQ</span>
                    </button>
                  </div>
                </div>

                {/* Question Bank Smart Generator Banner */}
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '24px', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Sparkles style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0369a1' }}>
                      Engineering Question Bank: Auto-Prepare Questions
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#0c4a6e', marginBottom: '16px', lineHeight: 1.45 }}>
                    Select subject &amp; difficulty level to instantly populate your exam with curated engineering MCQs.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#0369a1', marginBottom: '4px' }}>Subject</label>
                      <select className="form-input" value={bankSubject} onChange={(e) => setBankSubject(e.target.value)} style={{ fontSize: '0.84rem', padding: '8px 12px', background: '#ffffff' }}>
                        <option value="ALL">All CS Fundamentals</option>
                        {CS_SUBJECTS.map((s) => (
                          <option key={s.key} value={s.key}>{s.name} ({s.key})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#0369a1', marginBottom: '4px' }}>Difficulty Level</label>
                      <select className="form-input" value={bankDifficulty} onChange={(e) => setBankDifficulty(e.target.value)} style={{ fontSize: '0.84rem', padding: '8px 12px', background: '#ffffff' }}>
                        <option value="MIXED">Mixed (40% Easy, 40% Med, 20% Hard)</option>
                        <option value="Easy">Easy (Core Principles)</option>
                        <option value="Medium">Medium (Mechanics &amp; Logic)</option>
                        <option value="Hard">Hard (Deep Concurrency &amp; Edge Cases)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#0369a1', marginBottom: '4px' }}>Quantity</label>
                      <select className="form-input" value={bankCount} onChange={(e) => setBankCount(Number(e.target.value))} style={{ fontSize: '0.84rem', padding: '8px 12px', background: '#ffffff' }}>
                        <option value={3}>3 Questions</option>
                        <option value={5}>5 Questions (Standard)</option>
                        <option value={10}>10 Questions</option>
                      </select>
                    </div>

                    <button type="button" onClick={handleAutoGenerateMcqs} className="btn-primary" style={{ padding: '9px 16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Sparkles size={14} />
                      <span>Generate</span>
                    </button>
                  </div>

                  {bankFeedback && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                      <CheckCircle2 size={14} />
                      <span>{bankFeedback}</span>
                    </div>
                  )}
                </div>

                {/* MCQs List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {mcqQuestions.map((q, qIndex) => (
                    <div key={q.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.8rem' }}>Question {qIndex + 1}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Marks:</label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={q.marks}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setMcqQuestions((prev) => {
                                  const copy = [...prev];
                                  copy[qIndex].marks = val;
                                  return copy;
                                });
                              }}
                              className="form-input"
                              style={{ width: '60px', padding: '4px 8px', fontSize: '0.84rem' }}
                            />
                          </div>

                          {mcqQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setMcqQuestions((prev) => prev.filter((_, i) => i !== qIndex))}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                              title="Delete Question"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <textarea
                          rows={2}
                          className="form-input"
                          placeholder="Enter your MCQ problem statement..."
                          value={q.questionText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMcqQuestions((prev) => {
                              const copy = [...prev];
                              copy[qIndex].questionText = val;
                              return copy;
                            });
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                        {q.options.map((opt, optIndex) => (
                          <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px' }}>
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={q.correctOptionId === opt.id}
                              onChange={() => {
                                setMcqQuestions((prev) => {
                                  const copy = [...prev];
                                  copy[qIndex].correctOptionId = opt.id;
                                  return copy;
                                });
                              }}
                              style={{ accentColor: '#059669', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569', minWidth: '16px' }}>{opt.id}</span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMcqQuestions((prev) => {
                                  const copy = [...prev];
                                  const opts = [...copy[qIndex].options];
                                  opts[optIndex] = { ...opts[optIndex], text: val };
                                  copy[qIndex].options = opts;
                                  return copy;
                                });
                              }}
                              placeholder={`Option ${opt.id}`}
                              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', background: 'transparent' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' }}>
              <Link href="/teacher" className="btn-secondary" style={{ padding: '12px 24px' }}>
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ padding: '12px 32px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Creating Examination...' : examType === 'PRACTICAL' ? 'Create Practical Lab Exam' : 'Create Assessment'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Practical Bank Modal */}
      {showPracticalModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal style={{ width: '22px', height: '22px', color: '#0284c7' }} />
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    Engineering Practical Question Bank
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                    Select curated laboratory tasks complete with starter files, whitelisted references, and rubrics.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPracticalModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search practical problems..."
                  value={practicalSearch}
                  onChange={(e) => setPracticalSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '32px', fontSize: '0.84rem' }}
                />
              </div>

              <select
                value={practicalModalSubject}
                onChange={(e) => setPracticalModalSubject(e.target.value)}
                className="form-input"
                style={{ maxWidth: '180px', fontSize: '0.84rem' }}
              >
                <option value="ALL">All Subjects</option>
                {PRACTICAL_SUBJECTS.map((s) => (
                  <option key={s.key} value={s.key}>{s.key} - {s.name.split(' ')[0]}</option>
                ))}
              </select>

              <select
                value={practicalModalDifficulty}
                onChange={(e) => setPracticalModalDifficulty(e.target.value)}
                className="form-input"
                style={{ maxWidth: '140px', fontSize: '0.84rem' }}
              >
                <option value="ALL">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Problems list */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
              {(() => {
                const filtered = filterPracticalBank({
                  subject: practicalModalSubject,
                  difficulty: practicalModalDifficulty,
                  searchQuery: practicalSearch,
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                      No practical problems matched your filter.
                    </div>
                  );
                }

                return filtered.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '18px',
                      background: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                          <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>{item.subject}</span>
                          <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>{item.difficulty}</span>
                          <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>{item.practicalType}</span>
                          <span style={{ fontSize: '0.72rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            {item.marks} Marks
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
                          {item.title}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportPractical(item)}
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                      >
                        Import to Exam
                      </button>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.45, whiteSpace: 'pre-line', marginBottom: '10px' }}>
                      {item.problemStatement.slice(0, 240)}...
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: '#64748b' }}>
                      <span>Starter Files: <strong>{item.starterFiles.map((f) => f.filename).join(', ')}</strong></span>
                      <span>Rubric items: <strong>{item.rubric.length}</strong></span>
                      <span>Whitelisted references: <strong>{item.whitelistedResources.length}</strong></span>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowPracticalModal(false)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CS MCQ Bank Modal */}
      {showBankModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen style={{ width: '22px', height: '22px', color: '#0284c7' }} />
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    Computer Science MCQ Question Bank
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                    Select questions across CS fundamentals to populate your assessment.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBankModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search questions or topics..."
                  className="form-input"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  style={{ paddingLeft: '32px', fontSize: '0.84rem' }}
                />
              </div>

              <select
                className="form-input"
                value={modalSubject}
                onChange={(e) => setModalSubject(e.target.value)}
                style={{ maxWidth: '170px', fontSize: '0.84rem' }}
              >
                <option value="ALL">All Subjects</option>
                {CS_SUBJECTS.map((s) => (
                  <option key={s.key} value={s.key}>{s.key} - {s.name.split(' ')[0]}</option>
                ))}
              </select>

              <select
                className="form-input"
                value={modalDifficulty}
                onChange={(e) => setModalDifficulty(e.target.value)}
                style={{ maxWidth: '140px', fontSize: '0.84rem' }}
              >
                <option value="ALL">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                const filtered = filterQuestionBank({
                  subject: modalSubject,
                  difficulty: modalDifficulty,
                  search: bankSearch,
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                      No questions matched your search criteria.
                    </div>
                  );
                }

                return filtered.map((bq) => {
                  const isSelected = selectedBankIds.has(bq.id);
                  return (
                    <div
                      key={bq.id}
                      onClick={() => {
                        setSelectedBankIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(bq.id)) next.delete(bq.id);
                          else next.add(bq.id);
                          return next;
                        });
                      }}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0f9ff' : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ marginTop: '4px', width: '16px', height: '16px', accentColor: '#0284c7' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                            <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>{bq.subject}</span>
                            <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>{bq.difficulty}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                              {bq.topic}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginBottom: '10px' }}>
                            {bq.questionText}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.86rem', color: '#64748b' }}>
                Selected: <strong>{selectedBankIds.size}</strong> question{selectedBankIds.size === 1 ? '' : 's'}
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.86rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSelectedFromBank}
                  disabled={selectedBankIds.size === 0}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.86rem', opacity: selectedBankIds.size === 0 ? 0.5 : 1 }}
                >
                  Add Selected to Exam ({selectedBankIds.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
