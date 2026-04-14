'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Shield,
  Video,
  Mic,
  Maximize2,
  Clock,
  ArrowRight,
  Award,
  CheckCircle2,
  Database,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = accessCode.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data?.user) {
        router.push(`/login?redirect=${encodeURIComponent(`/exam/${code}/check`)}&role=student`);
        return;
      }
      if (data.user.role !== 'STUDENT') {
        router.push('/teacher');
        return;
      }
      router.push(`/exam/${code}/check`);
    } catch {
      router.push(`/exam/${code}/check`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1, paddingBottom: '96px' }}>
        {/* Hero Section */}
        <section style={{ padding: '80px 0 60px 0', textAlign: 'center' }}>
          <div className="container">
            {/* Header Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                padding: '6px 16px',
                borderRadius: '6px',
                marginBottom: '28px',
              }}
            >
              <Shield style={{ width: '15px', height: '15px', color: '#0f172a' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
                Secure Online Examination Platform
              </span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.03em',
                color: '#0f172a',
                maxWidth: '900px',
                margin: '0 auto 24px auto',
              }}
            >
              ExamGuard — Secure Online Assessments &amp; Examinations
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
                color: '#475569',
                maxWidth: '720px',
                margin: '0 auto 48px auto',
                lineHeight: 1.6,
              }}
            >
              Institutional-grade assessment software designed with real-time camera telemetry,
              audio environment monitoring, strict full-screen lockdown, and customizable per-question timers.
            </p>

            {/* Two Action Panels: Teacher vs Student */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '32px',
                maxWidth: '960px',
                margin: '0 auto',
                textAlign: 'left',
              }}
            >
              {/* Teacher Portal Card */}
              <div
                className="glass-panel glass-panel-interactive"
                style={{
                  padding: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Shield style={{ width: '22px', height: '22px', color: '#0f172a' }} />
                    </div>
                    <span className="badge badge-cyan">Examiner Workspace</span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                    Teacher Portal
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.6 }}>
                    Create assessments, configure question-level countdown timers, enforce violation limits, and audit candidate submissions.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link
                    href="/teacher"
                    className="btn-primary"
                    style={{ padding: '12px', textAlign: 'center' }}
                  >
                    <span>Go to Teacher Dashboard</span>
                    <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </Link>

                  <Link
                    href="/teacher/create"
                    className="btn-secondary"
                    style={{ padding: '12px', textAlign: 'center' }}
                  >
                    Create New Assessment
                  </Link>
                </div>
              </div>

              {/* Student Portal Card */}
              <div
                className="glass-panel glass-panel-interactive"
                style={{
                  padding: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Award style={{ width: '22px', height: '22px', color: '#059669' }} />
                    </div>
                    <span className="badge badge-emerald">Candidate Portal</span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                    Student Portal
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '20px', lineHeight: 1.6 }}>
                    Enter your instructor-provided assessment access code to complete pre-exam verification and take your test.
                  </p>

                  {/* Direct Access Code Input */}
                  <form onSubmit={handleAccessCodeSubmit} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter Access Code"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        style={{
                          textTransform: 'uppercase',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                        }}
                      />
                      <button
                        type="submit"
                        className="btn-emerald"
                        style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}
                      >
                        <span>Start</span>
                        <ArrowRight style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </form>
                </div>

                <Link
                  href="/student"
                  className="btn-secondary"
                  style={{ padding: '12px', textAlign: 'center' }}
                >
                  View All Enrolled Tests
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section style={{ padding: '60px 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                Assessment Integrity Features
              </h2>
              <p style={{ color: '#64748b', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
                Built to deliver reliable, tamper-resistant examination experiences for academic and certification needs.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
              }}
            >
              <div className="glass-panel" style={{ padding: '28px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Video style={{ width: '20px', height: '20px', color: '#0284c7' }} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Camera Monitoring
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Active visual feed during the exam ensures candidate presence without invasive external software installations.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '28px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Mic style={{ width: '20px', height: '20px', color: '#059669' }} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Microphone Activity
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Web Audio API frequency analyzer measures ambient noise and vocal activity in the candidate testing area.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '28px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Maximize2 style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Fullscreen &amp; Tab Lock
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Exiting full screen, minimizing the window, or switching browser tabs issues strikes and auto-terminates upon limit.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '28px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Clock style={{ width: '20px', height: '20px', color: '#d97706' }} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Per-Question Timers
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Instructors can configure precise countdowns per MCQ or overall test durations with automatic question progression.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Institutional Footer */}
      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: '24px 0',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.88rem',
        }}
      >
        <div className="container">
          ExamGuard — Secure Assessment Platform &copy; 2026. Built with Next.js and PostgreSQL.
        </div>
      </footer>
    </div>
  );
}
