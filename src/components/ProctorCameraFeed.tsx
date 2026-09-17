'use client';

import React, { useEffect, useRef } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

interface ProctorCameraFeedProps {
  stream: MediaStream | null;
  violationCount: number;
  maxViolations: number;
  isFlashing?: boolean;
  compact?: boolean;
}

export default function ProctorCameraFeed({
  stream,
  violationCount,
  maxViolations,
  isFlashing = false,
  compact = false,
}: ProctorCameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Video auto-play interrupted:', err);
      });
    }
  }, [stream]);

  const width = compact ? '220px' : '280px';
  const height = compact ? '150px' : '190px';

  return (
    <div
      className={`camera-proctor-viewport ${isFlashing ? 'violation-flash' : ''}`}
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: '10px',
        overflow: 'hidden',
        background: '#0f172a',
        border: isFlashing ? '2px solid #dc2626' : '1px solid #cbd5e1',
        boxShadow: isFlashing ? '0 0 0 3px rgba(220, 38, 38, 0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Live Video Feed */}
      <video
        ref={videoRef}
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

      {/* Top Status Indicators */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          right: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            padding: '3px 8px',
            borderRadius: '4px',
          }}
        >
          <div className="pulse-dot" style={{ width: '6px', height: '6px' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.03em' }}>
            PROCTOR ACTIVE
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: violationCount > 0 ? '#dc2626' : 'rgba(15, 23, 42, 0.85)',
            padding: '3px 8px',
            borderRadius: '4px',
          }}
        >
          <AlertTriangle style={{ width: '10px', height: '10px', color: '#ffffff' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ffffff' }}>
            {violationCount}/{maxViolations} Strikes
          </span>
        </div>
      </div>

      {/* Bottom Bar: Audio Telemetry & Status */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          right: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          padding: '4px 8px',
          borderRadius: '6px',
          zIndex: 10,
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <AudioVisualizer stream={stream} isActive={!!stream} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck style={{ width: '13px', height: '13px', color: '#059669' }} />
          <span style={{ fontSize: '0.68rem', color: '#0f172a', fontWeight: 600 }}>
            Secure
          </span>
        </div>
      </div>
    </div>
  );
}
