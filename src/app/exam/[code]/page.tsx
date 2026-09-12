'use client';

import React, { useCallback, useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import ProctorCameraFeed from '@/components/ProctorCameraFeed';
import AiProctorHud from '@/components/AiProctorHud';
import PracticalWorkstation from '@/components/PracticalWorkstation';
import { VisionMetrics, startVisionTelemetry } from '@/lib/visionTelemetry';
import { AudioMetrics, startAudioTelemetry } from '@/lib/audioTelemetry';
import {
  Shield,
  Clock,
  Timer,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Maximize2,
  Lock,
} from 'lucide-react';

interface QuestionItem {
  id: string;
  orderIndex: number;
  questionText: string;
  marks: number;
  negativeMarks: number;
  options: { id: string; text: string }[];
  questionType?: 'PRACTICAL_WEB' | 'PRACTICAL_CODE' | 'PRACTICAL_SQL' | 'MCQ';
  starterFiles?: any[];
  testCases?: any[];
  rubric?: any[];
}

interface AssessmentData {
  id: string;
  title: string;
  description: string;
  accessCode: string;
  examType?: 'PRACTICAL' | 'MCQ' | 'HYBRID';
  subjectCode?: string | null;
  labName?: string | null;
  batchName?: string | null;
  allowedResources?: any[];
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
  questions: QuestionItem[];
}

export default function SecureExamRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const accessCode = resolvedParams.code.toUpperCase();

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student Responses
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [labStation, setLabStation] = useState<string>('PC-01');

  // Media Streams for Live Proctoring
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // AI Proctoring Telemetry State
  const [visionMetrics, setVisionMetrics] = useState<VisionMetrics>({
    isReady: false,
    faceCount: 1,
    gazeDirection: 'CENTERED',
    confidence: 100,
    warningState: 'NORMAL',
    boundingBox: null,
  });
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({
    volume: 0,
    isSpeechDetected: false,
    frequencyBand: 'SILENT',
  });
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stops every camera/microphone track and detaches the preview element.
  // The ref is required: effect cleanups otherwise capture the initial `null`
  // stream value and never release the device.
  const stopMediaStream = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    const video = hiddenVideoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    setMediaStream(null);
  }, []);

  // Fullscreen & Lockdown State
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const [strikeModalOpen, setStrikeModalOpen] = useState(false);
  const [lastViolationMsg, setLastViolationMsg] = useState('');
  const [isTerminated, setIsTerminated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Timers
  const [overallSecondsLeft, setOverallSecondsLeft] = useState<number>(1800);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState<number>(60);

  // Refs
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const attemptIdRef = useRef(attemptId);
  attemptIdRef.current = attemptId;
  const isTerminatedRef = useRef(isTerminated);
  isTerminatedRef.current = isTerminated;
  const submittingRef = useRef(submitting);
  submittingRef.current = submitting;
  const lastViolationTimeRef = useRef<number>(0);
  const maxViolationsRef = useRef<number>(3);
  const violationCountRef = useRef<number>(0);

  // Lock Escape key when possible
  const requestEscapeLock = async () => {
    try {
      if (typeof window !== 'undefined' && 'keyboard' in navigator && (navigator as any).keyboard?.lock) {
        await (navigator as any).keyboard.lock(['Escape']);
      }
    } catch {
      // Browser might restrict keyboard lock, fallback to fullscreenchange listener
    }
  };

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      await requestEscapeLock();
      setIsFullscreen(true);
      setStrikeModalOpen(false);
    } catch (e) {
      console.warn('Fullscreen entry error:', e);
      setIsFullscreen(true);
      setStrikeModalOpen(false);
    }
  };

  // 1. Initialize assessment and attempt
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const testRes = await fetch(`/api/assessments/code/${accessCode}`);
        if (testRes.status === 401) {
          router.push(`/login?redirect=/exam/${accessCode}/check&role=student`);
          return;
        }
        if (!testRes.ok) {
          const testError = await testRes.json().catch(() => null);
          setInitError(testError?.error || `Assessment "${accessCode}" is unavailable.`);
          return;
        }
        const testData = await testRes.json();
        const testObj = testData.assessment as AssessmentData;
        setAssessment(testObj);
        maxViolationsRef.current = testObj.maxViolationsAllowed;

        setOverallSecondsLeft(testObj.durationMinutes * 60);
        setQuestionSecondsLeft(testObj.secondsPerQuestion);

        let station = 'PC-01';
        if (typeof window !== 'undefined') {
          station = localStorage.getItem(`examguard_station_${accessCode}`) || 'PC-01';
        }
        setLabStation(station);

        // Request or recover attempt
        const attemptRes = await fetch('/api/attempts/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessCode, labStation: station }),
        });

        if (attemptRes.status === 401) {
          router.push(`/login?redirect=/exam/${accessCode}/check&role=student`);
          return;
        }

        if (attemptRes.status === 409) {
          router.push(`/exam/${accessCode}/result`);
          return;
        }

        const attemptData = await attemptRes.json().catch(() => null);
        if (!attemptRes.ok) {
          setInitError(attemptData?.error || 'Unable to start this assessment attempt.');
          return;
        }

        if (!attemptData?.attemptId) {
          setInitError('Unable to start this assessment attempt. Please return to the student portal.');
          return;
        }

        setAttemptId(attemptData.attemptId);
        attemptIdRef.current = attemptData.attemptId;
        if (attemptData.answers) {
          setAnswers(attemptData.answers);
        }
        if (attemptData.violationCount) {
          violationCountRef.current = attemptData.violationCount;
          setViolationCount(attemptData.violationCount);
        }

        // Resume the countdown from the original start time. Refreshing the page
        // must not grant a student a fresh time allowance.
        const startedAtMs = attemptData.startedAt ? new Date(attemptData.startedAt).getTime() : NaN;
        const elapsedSeconds = Number.isFinite(startedAtMs)
          ? Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
          : 0;
        setOverallSecondsLeft(Math.max(0, testObj.durationMinutes * 60 - elapsedSeconds));

        // Check initial fullscreen state
        const inFs = !!document.fullscreenElement;
        setIsFullscreen(inFs);
        if (inFs) {
          requestEscapeLock();
        }

        // Camera & Mic
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: true,
          });

          // The component may have redirected/unmounted while the permission
          // prompt was open - release the device immediately in that case.
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          // Safety: never keep a previous stream alive if this effect re-runs.
          mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = stream;
          setMediaStream(stream);
        } catch (mediaErr) {
          console.warn('Proctor media stream warning:', mediaErr);
        }
      } catch (e) {
        console.error('Initialization error:', e);
        if (!cancelled) {
          setInitError('Unable to initialize the examination environment. Please check your connection and try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      stopMediaStream();
    };
  }, [accessCode, router, stopMediaStream]);

  // 2. Anti-Cheat Violation Handler with Optimistic UI & Strict Enforcement
  const recordViolation = async (type: string, details: string) => {
    if (isTerminatedRef.current || submittingRef.current) return;

    // Optimistically update violation count immediately
    const nextCount = violationCountRef.current + 1;
    violationCountRef.current = nextCount;
    setViolationCount(nextCount);
    setLastViolationMsg(details);
    setStrikeModalOpen(true);

    if (nextCount >= maxViolationsRef.current) {
      setIsTerminated(true);
      isTerminatedRef.current = true;
      // Stop camera/mic immediately on termination; the submit request that
      // follows will not keep recording the student.
      stopMediaStream();
      setTimeout(() => {
        handleSubmitExam('VIOLATION');
      }, 2000);
    }

    // Send to backend
    try {
      if (attemptIdRef.current) {
        await fetch('/api/attempts/violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId: attemptIdRef.current,
            type,
            details,
          }),
        });
      }
    } catch (e) {
      console.error('Violation record error:', e);
    }
  };

  // AI Vision & Audio Telemetry Controller
  useEffect(() => {
    if (!mediaStream) return;

    let isCleanedUp = false;
    let stopVision: (() => void) | null = null;
    let stopAudio: (() => void) | null = null;

    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.srcObject = mediaStream;
      hiddenVideoRef.current.play().catch(() => {});
    }

    // Start Audio Telemetry
    const audioController = startAudioTelemetry(mediaStream, (durationSec) => {
      recordViolation('VOICE_DETECTED', `Continuous human speech detected in acoustic environment (${durationSec}s)`);
    });
    stopAudio = audioController.stop;

    const audioPoll = setInterval(() => {
      if (!isCleanedUp) {
        setAudioMetrics(audioController.getMetrics());
      }
    }, 150);

    // Start Vision Telemetry with 800ms initial stabilization
    const startVisionTimer = setTimeout(() => {
      if (isCleanedUp || !hiddenVideoRef.current) return;

      startVisionTelemetry(hiddenVideoRef.current, {
        onViolation: (type, details) => {
          recordViolation(type, details);
        },
        onMetricsUpdate: (metrics) => {
          if (!isCleanedUp) {
            setVisionMetrics(metrics);
          }
        },
      }).then((vc) => {
        if (isCleanedUp) {
          vc.stop();
        } else {
          stopVision = vc.stop;
        }
      }).catch((err) => {
        console.warn('Vision telemetry startup error:', err);
      });
    }, 800);

    return () => {
      isCleanedUp = true;
      clearTimeout(startVisionTimer);
      clearInterval(audioPoll);
      if (stopAudio) stopAudio();
      if (stopVision) stopVision();
    };
  }, [mediaStream]);

  // 2b. Release camera/microphone when the page is hidden/unloaded (covers
  // bfcache navigation); normal route changes are handled by the init cleanup.
  useEffect(() => {
    const handlePageHide = () => stopMediaStream();
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [stopMediaStream]);

  // 3. Security Event Listeners: Tab Switch, Window Blur, Fullscreen Exit
  useEffect(() => {
    if (loading || !assessment) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastViolationTimeRef.current > 3500) {
          lastViolationTimeRef.current = now;
          recordViolation('TAB_SWITCH', 'Browser tab switched or window minimized');
        }
      }
    };

    const handleWindowBlur = () => {
      // In workstations with internal iframes (sandbox preview, docs browser) or dropdowns,
      // clicking inside an iframe fires window.onblur while document.hidden is FALSE.
      // We verify after 300ms if document.hidden is actually true (i.e. user genuinely switched to another app/window).
      setTimeout(() => {
        if (document.hidden) {
          const now = Date.now();
          if (now - lastViolationTimeRef.current > 3500) {
            lastViolationTimeRef.current = now;
            recordViolation('WINDOW_BLUR', 'Examination window lost focus or user switched applications');
          }
        }
      }, 300);
    };

    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);
      if (!inFullscreen && !submittingRef.current && !isTerminatedRef.current) {
        const now = Date.now();
        if (now - lastViolationTimeRef.current > 3500) {
          lastViolationTimeRef.current = now;
          recordViolation('FULLSCREEN_EXIT', 'Browser exited locked fullscreen mode');
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (assessment.examType === 'PRACTICAL') {
        // Allow right-click context menu in practical code editor
        return true;
      }
      e.preventDefault();
      return false;
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      // In practical coding examinations, code duplication and editing is normal.
      // Pastes are forensically inspected and logged by KeystrokeTelemetryCollector instead of blocking.
      if (assessment.examType === 'PRACTICAL') {
        return;
      }
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j' || e.key === 'c')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        recordViolation('DEVTOOLS_ATTEMPT', 'Developer inspection shortcut blocked');
      }

      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        recordViolation('TAB_SWITCH', 'Application switch shortcut detected');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopyPaste);
    window.addEventListener('cut', handleCopyPaste);
    window.addEventListener('paste', handleCopyPaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopyPaste);
      window.removeEventListener('cut', handleCopyPaste);
      window.removeEventListener('paste', handleCopyPaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, assessment]);

  // 4. Timer Logic
  useEffect(() => {
    if (loading || !assessment || isTerminated || submitting) return;

    const interval = setInterval(() => {
      if (assessment.perQuestionTimer) {
        setQuestionSecondsLeft((prev) => {
          if (prev <= 1) {
            if (currentIndex < assessment.questions.length - 1) {
              setCurrentIndex((curr) => curr + 1);
              return assessment.secondsPerQuestion;
            } else {
              handleSubmitExam('TIMEOUT');
              return 0;
            }
          }
          return prev - 1;
        });
      } else {
        setOverallSecondsLeft((prev) => {
          if (prev <= 1) {
            handleSubmitExam('TIMEOUT');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, assessment, currentIndex, isTerminated, submitting]);

  useEffect(() => {
    if (!assessment?.perQuestionTimer) return;

    let deadline: number | null = null;

    if (attemptId) {
      const storageKey = `examguard_qdeadline_${attemptId}_${currentIndex}`;
      try {
        const saved = Number(sessionStorage.getItem(storageKey));
        if (Number.isFinite(saved) && saved > 0) {
          deadline = saved;
        } else {
          deadline = Date.now() + assessment.secondsPerQuestion * 1000;
          sessionStorage.setItem(storageKey, String(deadline));
        }
      } catch {
        // sessionStorage can be unavailable in private browsing; fall back to
        // an in-memory timer for this page load.
      }
    }

    const secondsLeft = deadline
      ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      : assessment.secondsPerQuestion;

    setQuestionSecondsLeft(secondsLeft);
  }, [currentIndex, assessment, attemptId]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleClearOption = (questionId: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const toggleFlagQuestion = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // 5. Submit Exam Handler (Resilient & Confirmed)
  const handleSubmitExam = async (reason?: string) => {
    if (submittingRef.current) return;
    setSubmitting(true);
    submittingRef.current = true;
    setSubmitError(null);

    // Stop proctoring devices before the network round-trip so the exam cannot
    // keep recording after the student has submitted.
    stopMediaStream();

    try {
      const res = await fetch('/api/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attemptIdRef.current || undefined,
          accessCode,
          answers: answersRef.current,
          reason,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/exam/${accessCode}/check&role=student`);
          return;
        }
        if (res.status === 409) {
          router.push(`/exam/${accessCode}/result`);
          return;
        }
        setSubmitError(data?.error || 'Could not submit your assessment. Please try again.');
        setSubmitting(false);
        submittingRef.current = false;
        return;
      }

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      router.push(`/exam/${accessCode}/result`);
    } catch (e) {
      console.error('Submit error:', e);
      setSubmitError('Network error while submitting. Check your connection and try again.');
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  // 5b. Practical Exam Submit Handler
  const handlePracticalSubmit = async (taskFiles: any, snapshots: any[], keystrokeMetrics?: any) => {
    if (submittingRef.current) return;
    setSubmitting(true);
    submittingRef.current = true;
    setSubmitError(null);

    stopMediaStream();

    try {
      const res = await fetch('/api/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attemptIdRef.current || undefined,
          accessCode,
          submittedFiles: taskFiles,
          codeSnapshots: snapshots,
          keystrokeMetrics: keystrokeMetrics || undefined,
          reason: 'NORMAL',
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/exam/${accessCode}/check&role=student`);
          return;
        }
        if (res.status === 409) {
          router.push(`/exam/${accessCode}/result`);
          return;
        }
        setSubmitError(data?.error || 'Could not submit your practical work. Please try again.');
        setSubmitting(false);
        submittingRef.current = false;
        return;
      }

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      router.push(`/exam/${accessCode}/result`);
    } catch (e) {
      console.error('Practical submit error:', e);
      setSubmitError('Network error while submitting. Check your connection and try again.');
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-dot" style={{ width: '16px', height: '16px', margin: '0 auto 16px auto' }} />
          <p style={{ color: '#64748b' }}>Preparing examination environment...</p>
        </div>
      </div>
    );
  }

  if (initError || !assessment) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '480px', textAlign: 'center', background: '#ffffff' }}>
          <AlertTriangle style={{ width: '44px', height: '44px', color: '#d97706', margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Unable to Open Exam
          </h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            {initError || 'This examination could not be loaded.'}
          </p>
          <a href="/student" className="btn-primary">
            Return to Student Portal
          </a>
        </div>
      </div>
    );
  }

  const currentQ = assessment.questions[currentIndex];
  const totalQ = assessment.questions.length;
  const answeredCount = Object.keys(answers).length;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Submission failure banner (keeps the candidate on the page so they can retry) */}
      {submitError && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            background: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{submitError}</span>
          <button
            onClick={() => setSubmitError(null)}
            style={{ marginLeft: '8px', color: '#991b1b', fontWeight: 700, textDecoration: 'underline' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* FULLSCREEN LOCKDOWN SHIELD (Blocks all view until user re-enters fullscreen) */}
      {!isFullscreen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
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
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '2px solid #dc2626',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626' }} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', marginBottom: '10px' }}>
              EXAMINATION PAUSED — FULL SCREEN REQUIRED
            </h2>

            <p style={{ color: '#475569', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '20px' }}>
              You have exited full-screen mode. In accordance with the security policy, all questions are hidden and a strike has been logged.
            </p>

            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '0.88rem',
                color: '#334155',
              }}
            >
              Strike <strong style={{ color: '#dc2626' }}>{violationCount}</strong> of{' '}
              <strong>{assessment.maxViolationsAllowed}</strong> allowed.
            </div>

            <button
              onClick={enterFullscreen}
              className="btn-danger"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Maximize2 style={{ width: '18px', height: '18px' }} />
              <span>Return to Full Screen &amp; Resume Exam</span>
            </button>
          </div>
        </div>
      )}

      {assessment.examType === 'PRACTICAL' ? (
        <PracticalWorkstation
          assessment={assessment}
          attemptId={attemptId}
          labStation={labStation}
          tasks={assessment.questions as any}
          overallSecondsLeft={overallSecondsLeft}
          violationCount={violationCount}
          mediaStream={mediaStream}
          visionMetrics={visionMetrics}
          audioMetrics={audioMetrics}
          onSubmit={handlePracticalSubmit}
          submitting={submitting}
        />
      ) : (
        <>
          {/* Top Header */}
          <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 40,
        }}
      >
        {/* Left Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Shield style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a' }}>EXAMGUARD EXAMINATION</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                {assessment.accessCode}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {assessment.title}
            </div>
          </div>
        </div>

        {/* Center: Timers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {assessment.perQuestionTimer ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: questionSecondsLeft <= 10 ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${questionSecondsLeft <= 10 ? '#fecaca' : '#fde68a'}`,
                padding: '6px 14px',
                borderRadius: '6px',
              }}
            >
              <Clock style={{ width: '16px', height: '16px', color: questionSecondsLeft <= 10 ? '#dc2626' : '#d97706' }} />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 600 }}>QUESTION TIME</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: questionSecondsLeft <= 10 ? '#dc2626' : '#d97706' }}>
                  {questionSecondsLeft}s
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: overallSecondsLeft < 120 ? '#fef2f2' : '#f0f9ff',
                border: `1px solid ${overallSecondsLeft < 120 ? '#fecaca' : '#bae6fd'}`,
                padding: '6px 14px',
                borderRadius: '6px',
              }}
            >
              <Clock style={{ width: '16px', height: '16px', color: overallSecondsLeft < 120 ? '#dc2626' : '#0284c7' }} />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 600 }}>TIME REMAINING</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: overallSecondsLeft < 120 ? '#dc2626' : '#0284c7' }}>
                  {formatTime(overallSecondsLeft)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: violationCount > 0 ? '#fef2f2' : '#ecfdf5',
              border: `1px solid ${violationCount > 0 ? '#fecaca' : '#a7f3d0'}`,
              padding: '6px 12px',
              borderRadius: '6px',
            }}
          >
            <AlertTriangle style={{ width: '14px', height: '14px', color: violationCount > 0 ? '#dc2626' : '#059669' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: violationCount > 0 ? '#dc2626' : '#059669' }}>
              {violationCount} / {assessment.maxViolationsAllowed} Strikes
            </span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.86rem' }}
          >
            <Send style={{ width: '14px', height: '14px' }} />
            <span>Finish &amp; Submit</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Question Area */}
        <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
            {/* Question Progress & Marks */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.82rem' }}>
                  Question {currentIndex + 1} of {totalQ}
                </span>
                <span className="badge badge-emerald">+{currentQ.marks} Marks</span>
                {currentQ.negativeMarks > 0 && (
                  <span className="badge badge-crimson">-{currentQ.negativeMarks} Negative</span>
                )}
              </div>

              {assessment.perQuestionTimer && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: questionSecondsLeft <= 10 ? '#fef2f2' : '#fffbeb', border: `1px solid ${questionSecondsLeft <= 10 ? '#fecaca' : '#fde68a'}`, padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: questionSecondsLeft <= 10 ? '#dc2626' : '#d97706' }}>
                  <Timer size={14} />
                  <span>{questionSecondsLeft}s left</span>
                </div>
              )}

              <button
                onClick={() => toggleFlagQuestion(currentQ.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: flaggedQuestions[currentQ.id] ? '#fffbeb' : '#ffffff',
                  color: flaggedQuestions[currentQ.id] ? '#d97706' : '#64748b',
                  border: `1px solid ${flaggedQuestions[currentQ.id] ? '#fde68a' : '#cbd5e1'}`,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <Bookmark style={{ width: '14px', height: '14px' }} />
                <span>{flaggedQuestions[currentQ.id] ? 'Flagged for Review' : 'Flag Question'}</span>
              </button>
            </div>

            {/* Question Card */}
            <div className="glass-panel" style={{ padding: '40px', background: '#ffffff', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.6, marginBottom: '32px' }}>
                {currentQ.questionText}
              </h2>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {currentQ.options.map((option) => {
                  const isSelected = answers[currentQ.id] === option.id;

                  return (
                    <div
                      key={option.id}
                      onClick={() => handleSelectOption(currentQ.id, option.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px 20px',
                        borderRadius: '8px',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        border: `1.5px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: isSelected ? '#0284c7' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          flexShrink: 0,
                        }}
                      >
                        {option.id}
                      </div>

                      <span style={{ fontSize: '0.96rem', color: isSelected ? '#0f172a' : '#334155', flex: 1, fontWeight: isSelected ? 600 : 400 }}>
                        {option.text}
                      </span>

                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? '#0284c7' : '#cbd5e1'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && (
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {answers[currentQ.id] && (
                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleClearOption(currentQ.id)}
                    style={{ fontSize: '0.82rem', color: '#64748b', textDecoration: 'underline' }}
                  >
                    Clear Response
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {!assessment.perQuestionTimer ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="btn-secondary"
                  style={{ padding: '10px 20px', opacity: currentIndex === 0 ? 0.4 : 1 }}
                >
                  <ChevronLeft style={{ width: '18px', height: '18px' }} />
                  <span>Previous</span>
                </button>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={13} />
                  <span>Questions lock once passed</span>
                </div>
              )}

              {currentIndex < totalQ - 1 ? (
                <button
                  onClick={() => {
                    setCurrentIndex((prev) => prev + 1);
                    if (assessment.perQuestionTimer) {
                      setQuestionSecondsLeft(assessment.secondsPerQuestion);
                    }
                  }}
                  className="btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  <span>Next Question</span>
                  <ChevronRight style={{ width: '18px', height: '18px' }} />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="btn-emerald"
                  style={{ padding: '10px 26px' }}
                >
                  <Send style={{ width: '16px', height: '16px' }} />
                  <span>Review &amp; Submit</span>
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar: Proctor HUD & Palette */}
        <aside
          style={{
            width: '320px',
            background: '#ffffff',
            borderLeft: '1px solid #e2e8f0',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            overflowY: 'auto',
          }}
        >
          {/* Live Camera Viewport */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, marginBottom: '10px', letterSpacing: '0.04em' }}>
              PROCTOR TELEMETRY
            </div>
            <ProctorCameraFeed
              stream={mediaStream}
              violationCount={violationCount}
              maxViolations={assessment.maxViolationsAllowed}
              isFlashing={strikeModalOpen}
              compact={false}
            />

            {/* In-Browser AI Vision & Audio Telemetry HUD */}
            <AiProctorHud
              vision={visionMetrics}
              audio={audioMetrics}
              isMediaActive={!!mediaStream}
            />
          </div>

          {/* Palette */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Questions Overview</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {answeredCount}/{totalQ} Answered
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {assessment.questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answers[q.id];
                const isFlagged = !!flaggedQuestions[q.id];

                let bg = '#f8fafc';
                let color = '#64748b';
                let border = '1px solid #e2e8f0';

                if (isCurrent) {
                  border = '2px solid #0284c7';
                  bg = '#f0f9ff';
                  color = '#0284c7';
                } else if (isFlagged) {
                  border = '1px solid #fde68a';
                  bg = '#fffbeb';
                  color = '#d97706';
                } else if (isAnswered) {
                  border = '1px solid #a7f3d0';
                  bg = '#ecfdf5';
                  color = '#059669';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      if (assessment.perQuestionTimer) return;
                      setCurrentIndex(idx);
                    }}
                    style={{
                      height: '38px',
                      borderRadius: '6px',
                      background: bg,
                      color: color,
                      border: border,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: assessment.perQuestionTimer && !isCurrent ? 'not-allowed' : 'pointer',
                      opacity: assessment.perQuestionTimer && !isCurrent ? 0.6 : 1,
                    }}
                    title={assessment.perQuestionTimer && !isCurrent ? 'Locked in per-question timed exam' : `Question ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#059669' }} />
                <span>Answered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#0284c7' }} />
                <span>Current Question</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#d97706' }} />
                <span>Flagged for Review</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
      </>
      )}

      {/* Security Strike Alert Modal */}
      {strikeModalOpen && isFullscreen && (
        <div className="modal-overlay">
          <div
            className="glass-panel"
            style={{
              maxWidth: '480px',
              padding: '36px',
              textAlign: 'center',
              border: '2px solid #dc2626',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle style={{ width: '28px', height: '28px', color: '#dc2626' }} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginBottom: '8px' }}>
              SECURITY STRIKE DETECTED
            </h3>

            <p style={{ color: '#0f172a', fontSize: '0.94rem', marginBottom: '16px', fontWeight: 600 }}>
              {lastViolationMsg || 'Browser tab switch or window loss identified'}
            </p>

            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '0.9rem',
                color: '#334155',
              }}
            >
              Strike <strong style={{ color: '#dc2626' }}>{violationCount}</strong> of{' '}
              <strong>{assessment.maxViolationsAllowed}</strong> allowed.
              {isTerminated ? (
                <div style={{ color: '#dc2626', fontWeight: 700, marginTop: '6px' }}>
                  Threshold exceeded! Terminating examination immediately...
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '6px' }}>
                  Exceeding {assessment.maxViolationsAllowed} strikes will automatically submit your assessment.
                </div>
              )}
            </div>

            {!isTerminated && (
              <button
                onClick={() => setStrikeModalOpen(false)}
                className="btn-danger"
                style={{ width: '100%', padding: '12px' }}
              >
                <span>Acknowledge &amp; Continue Exam</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ maxWidth: '440px', padding: '36px', textAlign: 'center', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
              Submit Assessment?
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.5 }}>
              You have answered <strong>{answeredCount}</strong> of <strong>{totalQ}</strong> questions.
              {answeredCount < totalQ && (
                <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', fontWeight: 500 }}>
                  <AlertTriangle size={15} />
                  <span>You have {totalQ - answeredCount} unanswered questions remaining.</span>
                </span>
              )}
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="btn-secondary"
                style={{ padding: '10px 22px' }}
                disabled={submitting}
              >
                Continue Exam
              </button>
              <button
                onClick={() => handleSubmitExam('NORMAL')}
                disabled={submitting}
                className="btn-emerald"
                style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Send style={{ width: '15px', height: '15px' }} />
                <span>{submitting ? 'Grading & Submitting...' : 'Confirm Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hidden processing video for AI Computer Vision analyzer */}
      <video
        ref={hiddenVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '320px',
          height: '240px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
