'use client';

import React from 'react';
import { VisionMetrics } from '@/lib/visionTelemetry';
import { AudioMetrics } from '@/lib/audioTelemetry';
import { Shield, Eye, Users, AlertCircle, Mic, Activity } from 'lucide-react';

interface AiProctorHudProps {
  vision: VisionMetrics;
  audio: AudioMetrics;
  isMediaActive: boolean;
}

export default function AiProctorHud({ vision, audio, isMediaActive }: AiProctorHudProps) {
  if (!isMediaActive) return null;

  const isFaceOk = vision.faceCount === 1;
  const isGazeOk = vision.gazeDirection === 'CENTERED' || vision.gazeDirection === 'UNKNOWN';
  const isAudioOk = !audio.isSpeechDetected;

  return (
    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* AI Telemetry Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: vision.isReady ? '#10b981' : '#f59e0b',
              boxShadow: vision.isReady ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>
            AI TELEMETRY V2.0
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
          {vision.isReady ? 'Active' : 'Initializing...'}
        </span>
      </div>

      {/* Grid of 3 Telemetry Monitors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {/* 1. Visual Face Monitor */}
        <div
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            border: `1px solid ${isFaceOk ? '#bbf7d0' : '#fecaca'}`,
            background: isFaceOk ? '#f0fdf4' : '#fef2f2',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users style={{ width: '12px', height: '12px' }} />
              <span>Face Count</span>
            </span>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: isFaceOk ? '#15803d' : '#dc2626',
              }}
            >
              {vision.faceCount === 1 ? '1 Verified' : vision.faceCount === 0 ? '0 (Absent)' : `${vision.faceCount} Detected`}
            </span>
          </div>
        </div>

        {/* 2. Gaze Tracking Monitor */}
        <div
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            border: `1px solid ${isGazeOk ? '#bbf7d0' : '#fed7aa'}`,
            background: isGazeOk ? '#f0fdf4' : '#fff7ed',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye style={{ width: '12px', height: '12px' }} />
              <span>Gaze Vector</span>
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isGazeOk ? '#15803d' : '#ea580c',
              }}
            >
              {vision.gazeDirection === 'CENTERED'
                ? 'Centered'
                : vision.gazeDirection === 'LOOKING_DOWN'
                ? 'Looking Down'
                : vision.gazeDirection === 'LOOKING_LEFT'
                ? 'Looking Left'
                : vision.gazeDirection === 'LOOKING_RIGHT'
                ? 'Looking Right'
                : 'Acquiring...'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Audio & Acoustic Activity Monitor */}
      <div
        style={{
          padding: '8px 10px',
          borderRadius: '6px',
          border: `1px solid ${isAudioOk ? '#e2e8f0' : '#fecaca'}`,
          background: isAudioOk ? '#ffffff' : '#fef2f2',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Mic style={{ width: '12px', height: '12px' }} />
            <span>Acoustic Telemetry</span>
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isAudioOk ? '#059669' : '#dc2626',
            }}
          >
            {isAudioOk ? 'Environment Quiet' : 'Voice Activity Detected'}
          </span>
        </div>

        {/* Live Audio Level Progress Bar */}
        <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, audio.volume)}%`,
              background: audio.isSpeechDetected ? '#dc2626' : audio.volume > 25 ? '#f59e0b' : '#10b981',
              transition: 'width 0.1s ease-out',
            }}
          />
        </div>
      </div>

      {/* Active Warning Banner if violation in progress */}
      {vision.warningState !== 'NORMAL' && vision.isReady && (
        <div
          style={{
            padding: '6px 10px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.74rem',
            color: '#dc2626',
            fontWeight: 600,
          }}
        >
          <AlertCircle style={{ width: '13px', height: '13px', flexShrink: 0 }} />
          <span>
            {vision.warningState === 'NO_FACE'
              ? 'Alert: Candidate face missing from frame.'
              : vision.warningState === 'MULTIPLE_FACES'
              ? 'Security Alert: Multiple individuals detected.'
              : 'Warning: Screen gaze deviation detected.'}
          </span>
        </div>
      )}
    </div>
  );
}
