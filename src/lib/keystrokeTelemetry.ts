// ExamGuard Digital Forensic Keystroke & Cadence Telemetry Engine

export interface PasteEventRecord {
  id: string;
  timestamp: string;
  charCount: number;
  lineCount: number;
  snippet: string;
  isSuspicious: boolean;
  targetFilename: string;
}

export interface KeystrokeMetricsSummary {
  totalKeystrokes: number;
  printableKeyCount: number;
  backspaceCount: number;
  deleteCount: number;
  arrowKeyCount: number;
  pasteEventCount: number;
  suspiciousPasteCount: number;
  pasteEvents: PasteEventRecord[];
  averageWpm: number;
  currentWpm: number;
  maxWpmBurst: number;
  organicCadenceScore: number; // 0 - 100%
  integrityRating: 'AUTHENTIC' | 'SUSPICIOUS_PASTE' | 'ANOMALOUS_BURST';
  lastActivityTimestamp: string;
}

export interface CodeSnapshotRecord {
  snapshotIndex: number;
  timestamp: string;
  elapsedSeconds: number;
  taskId: string;
  files: { filename: string; content: string; length: number; lineCount: number }[];
  totalKeystrokesAtSnapshot: number;
  pasteCountAtSnapshot: number;
  wpmAtSnapshot: number;
  deltaCharCount: number;
  flag?: string | null;
}

export class KeystrokeTelemetryCollector {
  private totalKeystrokes = 0;
  private printableKeyCount = 0;
  private backspaceCount = 0;
  private deleteCount = 0;
  private arrowKeyCount = 0;
  private pasteEvents: PasteEventRecord[] = [];

  private keyTimestamps: number[] = [];
  private lastKeyTime: number = Date.now();
  private maxBurstWpm = 0;
  private startTime: number = Date.now();

  // Sliding window for instantaneous WPM (last 10 seconds)
  private recentKeys: number[] = [];

  constructor() {
    this.startTime = Date.now();
    this.lastKeyTime = Date.now();
  }

  // Record a single keystroke event
  public recordKeyEvent(e: { key: string; ctrlKey?: boolean; metaKey?: boolean }) {
    const now = Date.now();
    this.totalKeystrokes++;
    this.keyTimestamps.push(now);
    this.recentKeys.push(now);

    // Filter recent keys to last 10 seconds for real-time WPM
    this.recentKeys = this.recentKeys.filter((t) => now - t <= 10000);

    if (e.key === 'Backspace') {
      this.backspaceCount++;
    } else if (e.key === 'Delete') {
      this.deleteCount++;
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      this.arrowKeyCount++;
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      this.printableKeyCount++;
    }

    // Check instantaneous WPM burst
    const currentWpm = this.calculateInstantaneousWpm();
    if (currentWpm > this.maxBurstWpm) {
      this.maxBurstWpm = Math.min(250, currentWpm);
    }

    this.lastKeyTime = now;
  }

  // Record a clipboard paste event
  public recordPasteEvent(pastedText: string, targetFilename: string): PasteEventRecord {
    const now = new Date().toISOString();
    const charCount = pastedText.length;
    const lineCount = pastedText.split('\n').length;

    // A paste is considered suspicious if > 75 characters or multi-line (> 2 lines)
    const isSuspicious = charCount > 75 || lineCount > 2;

    const record: PasteEventRecord = {
      id: `paste_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      charCount,
      lineCount,
      snippet: pastedText.slice(0, 70).replace(/\s+/g, ' '),
      isSuspicious,
      targetFilename,
    };

    this.pasteEvents.push(record);
    return record;
  }

  // Calculate real-time instantaneous WPM
  public calculateInstantaneousWpm(): number {
    const now = Date.now();
    const validRecent = this.recentKeys.filter((t) => now - t <= 10000);
    if (validRecent.length < 3) return 0;

    // Standard formula: (characters / 5) / (minutes)
    const minutes = 10 / 60; // 10-second window
    const words = validRecent.length / 5;
    return Math.round(words / minutes);
  }

  // Calculate session average WPM
  public calculateAverageWpm(): number {
    const elapsedMinutes = Math.max(0.1, (Date.now() - this.startTime) / 60000);
    const words = this.printableKeyCount / 5;
    return Math.round(words / elapsedMinutes);
  }

  // Calculate Organic Cadence Score (0 - 100)
  // Human typing features natural backspacing (~8-20% edits) and high keystroke-to-character ratio.
  // Paste-injected solutions have virtually zero backspaces and very low keystrokes compared to characters.
  public calculateOrganicCadenceScore(totalCodeLength: number): number {
    if (this.totalKeystrokes === 0 && totalCodeLength === 0) return 100;
    if (this.totalKeystrokes === 0 && totalCodeLength > 100) return 15; // Pasted without typing

    let score = 100;

    // 1. Ratio of keystrokes to code length:
    // Natural coding typically takes 1.2x to 3.5x as many keys as the final code length due to iterations
    if (totalCodeLength > 150) {
      const ratio = this.totalKeystrokes / totalCodeLength;
      if (ratio < 0.3) {
        // Less than 30% of characters were typed!
        score -= 50;
      } else if (ratio < 0.6) {
        score -= 25;
      }
    }

    // 2. Penalty for large suspicious pastes:
    const suspiciousPastes = this.pasteEvents.filter((p) => p.isSuspicious);
    score -= suspiciousPastes.length * 15;

    // 3. Natural backspace bonus (showing human debugging):
    const backspaceRatio = this.backspaceCount / Math.max(1, this.printableKeyCount);
    if (backspaceRatio >= 0.05 && backspaceRatio <= 0.35) {
      score += 5; // Healthy editing cadence
    }

    return Math.max(10, Math.min(100, Math.round(score)));
  }

  // Get current integrity rating
  public getIntegrityRating(organicScore: number): 'AUTHENTIC' | 'SUSPICIOUS_PASTE' | 'ANOMALOUS_BURST' {
    const suspiciousPastes = this.pasteEvents.filter((p) => p.isSuspicious);
    if (suspiciousPastes.length >= 2 || organicScore < 40) {
      return 'SUSPICIOUS_PASTE';
    }
    if (this.maxBurstWpm > 180) {
      return 'ANOMALOUS_BURST';
    }
    return 'AUTHENTIC';
  }

  // Serialize current metrics
  public getMetricsSummary(totalCodeLength: number = 0): KeystrokeMetricsSummary {
    const organicScore = this.calculateOrganicCadenceScore(totalCodeLength);
    return {
      totalKeystrokes: this.totalKeystrokes,
      printableKeyCount: this.printableKeyCount,
      backspaceCount: this.backspaceCount,
      deleteCount: this.deleteCount,
      arrowKeyCount: this.arrowKeyCount,
      pasteEventCount: this.pasteEvents.length,
      suspiciousPasteCount: this.pasteEvents.filter((p) => p.isSuspicious).length,
      pasteEvents: [...this.pasteEvents],
      averageWpm: this.calculateAverageWpm(),
      currentWpm: this.calculateInstantaneousWpm(),
      maxWpmBurst: this.maxBurstWpm,
      organicCadenceScore: organicScore,
      integrityRating: this.getIntegrityRating(organicScore),
      lastActivityTimestamp: new Date(this.lastKeyTime).toISOString(),
    };
  }
}
