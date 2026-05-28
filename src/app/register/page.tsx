'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Shield, Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get('role')?.toUpperCase();
  const initialRole: 'TEACHER' | 'STUDENT' = requestedRole === 'TEACHER' ? 'TEACHER' : 'STUDENT';

  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teacherInviteCode, setTeacherInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          teacherInviteCode: role === 'TEACHER' ? teacherInviteCode : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      if (data.user.role === 'TEACHER') {
        router.push('/teacher');
      } else {
        router.push('/student');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '40px', background: '#ffffff' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: '#0f172a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: '#ffffff',
              }}
            >
              <Shield style={{ width: '22px', height: '22px' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Create an Account</h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '6px' }}>
              Register to conduct assessments or attempt tests
            </p>
          </div>

          {/* Role Toggle */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '4px',
              marginBottom: '28px',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => setRole('TEACHER')}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '6px',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: role === 'TEACHER' ? '#ffffff' : 'transparent',
                color: role === 'TEACHER' ? '#0f172a' : '#64748b',
                boxShadow: role === 'TEACHER' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Teacher / Examiner
            </button>
            <button
              type="button"
              onClick={() => setRole('STUDENT')}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '6px',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: role === 'STUDENT' ? '#ffffff' : 'transparent',
                color: role === 'STUDENT' ? '#0f172a' : '#64748b',
                boxShadow: role === 'STUDENT' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Student / Candidate
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                marginBottom: '24px',
              }}
            >
              <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '18px',
                    height: '18px',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder={role === 'TEACHER' ? 'Prof. Sarah Jenkins' : 'Jordan Hayes'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '18px',
                    height: '18px',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                  required
                  maxLength={254}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Password (min 8 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '18px',
                    height: '18px',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {role === 'TEACHER' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Teacher Invite Code
                </label>
                <div style={{ position: 'relative' }}>
                  <Shield
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '18px',
                      height: '18px',
                      color: '#94a3b8',
                    }}
                  />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Provided by your administrator"
                    value={teacherInviteCode}
                    onChange={(e) => setTeacherInviteCode(e.target.value)}
                    style={{ paddingLeft: '42px' }}
                    required
                    autoComplete="off"
                  />
                </div>
                <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '6px' }}>
                  Teacher accounts require the invite code configured by the deployment owner.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: '8px', padding: '12px', width: '100%' }}
            >
              {loading ? 'Creating Account...' : `Register as ${role === 'TEACHER' ? 'Teacher' : 'Student'}`}
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.88rem', color: '#64748b' }}>
            Already have an account?{' '}
            <Link href={`/login?role=${role}`} style={{ color: '#0284c7', fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
