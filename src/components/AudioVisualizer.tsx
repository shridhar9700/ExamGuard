'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
}

export default function AudioVisualizer({ stream, isActive }: AudioVisualizerProps) {
  const [levels, setLevels] = useState<number[]>([12, 16, 20, 14, 18, 22, 16, 12]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!stream || !isActive) {
      setLevels([8, 8, 8, 8, 8, 8, 8, 8]);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);

        const sampleBars: number[] = [];
        const step = Math.floor(bufferLength / 8) || 1;
        for (let i = 0; i < 8; i++) {
          const val = dataArray[i * step] || 0;
          const heightPercent = Math.max(12, Math.min(100, Math.round((val / 255) * 100)));
          sampleBars.push(heightPercent);
        }

        setLevels(sampleBars);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn('AudioContext visualization initialization:', err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stream, isActive]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          background: isActive ? '#ecfdf5' : '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Mic
          style={{
            width: '14px',
            height: '14px',
            color: isActive ? '#059669' : '#94a3b8',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px' }}>
        {levels.map((lvl, index) => (
          <div
            key={index}
            style={{
              width: '3.5px',
              height: `${lvl}%`,
              background: lvl > 75 ? '#d97706' : isActive ? '#059669' : '#cbd5e1',
              borderRadius: '2px',
              transition: 'height 0.08s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
