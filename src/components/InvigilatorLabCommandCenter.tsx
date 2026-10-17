'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Terminal,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Bell,
  Eye,
  Award,
  Keyboard,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  Radio,
  FileCode2,
  Send,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import ForensicAuditModal from './ForensicAuditModal';
import { EvaluationCriterion } from '@/lib/practicalBank';

interface AttemptRecord {
  id: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  violationCount: number;
  violationLogs: any[];
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

interface AssessmentLabInfo {
  id: string;
  title: string;
  accessCode: string;
  durationMinutes: number;
  subjectCode?: string | null;
  labName?: string | null;
  batchName?: string | null;
  maxViolationsAllowed: number;
  totalMarks: number;
  passingPercentage: number;
  questions: {
    id: string;
    questionText: string;
    marks: number;
    questionType: string;
    rubric: EvaluationCriterion[];
  }[];
  attempts: AttemptRecord[];
}

interface InvigilatorLabCommandCenterProps {
  assessment: AssessmentLabInfo;
  onRefresh: () => void;
}

export default function InvigilatorLabCommandCenter({
  assessment,
  onRefresh,
}: InvigilatorLabCommandCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'FLAGGED' | 'SUBMITTED'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Broadcast announcement
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSentMsg, setBroadcastSentMsg] = useState<string | null>(null);

  // Selected attempt for detailed Forensic Audit Modal
  const [auditAttemptId, setAuditAttemptId] = useState<string | null>(null);

  // Auto-refresh interval (every 8 seconds)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      timer = setInterval(() => {
        setIsRefreshing(true);
        onRefresh();
        setTimeout(() => setIsRefreshing(false), 600);
      }, 8000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoRefresh, onRefresh]);

  const attempts = assessment.attempts || [];

  // Group attempts by lab station (e.g. PC-01 to PC-30)
  // Define standard institutional lab grid capacity (30 stations)
  const totalLabCapacity = 30;
  const stationMap: Record<string, AttemptRecord> = {};
  attempts.forEach((att) => {
    const stId = (att.labStation || 'PC-01').toUpperCase().trim();
    stationMap[stId] = att;
  });

  // Calculate statistics
  const activeAttempts = attempts.filter((a) => a.status === 'IN_PROGRESS');
  const submittedAttempts = attempts.filter((a) => a.status === 'SUBMITTED');
  const terminatedAttempts = attempts.filter((a) => a.status === 'TERMINATED_FOR_VIOLATION');
  const flaggedAttempts = attempts.filter((a) => {
    const rating = a.keystrokeMetrics?.integrityRating;
    return rating === 'SUSPICIOUS_PASTE' || rating === 'ANOMALOUS_BURST' || a.violationCount > 0;
  });

  // Filtered list of attempts
  const filteredAttempts = attempts.filter((att) => {
    const st = att.labStation || 'PC-01';
    const matchesSearch =
      st.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.student.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'ACTIVE') return att.status === 'IN_PROGRESS';
    if (filterMode === 'SUBMITTED') return att.status === 'SUBMITTED';
    if (filterMode === 'FLAGGED') {
      const rating = att.keystrokeMetrics?.integrityRating;
      return rating === 'SUSPICIOUS_PASTE' || rating === 'ANOMALOUS_BURST' || att.violationCount > 0;
    }
    return true;
  });

  // Handle broadcast notice
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setBroadcastSentMsg(`Announcement broadcasted to ${activeAttempts.length} active workstation(s).`);
    setBroadcastText('');
    setTimeout(() => setBroadcastSentMsg(null), 4000);
  };

  // Get first question rubric for modal
  const practicalRubric: EvaluationCriterion[] = assessment.questions?.[0]?.rubric || [
    { criteria: 'HTML5 Semantic Layout & Structure', marks: 5 },
    { criteria: 'CSS Styling, Responsiveness & Polish', marks: 5 },
    { criteria: 'Client-Side JavaScript Validation Logic', marks: 10 },
    { criteria: 'DOM State Management & Accessibility', marks: 5 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Master Lab Header Card */}
      <div
        className="glass-panel"
        style={{
          background: '#ffffff',
          padding: '24px 28px',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.74rem', padding: '2px 8px' }}>
                INVIGILATOR LAB COMMAND
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                {assessment.subjectCode || 'WT-301'}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#059669', background: 'rgba(5, 150, 105, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {assessment.batchName || 'Batch A1'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {assessment.labName || 'Computer Lab 3 — Practical Examination'}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Real-time candidate telemetry, live cadence monitoring, and digital forensic integrity audits.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Auto-Refresh Toggle */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                background: autoRefresh ? '#f0fdf4' : '#ffffff',
                color: autoRefresh ? '#15803d' : '#64748b',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Radio size={13} color={autoRefresh ? '#16a34a' : '#94a3b8'} />
              <span>Auto-Sync {autoRefresh ? '(8s)' : 'Off'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={() => {
                setIsRefreshing(true);
                onRefresh();
                setTimeout(() => setIsRefreshing(false), 600);
              }}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} style={{ transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }} />
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        {/* Lab Metrics Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Total Lab Terminals</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {attempts.length} / {totalLabCapacity}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Occupied Workstations</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Active Authors</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
              {activeAttempts.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#0284c7' }}>Typing Code Live</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Cadence Flagged</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: flaggedAttempts.length > 0 ? '#dc2626' : '#059669', marginTop: '2px' }}>
              {flaggedAttempts.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: flaggedAttempts.length > 0 ? '#dc2626' : '#059669' }}>
              {flaggedAttempts.length > 0 ? 'Requires Forensic Review' : 'Zero Suspicious Pastes'}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Final Submissions</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {submittedAttempts.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#059669' }}>Code Bundles Saved</div>
          </div>
        </div>

        {/* Broadcast Bar */}
        <form onSubmit={handleSendBroadcast} style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Bell size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="Broadcast notice to all lab candidate workstations (e.g., '15 minutes remaining, test in live preview')..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Send size={13} />
            <span>Broadcast</span>
          </button>
        </form>

        {broadcastSentMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={13} />
            <span>{broadcastSentMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Filter & Search Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: filterMode === 'ALL' ? '#0f172a' : '#ffffff',
              color: filterMode === 'ALL' ? '#ffffff' : '#64748b',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            All Stations ({attempts.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('ACTIVE')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: filterMode === 'ACTIVE' ? '#0284c7' : '#ffffff',
              color: filterMode === 'ACTIVE' ? '#ffffff' : '#64748b',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            Active Coding ({activeAttempts.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('FLAGGED')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: filterMode === 'FLAGGED' ? '#dc2626' : '#ffffff',
              color: filterMode === 'FLAGGED' ? '#ffffff' : '#64748b',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            Cadence Alerts ({flaggedAttempts.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('SUBMITTED')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: filterMode === 'SUBMITTED' ? '#059669' : '#ffffff',
              color: filterMode === 'SUBMITTED' ? '#ffffff' : '#64748b',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            Submitted ({submittedAttempts.length})
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search station (PC-04), student..."
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              outline: 'none',
              background: '#ffffff',
            }}
          />
        </div>
      </div>

      {/* 3. Laboratory Grid View */}
      {filteredAttempts.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '48px',
            textAlign: 'center',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
            }}
          >
            <Terminal size={20} color="#64748b" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            No Matching Workstations Found
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '4px' }}>
            Provide candidates access code <strong style={{ color: '#0284c7' }}>{assessment.accessCode}</strong> to enter the lab.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredAttempts.map((attempt) => {
            const km = attempt.keystrokeMetrics;
            const snapshots = Array.isArray(attempt.codeSnapshots) ? attempt.codeSnapshots : [];
            const pasteCount = km?.pasteEventCount || km?.pasteEvents?.length || 0;
            const cadenceScore = km?.organicCadenceScore ?? 100;
            const rating = km?.integrityRating || 'AUTHENTIC';
            const isSuspicious = rating === 'SUSPICIOUS_PASTE' || cadenceScore < 40;
            const isTerminated = attempt.status === 'TERMINATED_FOR_VIOLATION';
            const isSubmitted = attempt.status === 'SUBMITTED';

            return (
              <div
                key={attempt.id}
                style={{
                  background: '#ffffff',
                  border: isTerminated
                    ? '1px solid #f87171'
                    : isSuspicious
                    ? '1px solid #f87171'
                    : isSubmitted
                    ? '1px solid #6ee7b7'
                    : '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Station Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        background: '#0f172a',
                        color: '#38bdf8',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Terminal size={12} />
                      <span>{attempt.labStation || 'PC-01'}</span>
                    </div>

                    {isTerminated ? (
                      <span className="badge badge-crimson" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        TERMINATED
                      </span>
                    ) : isSubmitted ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        SUBMITTED
                      </span>
                    ) : (
                      <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        ONLINE
                      </span>
                    )}
                  </div>

                  {/* Strikes indicator */}
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: attempt.violationCount > 0 ? '#dc2626' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <AlertTriangle size={12} color={attempt.violationCount > 0 ? '#dc2626' : '#94a3b8'} />
                    <span>{attempt.violationCount} Strikes</span>
                  </div>
                </div>

                {/* Candidate Identity */}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                    {attempt.student.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>
                    {attempt.student.email}
                  </div>
                </div>

                {/* Keystroke Cadence Pill */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.74rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Keyboard size={12} color="#0284c7" />
                    <span><strong>{km?.totalKeystrokes?.toLocaleString() || 0}</strong> keys</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gauge size={12} color="#a855f7" />
                    <span><strong>{km?.currentWpm || km?.averageWpm || 0}</strong> wpm</span>
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      color: isSuspicious ? '#dc2626' : '#059669',
                    }}
                  >
                    {isSuspicious ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                    <span>{cadenceScore}% Cadence</span>
                  </div>
                </div>

                {/* Audit & Snaps summary */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                  <span>{snapshots.length} Code Snaps</span>
                  <span>{pasteCount > 0 ? <strong style={{ color: isSuspicious ? '#dc2626' : '#475569' }}>{pasteCount} Paste(s)</strong> : '0 Pastes'}</span>
                  {attempt.isVerifiedByTeacher && (
                    <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  )}
                </div>

                {/* Action Button: Open Forensic Audit */}
                <button
                  type="button"
                  onClick={() => setAuditAttemptId(attempt.id)}
                  className="btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: isSuspicious ? '#fef2f2' : '#ffffff',
                    borderColor: isSuspicious ? '#fca5a5' : '#cbd5e1',
                    color: isSuspicious ? '#dc2626' : '#0f172a',
                  }}
                >
                  <Eye size={13} />
                  <span>Verify Forensic Audit</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Forensic Audit Modal */}
      {auditAttemptId && (
        <ForensicAuditModal
          attemptId={auditAttemptId}
          assessmentTitle={assessment.title}
          rubric={practicalRubric}
          onClose={() => setAuditAttemptId(null)}
          onGraded={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
