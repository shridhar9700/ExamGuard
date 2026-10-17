'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Clock,
  Terminal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  FileCode2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Award,
  Layers,
  ClipboardPaste,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Keyboard,
  Gauge,
  X,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import { EvaluationCriterion } from '@/lib/practicalBank';
import { CodeSnapshotRecord, KeystrokeMetricsSummary, PasteEventRecord } from '@/lib/keystrokeTelemetry';

interface ForensicAuditModalProps {
  attemptId: string;
  assessmentTitle: string;
  rubric: EvaluationCriterion[];
  onClose: () => void;
  onGraded?: (updatedAttempt: any) => void;
}

export default function ForensicAuditModal({
  attemptId,
  assessmentTitle,
  rubric,
  onClose,
  onGraded,
}: ForensicAuditModalProps) {
  const [loading, setLoading] = useState(true);
  const [attemptData, setAttemptData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'CADENCE' | 'RUBRIC' | 'VIOLATIONS'>('TIMELINE');

  // Timeline scrubber state
  const [snapshots, setSnapshots] = useState<CodeSnapshotRecord[]>([]);
  const [activeSnapshotIdx, setActiveSnapshotIdx] = useState(0);
  const [activeSnapshotFile, setActiveSnapshotFile] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rubric Grading state
  const [rubricScores, setRubricScores] = useState<Record<number, number>>({});
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [isPassed, setIsPassed] = useState(true);
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeSuccessMsg, setGradeSuccessMsg] = useState<string | null>(null);

  // Fetch full telemetry and attempt details
  useEffect(() => {
    fetch(`/api/attempts/${attemptId}/telemetry`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load telemetry');
        return res.json();
      })
      .then((data) => {
        setAttemptData(data);
        const snaps: CodeSnapshotRecord[] = Array.isArray(data.codeSnapshots)
          ? data.codeSnapshots
          : [];
        setSnapshots(snaps);
        if (snaps.length > 0) {
          setActiveSnapshotIdx(snaps.length - 1); // Default to latest snapshot
        }
      })
      .catch((err) => {
        console.error('Error fetching forensic telemetry:', err);
      })
      .finally(() => setLoading(false));

    // Also fetch current attempt evaluation status
    fetch(`/api/attempts/${attemptId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.attempt) {
          setTeacherRemarks(data.attempt.teacherFeedback || '');
          setIsPassed(data.attempt.passed);
          // Initialize rubric scores if total marks matches
          const initialScores: Record<number, number> = {};
          rubric.forEach((r, idx) => {
            initialScores[idx] = r.marks;
          });
          setRubricScores(initialScores);
        }
      })
      .catch((err) => console.error(err));
  }, [attemptId, rubric]);

  // Timeline Auto-play effect
  useEffect(() => {
    if (isPlaying && snapshots.length > 1) {
      playIntervalRef.current = setInterval(() => {
        setActiveSnapshotIdx((prev) => {
          if (prev >= snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1400);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, snapshots.length]);

  const currentSnapshot: CodeSnapshotRecord | undefined = snapshots[activeSnapshotIdx];
  const currentSnapshotFiles = currentSnapshot?.files || [];
  const currentFileRecord = currentSnapshotFiles[activeSnapshotFile] || currentSnapshotFiles[0];

  // Telemetry metrics
  const keystrokeMetrics: KeystrokeMetricsSummary | undefined = attemptData?.keystrokeMetrics;
  const pasteEvents: PasteEventRecord[] = keystrokeMetrics?.pasteEvents || [];
  const violationLogs: any[] = Array.isArray(attemptData?.violationLogs) ? attemptData.violationLogs : [];

  // Rubric score calculation
  const totalRubricMarks = rubric.reduce((acc, r) => acc + r.marks, 0);
  const currentEarnedMarks = Object.values(rubricScores).reduce((acc, val) => acc + val, 0);
  const calculatedPercentage = totalRubricMarks > 0 ? Math.round((currentEarnedMarks / totalRubricMarks) * 100) : 0;

  // Save Grading Handler
  const handleSaveGrading = async () => {
    setSavingGrade(true);
    setGradeSuccessMsg(null);
    try {
      const res = await fetch(`/api/attempts/${attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: currentEarnedMarks,
          totalMarks: totalRubricMarks,
          percentage: calculatedPercentage,
          passed: isPassed,
          teacherFeedback: teacherRemarks,
          isVerifiedByTeacher: true,
        }),
      });

      if (!res.ok) throw new Error('Grading submission failed');
      const data = await res.json();
      setGradeSuccessMsg('Evaluation rubric scores and forensic verification sign-off saved.');
      if (onGraded) onGraded(data.attempt);
      setTimeout(() => setGradeSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to save evaluation marks. Please try again.');
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '1240px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: '#0f172a',
            color: '#ffffff',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  Practical Forensic Verification &amp; Audit Trail
                </h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '1px 7px' }}>
                  EXAMGUARD
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px', display: 'flex', gap: '10px' }}>
                <span>Candidate: <strong>{attemptData?.student?.name || 'Candidate'}</strong> ({attemptData?.student?.email || 'N/A'})</span>
                <span>•</span>
                <span>Station: <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{attemptData?.labStation || 'PC-01'}</strong></span>
                <span>•</span>
                <span>Exam: {assessmentTitle}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Integrity Status Pill */}
            {keystrokeMetrics && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  background:
                    keystrokeMetrics.integrityRating === 'SUSPICIOUS_PASTE'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : keystrokeMetrics.integrityRating === 'ANOMALOUS_BURST'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(16, 185, 129, 0.2)',
                  color:
                    keystrokeMetrics.integrityRating === 'SUSPICIOUS_PASTE'
                      ? '#f87171'
                      : keystrokeMetrics.integrityRating === 'ANOMALOUS_BURST'
                      ? '#fbbf24'
                      : '#34d399',
                  border:
                    keystrokeMetrics.integrityRating === 'SUSPICIOUS_PASTE'
                      ? '1px solid #ef4444'
                      : keystrokeMetrics.integrityRating === 'ANOMALOUS_BURST'
                      ? '1px solid #f59e0b'
                      : '1px solid #10b981',
                }}
              >
                {keystrokeMetrics.integrityRating === 'SUSPICIOUS_PASTE' ? (
                  <ShieldAlert size={14} />
                ) : (
                  <ShieldCheck size={14} />
                )}
                <span>Cadence: {keystrokeMetrics.organicCadenceScore}% ({keystrokeMetrics.integrityRating})</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('TIMELINE')}
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
                background: activeTab === 'TIMELINE' ? '#0284c7' : '#ffffff',
                color: activeTab === 'TIMELINE' ? '#ffffff' : '#475569',
                boxShadow: activeTab === 'TIMELINE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: activeTab === 'TIMELINE' ? '#0284c7' : '#cbd5e1',
              }}
            >
              <Clock size={14} />
              <span>Time-Lapse Code Timeline ({snapshots.length} Snaps)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CADENCE')}
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
                background: activeTab === 'CADENCE' ? '#0284c7' : '#ffffff',
                color: activeTab === 'CADENCE' ? '#ffffff' : '#475569',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: activeTab === 'CADENCE' ? '#0284c7' : '#cbd5e1',
              }}
            >
              <Activity size={14} />
              <span>Keystroke Forensics &amp; Pastes ({pasteEvents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RUBRIC')}
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
                background: activeTab === 'RUBRIC' ? '#0284c7' : '#ffffff',
                color: activeTab === 'RUBRIC' ? '#ffffff' : '#475569',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: activeTab === 'RUBRIC' ? '#0284c7' : '#cbd5e1',
              }}
            >
              <Award size={14} />
              <span>Evaluation Sheet ({currentEarnedMarks}/{totalRubricMarks} pts)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('VIOLATIONS')}
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
                background: activeTab === 'VIOLATIONS' ? '#0284c7' : '#ffffff',
                color: activeTab === 'VIOLATIONS' ? '#ffffff' : '#475569',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: activeTab === 'VIOLATIONS' ? '#0284c7' : '#cbd5e1',
              }}
            >
              <AlertTriangle size={14} />
              <span>Boundary Strikes ({violationLogs.length})</span>
            </button>
          </div>

          {/* Quick status stamp */}
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Candidate Status: <strong style={{ color: '#0f172a' }}>{attemptData?.status || 'SUBMITTED'}</strong>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
              <div className="pulse-dot" style={{ width: '16px', height: '16px' }} />
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Compiling forensic timeline and telemetry logs...</p>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* TAB 1: INTERACTIVE TIME-LAPSE CODE TIMELINE PLAYER      */}
              {/* ======================================================== */}
              {activeTab === 'TIMELINE' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Timeline Control Scrubber Bar */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderBottom: '1px solid #e2e8f0',
                      padding: '12px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Playback Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveSnapshotIdx(0)}
                          disabled={activeSnapshotIdx === 0}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          title="Jump to Start"
                        >
                          <SkipBack size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSnapshotIdx((prev) => Math.max(0, prev - 1))}
                          disabled={activeSnapshotIdx === 0}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          title="Previous Snapshot"
                        >
                          <ChevronLeft size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsPlaying(!isPlaying)}
                          disabled={snapshots.length <= 1}
                          className={isPlaying ? 'btn-danger' : 'btn-primary'}
                          style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                        >
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                          <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveSnapshotIdx((prev) => Math.min(snapshots.length - 1, prev + 1))}
                          disabled={activeSnapshotIdx >= snapshots.length - 1}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          title="Next Snapshot"
                        >
                          <ChevronRight size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSnapshotIdx(snapshots.length - 1)}
                          disabled={activeSnapshotIdx >= snapshots.length - 1}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          title="Jump to Final Code"
                        >
                          <SkipForward size={13} />
                        </button>

                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '12px' }}>
                          Snapshot <strong>{activeSnapshotIdx + 1}</strong> of <strong>{snapshots.length}</strong>
                        </span>
                      </div>

                      {/* Snapshot Telemetry Telemetry Pill */}
                      {currentSnapshot && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.76rem', color: '#334155' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} color="#0284c7" />
                            <span>Elapsed: <strong>{Math.floor((currentSnapshot.elapsedSeconds || 0) / 60)}m {((currentSnapshot.elapsedSeconds || 0) % 60)}s</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Keyboard size={13} color="#0284c7" />
                            <span>Keystrokes: <strong>{currentSnapshot.totalKeystrokesAtSnapshot?.toLocaleString() || 0}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Gauge size={13} color="#a855f7" />
                            <span>WPM: <strong>{currentSnapshot.wpmAtSnapshot || 0}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 700, color: currentSnapshot.deltaCharCount > 100 ? '#dc2626' : currentSnapshot.deltaCharCount >= 0 ? '#059669' : '#dc2626' }}>
                              Δ {currentSnapshot.deltaCharCount > 0 ? `+${currentSnapshot.deltaCharCount}` : currentSnapshot.deltaCharCount} chars
                            </span>
                          </div>
                          {currentSnapshot.flag && (
                            <span className="badge badge-crimson" style={{ fontSize: '0.68rem' }}>
                              {currentSnapshot.flag}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timeline Slider Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, snapshots.length - 1)}
                        value={activeSnapshotIdx}
                        onChange={(e) => setActiveSnapshotIdx(Number(e.target.value))}
                        style={{
                          flex: 1,
                          height: '6px',
                          accentColor: '#0284c7',
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                  </div>

                  {/* Code Snapshot File Viewer */}
                  {snapshots.length === 0 ? (
                    <div style={{ flex: 1, padding: '48px', textAlign: 'center', color: '#64748b' }}>
                      No incremental code snapshots were recorded for this attempt.
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      {/* File Tabs at Snapshot */}
                      <div style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', padding: '6px 16px', display: 'flex', gap: '4px' }}>
                        {currentSnapshotFiles.map((f, idx) => (
                          <button
                            key={f.filename || idx}
                            type="button"
                            onClick={() => setActiveSnapshotFile(idx)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '5px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                              background: activeSnapshotFile === idx ? '#ffffff' : 'transparent',
                              color: activeSnapshotFile === idx ? '#0284c7' : '#64748b',
                              boxShadow: activeSnapshotFile === idx ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <FileCode2 size={13} />
                            <span>{f.filename}</span>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>({f.length || f.content?.length || 0} chars)</span>
                          </button>
                        ))}
                      </div>

                      {/* Code Content Display */}
                      <div style={{ flex: 1, overflow: 'auto', background: '#ffffff', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.84rem', lineHeight: 1.6 }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#0f172a' }}>
                          {currentFileRecord?.content || '// No content recorded in this snapshot'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: KEYSTROKE CADENCE & CLIPBOARD PASTE INSPECTOR     */}
              {/* ======================================================== */}
              {activeTab === 'CADENCE' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Top Forensic Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Keystrokes Logged</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                        {keystrokeMetrics?.totalKeystrokes.toLocaleString() || 0}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#059669', marginTop: '4px' }}>
                        {keystrokeMetrics?.printableKeyCount || 0} Printable Keys
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Human Iterations (Backspaces)</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                        {keystrokeMetrics?.backspaceCount || 0}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
                        {keystrokeMetrics?.printableKeyCount
                          ? Math.round(((keystrokeMetrics.backspaceCount) / Math.max(1, keystrokeMetrics.printableKeyCount)) * 100)
                          : 0}
                        % Edit Cadence Ratio
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Typing Speed (WPM)</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
                        {keystrokeMetrics?.averageWpm || 0} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>avg</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#a855f7', marginTop: '4px' }}>
                        Max Burst: {keystrokeMetrics?.maxWpmBurst || 0} WPM
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Organic Cadence Integrity</div>
                      <div
                        style={{
                          fontSize: '1.6rem',
                          fontWeight: 800,
                          color:
                            keystrokeMetrics?.integrityRating === 'SUSPICIOUS_PASTE'
                              ? '#dc2626'
                              : keystrokeMetrics?.integrityRating === 'ANOMALOUS_BURST'
                              ? '#d97706'
                              : '#059669',
                          marginTop: '6px',
                        }}
                      >
                        {keystrokeMetrics?.organicCadenceScore || 0}%
                      </div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, marginTop: '4px' }}>
                        Rating: {keystrokeMetrics?.integrityRating || 'AUTHENTIC'}
                      </div>
                    </div>
                  </div>

                  {/* Clipboard Paste Log Table */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClipboardPaste size={16} color="#0284c7" />
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          Clipboard Paste Event Telemetry ({pasteEvents.length})
                        </h4>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Pastes &gt;75 chars or multi-line are flagged as suspicious
                      </span>
                    </div>

                    {pasteEvents.length === 0 ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#059669', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} />
                        <span>Zero clipboard paste events logged. All code was authentically authored directly on the keyboard.</span>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '10px 16px' }}>Timestamp</th>
                            <th style={{ padding: '10px 16px' }}>Target File</th>
                            <th style={{ padding: '10px 16px' }}>Volume</th>
                            <th style={{ padding: '10px 16px' }}>Lines</th>
                            <th style={{ padding: '10px 16px' }}>Suspicious?</th>
                            <th style={{ padding: '10px 16px' }}>Snippet Preview</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pasteEvents.map((p, idx) => (
                            <tr key={p.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 16px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                                {new Date(p.timestamp).toLocaleTimeString()}
                              </td>
                              <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0f172a' }}>
                                {p.targetFilename}
                              </td>
                              <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                {p.charCount} chars
                              </td>
                              <td style={{ padding: '10px 16px' }}>
                                {p.lineCount}
                              </td>
                              <td style={{ padding: '10px 16px' }}>
                                {p.isSuspicious ? (
                                  <span className="badge badge-crimson" style={{ fontSize: '0.68rem' }}>
                                    Suspicious Dump
                                  </span>
                                ) : (
                                  <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                                    Normal
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: '#334155', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.snippet}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: ITEMIZED RUBRIC GRADING & VIVA VERIFICATION      */}
              {/* ======================================================== */}
              {activeTab === 'RUBRIC' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {gradeSuccessMsg && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '12px 18px', borderRadius: '8px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} />
                      <span>{gradeSuccessMsg}</span>
                    </div>
                  )}

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          Itemized Assessment Rubric
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                          Assign marks for each specified practical requirement based on the forensic evidence.
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>
                          {currentEarnedMarks} / {totalRubricMarks} pts
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          ({calculatedPercentage}%)
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {rubric.map((r, idx) => {
                        const score = rubricScores[idx] ?? r.marks;
                        return (
                          <div
                            key={idx}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '14px 18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '16px',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                                {r.criteria}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                                Max Allotted: {r.marks} marks
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input
                                type="range"
                                min={0}
                                max={r.marks}
                                step={0.5}
                                value={score}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setRubricScores((prev) => ({ ...prev, [idx]: val }));
                                }}
                                style={{ width: '120px', accentColor: '#0284c7' }}
                              />
                              <div
                                style={{
                                  width: '54px',
                                  textAlign: 'center',
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 800,
                                  fontSize: '0.88rem',
                                  color: '#0f172a',
                                }}
                              >
                                {score}
                              </div>
                              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>/ {r.marks}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Practical Viva & Examiner Remarks */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                      Examiner Viva Remarks &amp; Lab Feedback
                    </h4>
                    <textarea
                      value={teacherRemarks}
                      onChange={(e) => setTeacherRemarks(e.target.value)}
                      placeholder="Add practical assessment remarks, viva voce evaluation notes, or integrity feedback..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                        <input
                          type="checkbox"
                          checked={isPassed}
                          onChange={(e) => setIsPassed(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#059669' }}
                        />
                        <span>Candidate Passed Practical Examination</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleSaveGrading}
                        disabled={savingGrade}
                        className="btn-emerald"
                        style={{ padding: '8px 22px', fontSize: '0.86rem', fontWeight: 700 }}
                      >
                        {savingGrade ? 'Saving Grade...' : 'Save & Sign-Off Evaluation'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 4: ANTI-CHEAT BOUNDARY VIOLATION LOGS                */}
              {/* ======================================================== */}
              {activeTab === 'VIOLATIONS' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#dc2626', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={16} />
                        <span>Anti-Cheat AI Telemetry &amp; Boundary Violations ({violationLogs.length})</span>
                      </h4>
                    </div>

                    {violationLogs.length === 0 ? (
                      <div style={{ padding: '36px', textAlign: 'center', color: '#059669', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} />
                        <span>No camera, microphone, or window blur violations recorded. Full institutional compliance.</span>
                      </div>
                    ) : (
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {violationLogs.map((log: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              padding: '10px 16px',
                              borderRadius: '6px',
                              fontSize: '0.84rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: '#dc2626' }}>[{log.type || 'STRIKE'}]</span>
                              <span style={{ color: '#0f172a' }}>{log.details || 'Integrity strike'}</span>
                            </div>
                            <span style={{ color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
