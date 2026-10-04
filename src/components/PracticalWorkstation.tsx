'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Clock,
  Terminal,
  FileCode2,
  Globe,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  Video,
  Mic,
  Maximize2,
  HelpCircle,
  Eye,
  Send,
  Layers,
  ChevronRight,
  BookOpen,
  Keyboard,
  Gauge,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import CodeEditor from './CodeEditor';
import LiveSandbox from './LiveSandbox';
import WhitelistedDocsBrowser from './WhitelistedDocsBrowser';
import ProctorCameraFeed from './ProctorCameraFeed';
import AiProctorHud from './AiProctorHud';
import { VisionMetrics } from '@/lib/visionTelemetry';
import { AudioMetrics } from '@/lib/audioTelemetry';
import { StarterFile, WhitelistedResource, EvaluationCriterion } from '@/lib/practicalBank';
import {
  KeystrokeTelemetryCollector,
  KeystrokeMetricsSummary,
  CodeSnapshotRecord,
} from '@/lib/keystrokeTelemetry';

export interface PracticalTask {
  id: string;
  orderIndex: number;
  questionText: string;
  marks: number;
  questionType: 'PRACTICAL_WEB' | 'PRACTICAL_CODE' | 'PRACTICAL_SQL';
  starterFiles: StarterFile[];
  testCases: string[];
  rubric: EvaluationCriterion[];
}

interface PracticalWorkstationProps {
  assessment: {
    id: string;
    title: string;
    description: string;
    accessCode: string;
    durationMinutes: number;
    subjectCode?: string | null;
    labName?: string | null;
    batchName?: string | null;
    allowedResources?: WhitelistedResource[];
    maxViolationsAllowed: number;
    requireCamera: boolean;
    requireMicrophone: boolean;
    requireFullscreen: boolean;
  };
  attemptId: string | null;
  labStation: string;
  tasks: PracticalTask[];
  overallSecondsLeft: number;
  violationCount: number;
  mediaStream: MediaStream | null;
  visionMetrics: VisionMetrics;
  audioMetrics: AudioMetrics;
  onSubmit: (
    submittedFiles: Record<string, StarterFile[]>,
    snapshots: CodeSnapshotRecord[],
    keystrokeMetrics?: KeystrokeMetricsSummary
  ) => void;
  submitting: boolean;
}

export default function PracticalWorkstation({
  assessment,
  attemptId,
  labStation,
  tasks,
  overallSecondsLeft,
  violationCount,
  mediaStream,
  visionMetrics,
  audioMetrics,
  onSubmit,
  submitting,
}: PracticalWorkstationProps) {
  // Current Practical Task Index
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const currentTask = tasks[currentTaskIndex] || tasks[0];

  // Files state keyed by task id: { [taskId]: StarterFile[] }
  const [taskFiles, setTaskFiles] = useState<Record<string, StarterFile[]>>(() => {
    const initial: Record<string, StarterFile[]> = {};
    tasks.forEach((t) => {
      // Check localStorage for saved files
      const localKey = `examguard_code_${assessment.accessCode}_${t.id}`;
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(localKey);
        if (cached) {
          try {
            initial[t.id] = JSON.parse(cached);
            return;
          } catch (e) {}
        }
      }
      initial[t.id] = (t.starterFiles && t.starterFiles.length > 0)
        ? t.starterFiles.map((f) => ({ ...f }))
        : [{ filename: 'index.html', language: 'html', content: '<!-- Implementation -->' }];
    });
    return initial;
  });

  // Active file index per task: { [taskId]: number }
  const [activeFileIndices, setActiveFileIndices] = useState<Record<string, number>>({});

  // Right Panel Mode: 'SANDBOX' | 'DOCS'
  const [rightPanelTab, setRightPanelTab] = useState<'SANDBOX' | 'DOCS'>('SANDBOX');

  // PiP Camera visibility
  const [showCameraPiP, setShowCameraPiP] = useState(true);

  // Auto-save feedback
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Digital Forensic Telemetry Collector & State
  const telemetryCollectorRef = useRef<KeystrokeTelemetryCollector>(new KeystrokeTelemetryCollector());
  const [keystrokeMetrics, setKeystrokeMetrics] = useState<KeystrokeMetricsSummary>(() =>
    telemetryCollectorRef.current.getMetricsSummary(0)
  );

  // Time-lapse code snapshots accumulator & pending buffer for heartbeat
  const pendingSnapshotsRef = useRef<CodeSnapshotRecord[]>([]);
  const allSnapshotsRef = useRef<CodeSnapshotRecord[]>([]);
  const snapshotCounterRef = useRef<number>(0);
  const lastTotalCharsRef = useRef<number>(0);

  // Current task files
  const currentFiles = taskFiles[currentTask.id] || [];
  const currentActiveFileIndex = activeFileIndices[currentTask.id] || 0;

  // Code modification handler
  const handleCodeChange = (fileIndex: number, newContent: string) => {
    setTaskFiles((prev) => {
      const copy = { ...prev };
      const fCopy = [...(copy[currentTask.id] || [])];
      fCopy[fileIndex] = { ...fCopy[fileIndex], content: newContent };
      copy[currentTask.id] = fCopy;
      return copy;
    });
  };

  // Reset file handler
  const handleResetFile = (fileIndex: number) => {
    const originalStarter = currentTask.starterFiles?.[fileIndex];
    if (originalStarter) {
      handleCodeChange(fileIndex, originalStarter.content);
    }
  };

  // Keystroke & Clipboard Telemetry Listeners
  const handleEditorKeyPress = (e: { key: string; ctrlKey?: boolean; metaKey?: boolean }) => {
    telemetryCollectorRef.current.recordKeyEvent(e);
  };

  const handleEditorPaste = (pastedText: string, filename: string) => {
    telemetryCollectorRef.current.recordPasteEvent(pastedText, filename);
    const totalChars = Object.values(taskFiles).flat().reduce((acc, f) => acc + f.content.length, 0);
    setKeystrokeMetrics(telemetryCollectorRef.current.getMetricsSummary(totalChars));
  };

  const handleEditorDropAttempt = (details: string) => {
    telemetryCollectorRef.current.recordPasteEvent(
      `[DRAG_DROP_BLOCKED] ${details}`,
      currentFiles[currentActiveFileIndex]?.filename || 'editor'
    );
    const totalChars = Object.values(taskFiles).flat().reduce((acc, f) => acc + f.content.length, 0);
    setKeystrokeMetrics(telemetryCollectorRef.current.getMetricsSummary(totalChars));
  };

  // Periodic Auto-Save, Snapshot Generation, and Telemetry Heartbeat Sync (every 15s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window === 'undefined') return;

      // 1. Persist task files to localStorage
      tasks.forEach((t) => {
        const files = taskFiles[t.id];
        if (files) {
          localStorage.setItem(`examguard_code_${assessment.accessCode}_${t.id}`, JSON.stringify(files));
        }
      });
      setLastSavedTime(new Date().toLocaleTimeString());

      // 2. Compute current total characters and update telemetry metrics
      const totalChars = Object.values(taskFiles).flat().reduce((acc, f) => acc + f.content.length, 0);
      const updatedMetrics = telemetryCollectorRef.current.getMetricsSummary(totalChars);
      setKeystrokeMetrics(updatedMetrics);

      // 3. Record Time-Lapse Code Snapshot
      const elapsedSec = Math.max(0, assessment.durationMinutes * 60 - overallSecondsLeft);
      const snapshot: CodeSnapshotRecord = {
        snapshotIndex: ++snapshotCounterRef.current,
        timestamp: new Date().toISOString(),
        elapsedSeconds: elapsedSec,
        taskId: currentTask.id,
        files: currentFiles.map((f) => ({
          filename: f.filename,
          content: f.content,
          length: f.content.length,
          lineCount: f.content.split('\n').length,
        })),
        totalKeystrokesAtSnapshot: updatedMetrics.totalKeystrokes,
        pasteCountAtSnapshot: updatedMetrics.pasteEventCount,
        wpmAtSnapshot: updatedMetrics.currentWpm,
        deltaCharCount: totalChars - lastTotalCharsRef.current,
        flag: updatedMetrics.integrityRating !== 'AUTHENTIC' ? updatedMetrics.integrityRating : null,
      };

      lastTotalCharsRef.current = totalChars;
      pendingSnapshotsRef.current.push(snapshot);
      allSnapshotsRef.current.push(snapshot);

      // 4. Remote Telemetry Heartbeat Sync to server
      if (attemptId && pendingSnapshotsRef.current.length > 0) {
        const snapshotsBatch = [...pendingSnapshotsRef.current];
        fetch(`/api/attempts/${attemptId}/telemetry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keystrokeMetrics: updatedMetrics,
            newSnapshots: snapshotsBatch,
            activeStation: labStation,
            activeFile: currentFiles[currentActiveFileIndex]?.filename,
          }),
        })
          .then((res) => {
            if (res.ok) {
              pendingSnapshotsRef.current = pendingSnapshotsRef.current.slice(snapshotsBatch.length);
            }
          })
          .catch((err) => {
            console.warn('Telemetry heartbeat sync error (buffered for next cycle):', err);
          });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [
    taskFiles,
    tasks,
    assessment.accessCode,
    assessment.durationMinutes,
    attemptId,
    labStation,
    currentTask.id,
    currentFiles,
    currentActiveFileIndex,
    overallSecondsLeft,
  ]);

  // Format Time Remaining
  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeLow = overallSecondsLeft <= 300; // < 5 mins

  // Parse Problem Title vs Statement
  const problemParts = (currentTask.questionText || '').split('\n\n');
  const problemTitle = problemParts[0] || `Practical Task ${currentTaskIndex + 1}`;
  const problemBody = problemParts.slice(1).join('\n\n') || currentTask.questionText;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: '#f8fafc',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 1. Master Top Bar */}
      <header
        style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1e293b',
          zIndex: 40,
        }}
      >
        {/* Left: Branding, Exam Info, Lab Station */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>ExamGuard</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                  LAB WORKSTATION
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {assessment.title}
              </div>
            </div>
          </div>

          {/* Station Badge */}
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              padding: '4px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Terminal size={13} color="#38bdf8" />
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>STATION:</span>
            <span style={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {labStation || 'PC-GENERAL'}
            </span>
          </div>

          {assessment.batchName && (
            <span style={{ fontSize: '0.74rem', color: '#059669', background: 'rgba(5, 150, 105, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              {assessment.batchName}
            </span>
          )}

          {/* Forensic Telemetry & Cadence Monitor */}
          <div
            style={{
              background: '#1e293b',
              border:
                keystrokeMetrics.integrityRating === 'SUSPICIOUS_PASTE'
                  ? '1px solid #ef4444'
                  : keystrokeMetrics.integrityRating === 'ANOMALOUS_BURST'
                  ? '1px solid #f59e0b'
                  : '1px solid #334155',
              padding: '3px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.74rem',
            }}
            title="ExamGuard Digital Keystroke & Forensic Cadence Monitor"
          >
            {/* Keystrokes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Keyboard size={13} color="#38bdf8" />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc' }}>
                {keystrokeMetrics.totalKeystrokes.toLocaleString()}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>keys</span>
            </div>

            {/* Instant WPM */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Gauge size={13} color="#a855f7" />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc' }}>
                {keystrokeMetrics.currentWpm}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>wpm</span>
            </div>

            {/* Organic Cadence Score */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 7px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.68rem',
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
              }}
            >
              {keystrokeMetrics.integrityRating === 'SUSPICIOUS_PASTE' ? (
                <ShieldAlert size={12} />
              ) : (
                <ShieldCheck size={12} />
              )}
              <span>{keystrokeMetrics.organicCadenceScore}% Cadence</span>
              {keystrokeMetrics.pasteEvents.length > 0 && (
                <span
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontSize: '0.64rem',
                    marginLeft: '2px',
                  }}
                  title={`${keystrokeMetrics.pasteEvents.length} paste event(s) recorded`}
                >
                  {keystrokeMetrics.pasteEvents.length}P
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Countdown Timer & Save Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: isTimeLow ? 'rgba(220, 38, 38, 0.2)' : '#1e293b',
              border: isTimeLow ? '1px solid #dc2626' : '1px solid #334155',
            }}
          >
            <Clock size={16} color={isTimeLow ? '#f87171' : '#38bdf8'} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: isTimeLow ? '#f87171' : '#ffffff',
                  letterSpacing: '0.04em',
                }}
              >
                {formatTimer(overallSecondsLeft)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
            <CheckCircle2 size={12} color="#10b981" />
            <span>Auto-saved: {lastSavedTime}</span>
          </div>
        </div>

        {/* Right: Docs Switcher, Strikes, Submit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Docs Toggle Button */}
          <button
            type="button"
            onClick={() => setRightPanelTab(rightPanelTab === 'DOCS' ? 'SANDBOX' : 'DOCS')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: rightPanelTab === 'DOCS' ? '#0284c7' : '#1e293b',
              color: '#ffffff',
              transition: 'all 0.15s ease',
            }}
          >
            <Globe size={14} color={rightPanelTab === 'DOCS' ? '#ffffff' : '#38bdf8'} />
            <span>Whitelisted Docs ({assessment.allowedResources?.length || 4})</span>
          </button>

          {/* Violation Strikes */}
          <div
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: violationCount > 0 ? 'rgba(220, 38, 38, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: violationCount > 0 ? '1px solid #dc2626' : '1px solid #334155',
              color: violationCount > 0 ? '#f87171' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={13} color={violationCount > 0 ? '#f87171' : '#94a3b8'} />
            <span>
              {violationCount} / {assessment.maxViolationsAllowed} Strikes
            </span>
          </div>

          {/* Finish & Submit Button */}
          <button
            type="button"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={submitting}
            className="btn-emerald"
            style={{
              padding: '6px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Send size={14} />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workstation 3-Column Split */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* ======================================================== */}
        {/* LEFT PANEL: Problem Specification, Constraints & Rubric  */}
        {/* ======================================================== */}
        <div
          style={{
            width: '380px',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Task Selector Tabs if multiple tasks */}
          {tasks.length > 1 && (
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '4px', padding: '6px 12px' }}>
              {tasks.map((t, idx) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCurrentTaskIndex(idx)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: currentTaskIndex === idx ? '#0284c7' : 'transparent',
                    color: currentTaskIndex === idx ? '#ffffff' : '#475569',
                  }}
                >
                  Task #{idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Problem Body (Scrollable) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                  {currentTask.questionType}
                </span>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                  {currentTask.marks} Marks
                </span>
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                {problemTitle}
              </h2>
            </div>

            {/* Problem Statement */}
            <div
              style={{
                fontSize: '0.86rem',
                color: '#334155',
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              {problemBody}
            </div>

            {/* Constraints */}
            {currentTask.testCases && currentTask.testCases.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} color="#d97706" />
                  <span>Technical Constraints</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#78350f', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {currentTask.testCases.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Itemized Evaluation Rubric */}
            {currentTask.rubric && currentTask.rubric.length > 0 && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', background: '#ffffff' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={15} color="#059669" />
                  <span>Evaluation Rubric Criteria</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentTask.rubric.map((r, rIdx) => (
                    <div
                      key={rIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        padding: '6px 10px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <span style={{ color: '#334155' }}>{r.criteria}</span>
                      <span style={{ fontWeight: 700, color: '#059669' }}>{r.marks} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER PANEL: Multi-File Code Editor Workstation         */}
        {/* ======================================================== */}
        <div style={{ flex: 1, minWidth: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <CodeEditor
            files={currentFiles}
            activeFileIndex={currentActiveFileIndex}
            onFileSelect={(idx) => setActiveFileIndices((prev) => ({ ...prev, [currentTask.id]: idx }))}
            onCodeChange={handleCodeChange}
            onResetFile={handleResetFile}
            onKeyPress={handleEditorKeyPress}
            onPasteEvent={handleEditorPaste}
            onExternalDropAttempt={handleEditorDropAttempt}
          />
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: Live Sandbox Output OR Whitelisted Docs    */}
        {/* ======================================================== */}
        <div
          style={{
            width: '480px',
            background: '#ffffff',
            borderLeft: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Panel Selector Header */}
          <div
            style={{
              background: '#f1f5f9',
              borderBottom: '1px solid #cbd5e1',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setRightPanelTab('SANDBOX')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '5px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: rightPanelTab === 'SANDBOX' ? '#ffffff' : 'transparent',
                  color: rightPanelTab === 'SANDBOX' ? '#0284c7' : '#64748b',
                  boxShadow: rightPanelTab === 'SANDBOX' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Live Preview &amp; Output
              </button>

              <button
                type="button"
                onClick={() => setRightPanelTab('DOCS')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '5px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: rightPanelTab === 'DOCS' ? '#ffffff' : 'transparent',
                  color: rightPanelTab === 'DOCS' ? '#0284c7' : '#64748b',
                  boxShadow: rightPanelTab === 'DOCS' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Whitelisted Docs Sandbox
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {rightPanelTab === 'SANDBOX' ? (
              <LiveSandbox
                files={currentFiles}
                practicalType={currentTask.questionType}
              />
            ) : (
              <WhitelistedDocsBrowser
                allowedResources={assessment.allowedResources || []}
                subjectCode={assessment.subjectCode || 'WT-301'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Picture-in-Picture Proctoring Camera Feed */}
      {assessment.requireCamera && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '6px',
          }}
        >
          {showCameraPiP && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '8px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>
                  Invigilator Feed
                </span>
                <button
                  type="button"
                  onClick={() => setShowCameraPiP(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.7rem' }}
                >
                  Minimize
                </button>
              </div>

              <ProctorCameraFeed
                stream={mediaStream}
                violationCount={violationCount}
                maxViolations={assessment.maxViolationsAllowed}
                compact={true}
              />

              <AiProctorHud
                vision={visionMetrics}
                audio={audioMetrics}
                isMediaActive={!!mediaStream}
              />
            </div>
          )}

          {!showCameraPiP && (
            <button
              type="button"
              onClick={() => setShowCameraPiP(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#0f172a',
                color: '#ffffff',
                border: '1px solid #334155',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            >
              <Video size={13} color="#38bdf8" />
              <span>Show Proctor Feed</span>
            </button>
          )}
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
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
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={24} color="#059669" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Confirm Final Practical Submission
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                  Station: <strong>{labStation || 'PC-GENERAL'}</strong> • Batch: <strong>{assessment.batchName || 'General'}</strong>
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, marginBottom: '16px' }}>
              Are you sure you want to finalize and submit your practical examination? All current code files will be bundled and time-stamped for the invigilator.
            </p>

            {/* Files Summary */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Submitting Files:
              </div>
              {tasks.map((t) => (
                <div key={t.id} style={{ fontSize: '0.78rem', color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t.questionText.slice(0, 32)}...</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#0284c7' }}>
                    {(taskFiles[t.id] || []).map((f) => f.filename).join(', ')}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="btn-secondary"
                style={{ padding: '8px 18px', fontSize: '0.86rem' }}
              >
                Continue Editing
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSubmitConfirm(false);
                  const totalChars = Object.values(taskFiles).flat().reduce((acc, f) => acc + f.content.length, 0);
                  const finalMetrics = telemetryCollectorRef.current.getMetricsSummary(totalChars);
                  onSubmit(taskFiles, allSnapshotsRef.current, finalMetrics);
                }}
                disabled={submitting}
                className="btn-emerald"
                style={{ padding: '8px 22px', fontSize: '0.86rem', fontWeight: 700 }}
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Examination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
