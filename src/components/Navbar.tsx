'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, LogOut } from 'lucide-react';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  // Hide regular navbar during live proctored exam to avoid distractions
  const isExamActivePage = pathname.startsWith('/exam/') && !pathname.includes('/result') && !pathname.includes('/check');
  if (isExamActivePage) {
    return null;
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Shield style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                ExamGuard
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
              Secure Assessment Platform
            </p>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <Link
            href="/"
            style={{
              fontSize: '0.92rem',
              fontWeight: 500,
              color: pathname === '/' ? '#0f172a' : '#64748b',
              transition: 'color 0.15s',
            }}
          >
            Overview
          </Link>
          <Link
            href="/student"
            style={{
              fontSize: '0.92rem',
              fontWeight: 500,
              color: pathname.startsWith('/student') ? '#0f172a' : '#64748b',
              transition: 'color 0.15s',
            }}
          >
            Student Portal
          </Link>
          <Link
            href="/teacher"
            style={{
              fontSize: '0.92rem',
              fontWeight: 500,
              color: pathname.startsWith('/teacher') ? '#0f172a' : '#64748b',
              transition: 'color 0.15s',
            }}
          >
            Teacher Portal
          </Link>
        </nav>

        {/* Auth / Profile Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {loading ? (
            <div style={{ width: '80px', height: '36px', background: '#f1f5f9', borderRadius: '6px' }} />
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8fafc',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div className="pulse-dot" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {user.name}
                </span>
                <span
                  className={user.role === 'TEACHER' ? 'badge badge-cyan' : 'badge badge-emerald'}
                  style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                title="Sign Out"
              >
                <LogOut style={{ width: '15px', height: '15px' }} />
                <span>Exit</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link href="/login" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
                Sign In
              </Link>
              <Link href="/register" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.88rem' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
