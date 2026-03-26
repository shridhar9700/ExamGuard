// Client-side AI Computer Vision Telemetry (MediaPipe BlazeFace + Gaze Estimation)

export interface VisionMetrics {
  isReady: boolean;
  faceCount: number;
  gazeDirection: 'CENTERED' | 'LOOKING_LEFT' | 'LOOKING_RIGHT' | 'LOOKING_DOWN' | 'UNKNOWN';
  confidence: number;
  warningState: 'NORMAL' | 'NO_FACE' | 'MULTIPLE_FACES' | 'GAZE_AWAY';
  boundingBox: { originX: number; originY: number; width: number; height: number } | null;
}

export interface VisionTelemetryController {
  stop: () => void;
  getMetrics: () => VisionMetrics;
}

export interface VisionCallbacks {
  onViolation?: (type: string, details: string) => void;
  onMetricsUpdate?: (metrics: VisionMetrics) => void;
}

export async function startVisionTelemetry(
  videoElement: HTMLVideoElement,
  callbacks?: VisionCallbacks
): Promise<VisionTelemetryController> {
  let isRunning = true;
  let intervalId: any = null;

  let currentMetrics: VisionMetrics = {
    isReady: false,
    faceCount: 0,
    gazeDirection: 'UNKNOWN',
    confidence: 0,
    warningState: 'NORMAL',
    boundingBox: null,
  };

  // State persistence counters (in 300ms intervals)
  let noFaceCount = 0;
  let multiFaceCount = 0;
  let gazeAwayCount = 0;

  // Generous tolerances to avoid false strikes for typing, reading, and natural head movements
  const NO_FACE_LIMIT = 30; // ~9.0 seconds of continuous complete absence
  const MULTI_FACE_LIMIT = 15; // ~4.5 seconds of sustained secondary face
  const GAZE_AWAY_LIMIT = 28; // ~8.5 seconds of continuous lateral deviation (looking completely away)

  // Cooldown timers to prevent rapid repeated strikes
  let lastNoFaceStrikeTime = 0;
  let lastMultiFaceStrikeTime = 0;
  let lastGazeStrikeTime = 0;
  const STRIKE_COOLDOWN_MS = 20000; // 20 seconds cooldown between strikes of the same type

  try {
    // Dynamic import to prevent SSR issues
    const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision');

    // Initialize using local WASM and BlazeFace TFLite model from /public
    const vision = await FilesetResolver.forVisionTasks('/wasm');
    const faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/models/blaze_face_short_range.tflite',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.5,
    });

    currentMetrics.isReady = true;

    const processFrame = () => {
      if (!isRunning || !videoElement || videoElement.readyState < 2) return;

      try {
        const now = performance.now();
        const results = faceDetector.detectForVideo(videoElement, now);
        const detections = results?.detections || [];
        const count = detections.length;

        let gaze: VisionMetrics['gazeDirection'] = 'UNKNOWN';
        let warning: VisionMetrics['warningState'] = 'NORMAL';
        let box: VisionMetrics['boundingBox'] = null;
        let conf = 0;

        if (count === 1) {
          const det = detections[0];
          conf = det.categories?.[0]?.score || 0.9;
          const b = det.boundingBox;
          if (b) {
            box = {
              originX: b.originX,
              originY: b.originY,
              width: b.width,
              height: b.height,
            };
          }

          // Keypoints gaze analysis:
          // 0: Right eye, 1: Left eye, 2: Nose tip, 3: Mouth, 4: Right ear, 5: Left ear
          const kp = det.keypoints;
          if (kp && kp.length >= 4) {
            const rightEye = kp[0];
            const leftEye = kp[1];
            const nose = kp[2];

            const eyeMidX = (rightEye.x + leftEye.x) / 2;
            const eyeMidY = (rightEye.y + leftEye.y) / 2;
            const eyeDist = Math.max(0.01, Math.abs(rightEye.x - leftEye.x));

            // Normalized offsets
            const xOffset = (nose.x - eyeMidX) / eyeDist;
            const yOffset = (nose.y - eyeMidY) / eyeDist;

            // Only flag extreme lateral deviations
            if (xOffset > 0.48) {
              gaze = 'LOOKING_RIGHT';
            } else if (xOffset < -0.48) {
              gaze = 'LOOKING_LEFT';
            } else if (yOffset > 1.2) {
              // Looking down at keyboard or screen
              gaze = 'LOOKING_DOWN';
            } else {
              gaze = 'CENTERED';
            }
          } else {
            gaze = 'CENTERED';
          }

          // Evaluate warnings:
          // LOOKING_DOWN is completely normal and expected while typing on a keyboard or reading code.
          // NEVER issue an integrity strike for looking down!
          if (gaze === 'LOOKING_LEFT' || gaze === 'LOOKING_RIGHT') {
            warning = 'GAZE_AWAY';
            gazeAwayCount++;
            noFaceCount = Math.max(0, noFaceCount - 2);
            multiFaceCount = Math.max(0, multiFaceCount - 2);

            const timestamp = Date.now();
            if (gazeAwayCount >= GAZE_AWAY_LIMIT && timestamp - lastGazeStrikeTime > STRIKE_COOLDOWN_MS) {
              lastGazeStrikeTime = timestamp;
              gazeAwayCount = 0;
              callbacks?.onViolation?.(
                'GAZE_DEVIATION',
                `Persistent sideways gaze deviation detected (looking away for >8 seconds)`
              );
            }
          } else {
            // Centered or looking down at keyboard - healthy, legitimate engagement
            warning = 'NORMAL';
            gazeAwayCount = Math.max(0, gazeAwayCount - 3);
            noFaceCount = Math.max(0, noFaceCount - 2);
            multiFaceCount = Math.max(0, multiFaceCount - 2);
          }
        } else if (count === 0) {
          warning = 'NO_FACE';
          gaze = 'UNKNOWN';
          noFaceCount++;
          multiFaceCount = Math.max(0, multiFaceCount - 2);
          gazeAwayCount = Math.max(0, gazeAwayCount - 2);

          const timestamp = Date.now();
          if (noFaceCount >= NO_FACE_LIMIT && timestamp - lastNoFaceStrikeTime > STRIKE_COOLDOWN_MS) {
            lastNoFaceStrikeTime = timestamp;
            noFaceCount = 0;
            callbacks?.onViolation?.(
              'NO_FACE',
              'Candidate absence detected: No face present in examination camera perimeter for >9s'
            );
          }
        } else {
          // Multiple faces
          warning = 'MULTIPLE_FACES';
          gaze = 'UNKNOWN';
          multiFaceCount++;
          noFaceCount = Math.max(0, noFaceCount - 2);
          gazeAwayCount = Math.max(0, gazeAwayCount - 2);

          const timestamp = Date.now();
          if (multiFaceCount >= MULTI_FACE_LIMIT && timestamp - lastMultiFaceStrikeTime > STRIKE_COOLDOWN_MS) {
            lastMultiFaceStrikeTime = timestamp;
            multiFaceCount = 0;
            callbacks?.onViolation?.(
              'MULTIPLE_FACES',
              `Security perimeter breach: ${count} individuals detected simultaneously in camera feed`
            );
          }
        }

        currentMetrics = {
          isReady: true,
          faceCount: count,
          gazeDirection: gaze,
          confidence: Math.round(conf * 100),
          warningState: warning,
          boundingBox: box,
        };

        callbacks?.onMetricsUpdate?.(currentMetrics);
      } catch (err) {
        console.warn('Vision detection cycle warning:', err);
      }
    };

    // Run frame detection every 300ms (balanced CPU and high responsiveness)
    intervalId = setInterval(processFrame, 300);
  } catch (initErr) {
    console.error('MediaPipe Vision failed to initialize:', initErr);
  }

  return {
    stop: () => {
      isRunning = false;
      if (intervalId) clearInterval(intervalId);
    },
    getMetrics: () => currentMetrics,
  };
}
