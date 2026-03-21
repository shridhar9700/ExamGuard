// Client-side Web Audio API Acoustic & Voice Activity Telemetry

export interface AudioMetrics {
  volume: number; // 0 to 100
  isSpeechDetected: boolean;
  frequencyBand: 'SILENT' | 'AMBIENT' | 'SPEECH';
}

export interface AudioTelemetryController {
  stop: () => void;
  getMetrics: () => AudioMetrics;
}

export function startAudioTelemetry(
  stream: MediaStream,
  onSpeechWarning?: (durationSec: number) => void
): AudioTelemetryController {
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let animationId: number | null = null;
  let isRunning = true;

  let currentMetrics: AudioMetrics = {
    volume: 0,
    isSpeechDetected: false,
    frequencyBand: 'SILENT',
  };

  let speechDurationFrames = 0;
  const SPEECH_TRIGGER_FRAMES = 90; // ~3.0 seconds at ~30 checks/sec

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this browser.');
      return { stop: () => {}, getMetrics: () => currentMetrics };
    }

    audioCtx = new AudioContextClass();
    source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.4;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);
    const sampleRate = audioCtx.sampleRate;
    const binSize = sampleRate / analyser.fftSize;

    // Vocal range bin indices (~120 Hz to ~2600 Hz)
    const vocalMinBin = Math.floor(120 / binSize);
    const vocalMaxBin = Math.min(Math.floor(2600 / binSize), bufferLength - 1);

    const analyze = () => {
      if (!isRunning || !analyser) return;

      analyser.getByteTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);

      // 1. Calculate RMS volume (0 - 100)
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const norm = (timeData[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);
      const volumeLevel = Math.min(100, Math.round(rms * 280));

      // 2. Calculate energy in speech frequency band vs total energy
      let vocalEnergy = 0;
      let totalEnergy = 0;

      for (let i = 0; i < bufferLength; i++) {
        const val = freqData[i];
        totalEnergy += val;
        if (i >= vocalMinBin && i <= vocalMaxBin) {
          vocalEnergy += val;
        }
      }

      const vocalRatio = totalEnergy > 0 ? vocalEnergy / totalEnergy : 0;
      // Speech heuristic: noticeable volume (> 12) with concentration in vocal band (> 55% of spectrum)
      const isSpeech = volumeLevel > 14 && vocalRatio > 0.52;

      let band: 'SILENT' | 'AMBIENT' | 'SPEECH' = 'SILENT';
      if (volumeLevel < 6) {
        band = 'SILENT';
      } else if (isSpeech) {
        band = 'SPEECH';
      } else {
        band = 'AMBIENT';
      }

      currentMetrics = {
        volume: volumeLevel,
        isSpeechDetected: isSpeech,
        frequencyBand: band,
      };

      if (isSpeech) {
        speechDurationFrames++;
        if (speechDurationFrames === SPEECH_TRIGGER_FRAMES) {
          if (onSpeechWarning) {
            onSpeechWarning(Math.round(speechDurationFrames / 30));
          }
        }
      } else {
        // Reset or decay speech frames
        speechDurationFrames = Math.max(0, speechDurationFrames - 2);
      }

      animationId = requestAnimationFrame(analyze);
    };

    analyze();
  } catch (err) {
    console.warn('Audio telemetry initialization error:', err);
  }

  return {
    stop: () => {
      isRunning = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (source) source.disconnect();
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    },
    getMetrics: () => currentMetrics,
  };
}
