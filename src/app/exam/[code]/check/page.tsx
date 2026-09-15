'use client';

import React, { useCallback, useEffect, useRef, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AudioVisualizer from '@/components/AudioVisualizer';
import {
  Shield,
  Video,
  Mic,
  Maximize2,
  AlertTriangle,
  ArrowRight,
  Lock,
  ArrowLeft,
  CheckCircle2,
  User,
  Terminal,
  Globe,
} from 'lucide-react';

export default function ExamCheckroomPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const accessCode = resolvedParams.code.toUpperCase();

  const [assessment, setAssessment] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lab Station Number for Practical Exams
  const [labStation, setLabStation] = useState<string>('');

  // Diagnostics State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const [fullscreenTested, setFullscreenTested] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(false);
  const mediaRequestIdRef = useRef(0);

  const stopCameraStream = useCallback(() => {
    const stream = cameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    const video = videoPreviewRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    setCameraStream(null);
    setCameraActive(false);
  }, []);

  const stopMicStream = useCallback(() => {
    const stream = micStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    setMicStream(null);
    setMicActive(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`examguard_station_${accessCode}`);
      if (saved) setLabStation(saved);
    }
  }, [accessCode]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      try {
        // 1. Check user authentication
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json().catch(() => null);
        if (!isCancelled && authData?.user) {
          setCurrentUser(authData.user);
          if (authData.user.role !== 'STUDENT') {
            setError('Only student accounts can take this assessment. Sign in with a student account.');
            return;
          }
        } else {
          if (!isCancelled) setAuthRequired(true);
          // The assessment endpoint requires a session, so skip loading it.
          return;
        }

        // 2. Load assessment details
        const testRes = await fetch(`/api/assessments/code/${accessCode}`);
        const testData = await testRes.json();

        if (!testRes.ok) {
          throw new Error(testData.error || `Invalid or expired access code "${accessCode}".`);
        }

        if (testData.existingAttempt && testData.existingAttempt.status !== 'IN_PROGRESS') {
          router.push(`/exam/${accessCode}/result`);
          return;
        }

        if (!isCancelled) {
          setAssessment(testData.assessment);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load assessment');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [accessCode, router]);

  const requestMediaPermissions = useCallback(async () => {
    const requestId = mediaRequestIdRef.current + 1;
    mediaRequestIdRef.current = requestId;

    // Re-requesting must not leave the previous streams running.
    stopCameraStream();
    stopMicStream();
    setCameraError(null);
    setMicError(null);

    // Request Camera
    try {
      const vStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });

      // Ignore stale responses (retry pressed again, or page unmounted while
      // the permission prompt was open) and release the device immediately.
      if (!isMountedRef.current || requestId !== mediaRequestIdRef.current) {
        vStream.getTracks().forEach((track) => track.stop());
        return;
      }

      cameraStreamRef.current = vStream;
      setCameraStream(vStream);
      setCameraActive(true);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = vStream;
        videoPreviewRef.current.play().catch(() => {});
      }
    } catch (e: any) {
      console.warn('Camera permission issue:', e);
      if (isMountedRef.current && requestId === mediaRequestIdRef.current) {
        setCameraError(e.message || 'Camera permission denied or camera device unavailable');
      }
    }

    // Request Mic
    try {
      const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!isMountedRef.current || requestId !== mediaRequestIdRef.current) {
        aStream.getTracks().forEach((track) => track.stop());
        return;
      }

      micStreamRef.current = aStream;
      setMicStream(aStream);
      setMicActive(true);
    } catch (e: any) {
      console.warn('Microphone permission issue:', e);
      if (isMountedRef.current && requestId === mediaRequestIdRef.current) {
        setMicError(e.message || 'Microphone permission denied or audio device unavailable');
      }
    }
  }, [stopCameraStream, stopMicStream]);

  useEffect(() => {
    isMountedRef.current = true;
    requestMediaPermissions();

    return () => {
      isMountedRef.current = false;
      // Invalidate any in-flight getUserMedia request and stop live tracks.
      mediaRequestIdRef.current += 1;
      stopCameraStream();
      stopMicStream();
    };
  }, [requestMediaPermissions, stopCameraStream, stopMicStream]);

  useEffect(() => {
    if (videoPreviewRef.current && cameraStream) {
      videoPreviewRef.current.srcObject = cameraStream;
      videoPreviewRef.current.play().catch(() => {});
    }
  }, [cameraStream]);

  useEffect(() => {
    const handlePageHide = () => {
      stopCameraStream();
      stopMicStream();
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [stopCameraStream, stopMicStream]);

  const testFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setFullscreenTested(true);
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
      setFullscreenTested(true);
    }
  };

  const handleLaunchExam = async () => {
    if (!agreed) {
      alert('Please confirm that you understand and agree to the exam rules.');
      return;
    }

    if (assessment?.examType === 'PRACTICAL') {
      const station = labStation.trim() || 'PC-01';
      if (typeof window !== 'undefined') {
        localStorage.setItem(`examguard_station_${accessCode}`, station);
      }
    }

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen trigger failed:', e);
    }

    // The exam room opens its own proctoring stream. Release the checkroom
    // preview first so we never keep two device sessions open.
    stopCameraStream();
    stopMicStream();

    router.push(`/exam/${accessCode}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#64748b' }}>Verifying assessment details...</p>
        </div>
      </div>
    );
  }

  // If student is not logged in, prompt them to sign in to take the assessment
  if (authRequired || !currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <Navbar />
        <div className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
          <div className="glass-panel" style={{ padding: '48px 36px', maxWidth: '480px', width: '100%', textAlign: 'center', background: '#ffffff', borderRadius: '12px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Lock style={{ width: '28px', height: '28px', color: '#0284c7' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)' }}>
                CODE: {accessCode}
              </span>
              <span className="badge badge-emerald">AUTHENTICATION REQUIRED</span>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Student Sign-In Required
            </h2>

            <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.5 }}>
              {assessment?.title ? (
                <>You must be signed in to take <strong>{assessment.title}</strong> so your responses and results are linked to your student profile.</>
              ) : (
                <>You must be signed in to your ExamGuard student account to take this proctored examination.</>
              )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                href={`/login?redirect=${encodeURIComponent(`/exam/${accessCode}/check`)}&role=student`}
                className="btn-primary"
                style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>Sign In to Attend Exam</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href={`/register?role=student&redirect=${encodeURIComponent(`/exam/${accessCode}/check`)}`}
                className="btn-secondary"
                style={{ padding: '12px 24px', fontSize: '0.92rem', textAlign: 'center' }}
              >
                Create New Student Account
              </Link>

              <Link
                href="/"
                style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '8px' }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If assessment has a genuine error (e.g. invalid access code)
  if (error || !assessment) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <Navbar />
        <div className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '48px', maxWidth: '500px', textAlign: 'center', background: '#ffffff' }}>
            <AlertTriangle style={{ width: '48px', height: '48px', color: '#dc2626', margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Assessment Unavailable</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              {error || `Invalid or expired access code "${accessCode}".`}
            </p>
            <Link href="/" className="btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '48px 0' }}>
        <div className="container-narrow">
          {/* Back Navigation */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href="/student"
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
              <span>Cancel &amp; Return</span>
            </Link>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)' }}>
                {assessment.accessCode}
              </span>
              <span className="badge badge-emerald">PRE-EXAM CHECKROOM</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{assessment.title}</h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px' }}>
              Verify your camera and microphone status before starting the assessment
            </p>
            {currentUser && (
              <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', color: '#475569' }}>
                <User size={13} />
                <span>Candidate: <strong>{currentUser.name}</strong> ({currentUser.email})</span>
              </div>
            )}
          </div>

          {/* Practical Exam Physical Station & Lab Banner */}
          {assessment.examType === 'PRACTICAL' && (
            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '10px',
                padding: '20px 24px',
                marginBottom: '32px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.74rem' }}>
                    {assessment.subjectCode || 'PRACTICAL LAB'}
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.74rem' }}>
                    {assessment.labName || 'Laboratory Room'}
                  </span>
                  {assessment.batchName && (
                    <span className="badge badge-purple" style={{ fontSize: '0.74rem' }}>
                      {assessment.batchName}
                    </span>
                  )}
                  <span className="badge badge-amber" style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={11} /> Whitelisted Docs Enabled
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0369a1', margin: '4px 0' }}>
                  Laboratory Workstation &amp; Terminal Verification
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#0c4a6e', margin: 0, maxWidth: '580px' }}>
                  Confirm your assigned computer number below. This maps your physical computer in the laboratory to your digital forensic telemetry audit trail.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Assigned PC Station:
                  </span>
                  <input
                    type="text"
                    value={labStation}
                    onChange={(e) => setLabStation(e.target.value.toUpperCase())}
                    placeholder="e.g. PC-14"
                    className="form-input"
                    style={{
                      width: '130px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: '#0f172a',
                      padding: '4px 8px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '32px' }}>
            {/* Left: Camera & Microphone */}
            <div className="glass-panel" style={{ padding: '28px', background: '#ffffff' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                <span>Camera &amp; Audio Status</span>
              </h3>

              {/* Video Box */}
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  borderRadius: '8px',
                  background: '#0f172a',
                  border: `2px solid ${cameraActive ? '#059669' : '#dc2626'}`,
                  position: 'relative',
                  overflow: 'hidden',
                  marginBottom: '18px',
                }}
              >
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                  }}
                >
                  <div className="pulse-dot" style={{ background: cameraActive ? '#059669' : '#dc2626' }} />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#ffffff' }}>
                    {cameraActive ? 'Camera Active' : 'Camera Offline'}
                  </span>
                </div>
              </div>

              {cameraError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '0.84rem', marginBottom: '16px' }}>
                  <AlertTriangle size={15} />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Mic Telemetry Bar */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mic style={{ width: '18px', height: '18px', color: micActive ? '#059669' : '#dc2626' }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>Microphone Status</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      {micActive ? 'Active audio connection' : 'Microphone unavailable'}
                    </div>
                  </div>
                </div>

                <AudioVisualizer stream={micStream} isActive={micActive} />
              </div>

              {micError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '0.84rem', marginTop: '10px' }}>
                  <AlertTriangle size={15} />
                  <span>{micError}</span>
                </div>
              )}

              {(!cameraActive || !micActive) && (
                <button
                  type="button"
                  onClick={requestMediaPermissions}
                  className="btn-secondary"
                  style={{ width: '100%', marginTop: '16px', padding: '10px', fontSize: '0.86rem' }}
                >
                  Retry Device Permissions
                </button>
              )}
            </div>

            {/* Right: Security Rules & Launch */}
            <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield style={{ width: '18px', height: '18px', color: '#059669' }} />
                  <span>Exam Guidelines &amp; Rules</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.88rem' }}>
                    <div style={{ color: '#dc2626', fontWeight: 700 }}>•</div>
                    <div style={{ color: '#334155' }}>
                      <strong style={{ color: '#0f172a' }}>Tab Switching:</strong> Leaving this browser tab or opening external applications will register a strike.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.88rem' }}>
                    <div style={{ color: '#dc2626', fontWeight: 700 }}>•</div>
                    <div style={{ color: '#334155' }}>
                      <strong style={{ color: '#0f172a' }}>Fullscreen Lock:</strong> Exiting full-screen mode triggers a warning strike.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.88rem' }}>
                    <div style={{ color: '#dc2626', fontWeight: 700 }}>•</div>
                    <div style={{ color: '#334155' }}>
                      <strong style={{ color: '#0f172a' }}>Strike Limit: {assessment.maxViolationsAllowed} Strikes.</strong> Exceeding this limit will immediately auto-submit and flag your test.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.88rem' }}>
                    <div style={{ color: '#0284c7', fontWeight: 700 }}>•</div>
                    <div style={{ color: '#334155' }}>
                      <strong style={{ color: '#0f172a' }}>Timer:</strong>{' '}
                      {assessment.perQuestionTimer ? (
                        <span>Each question has a strict <strong>{assessment.secondsPerQuestion}-second timer</strong>!</span>
                      ) : (
                        <span>Total examination duration is <strong>{assessment.durationMinutes} minutes</strong>.</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.88rem' }}>
                    <div style={{ color: '#0284c7', fontWeight: 700 }}>•</div>
                    <div style={{ color: '#334155' }}>
                      <strong style={{ color: '#0f172a' }}>Results Delivery:</strong>{' '}
                      {assessment.showResultImmediately ? (
                        <span>Scores and complete answer review will be presented immediately on screen upon submission.</span>
                      ) : (
                        <span>Your instructor will deliver scores and evaluations later via email to <strong>{currentUser?.email || 'your registered email'}</strong>.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <button
                    type="button"
                    onClick={testFullscreen}
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '0.86rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {fullscreenTested ? (
                      <>
                        <CheckCircle2 style={{ width: '16px', height: '16px', color: '#059669' }} />
                        <span>Fullscreen Test Passed</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 style={{ width: '16px', height: '16px' }} />
                        <span>Test Fullscreen Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    color: '#475569',
                    marginBottom: '18px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: '#059669', width: '16px', height: '16px' }}
                  />
                  <span>
                    I confirm that I am in a quiet environment and agree to stay in full screen throughout the duration of this exam.
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleLaunchExam}
                  disabled={!agreed}
                  className="btn-emerald"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.98rem',
                    opacity: agreed ? 1 : 0.5,
                  }}
                >
                  <Lock style={{ width: '18px', height: '18px' }} />
                  <span>Start Examination</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
