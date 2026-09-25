import { AiUsageStats } from '../types.ts';

type UsageListener = (stats: AiUsageStats) => void;

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateNextMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime();
}

function computeCountdown(resetTimestamp: number) {
  const now = Date.now();
  const msRemaining = Math.max(0, resetTimestamp - now);
  const hours = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((msRemaining % (1000 * 60)) / 1000);

  let formattedArabic = '';
  if (hours > 0) {
    formattedArabic = `بعد ${hours} س و ${minutes} د`;
  } else if (minutes > 0) {
    formattedArabic = `بعد ${minutes} دقيقة و ${seconds} ثانية`;
  } else {
    formattedArabic = `بعد ${seconds} ثانية`;
  }

  return { hours, minutes, seconds, formattedArabic };
}

const DEFAULT_LIMIT = 500;
const DEFAULT_TOKENS_LIMIT = 2000000;

class AiUsageManager {
  private stats: AiUsageStats;
  private listeners: Set<UsageListener> = new Set();
  private tickerInterval: any = null;

  constructor() {
    const today = getTodayString();
    const stored = this.loadFromStorage();
    const nextMidnight = calculateNextMidnight();

    if (stored && stored.date === today) {
      this.stats = {
        ...stored,
        totalTokens: stored.totalTokens || 0,
        promptTokens: stored.promptTokens || 0,
        candidatesTokens: stored.candidatesTokens || 0,
        tokensLimit: stored.tokensLimit || DEFAULT_TOKENS_LIMIT,
        tokensPercent: stored.tokensPercent || 0,
        resetTimestamp: nextMidnight,
        resetCountdown: computeCountdown(nextMidnight),
      };
    } else {
      this.stats = {
        date: today,
        used: 4,
        limit: DEFAULT_LIMIT,
        remaining: DEFAULT_LIMIT - 4,
        percent: Math.round((4 / DEFAULT_LIMIT) * 100),
        totalTokens: 3820,
        promptTokens: 1480,
        candidatesTokens: 2340,
        tokensLimit: DEFAULT_TOKENS_LIMIT,
        tokensPercent: Math.round((3820 / DEFAULT_TOKENS_LIMIT) * 100),
        resetTimestamp: nextMidnight,
        resetTimeFormatted: '12:00 منتصف الليل',
        resetCountdown: computeCountdown(nextMidnight),
        breakdown: {
          tutorQueries: 4,
          ttsGenerations: 0,
          tutor: {
            queries: 4,
            limit: 150,
            tokens: 3820,
            promptTokens: 1480,
            candidatesTokens: 2340,
            lastModel: 'gemini-3.8-flash',
          },
          tts: {
            queries: 0,
            limit: 250,
            tokens: 0,
            promptTokens: 0,
            candidatesTokens: 0,
            lastModel: 'gemini-3.8-flash-lite-tts',
          },
        },
        isExceeded: false,
      };
      this.saveToStorage(this.stats);
    }

    this.startTicker();
    // Sync with server on initialization
    this.refreshFromServer();
  }

  private loadFromStorage(): AiUsageStats | null {
    try {
      const data = localStorage.getItem('selah_ai_usage');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(stats: AiUsageStats) {
    try {
      localStorage.setItem('selah_ai_usage', JSON.stringify(stats));
    } catch {
      // ignore
    }
  }

  private startTicker() {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => {
      const today = getTodayString();
      if (this.stats.date !== today) {
        this.resetForNewDay(today);
        return;
      }

      const nextMidnight = this.stats.resetTimestamp || calculateNextMidnight();
      const updatedCountdown = computeCountdown(nextMidnight);
      
      this.stats = {
        ...this.stats,
        resetCountdown: updatedCountdown,
      };
      this.notify();
    }, 1000);
  }

  private resetForNewDay(newDate: string) {
    const nextMidnight = calculateNextMidnight();
    this.stats = {
      date: newDate,
      used: 0,
      limit: DEFAULT_LIMIT,
      remaining: DEFAULT_LIMIT,
      percent: 0,
      totalTokens: 0,
      promptTokens: 0,
      candidatesTokens: 0,
      tokensLimit: DEFAULT_TOKENS_LIMIT,
      tokensPercent: 0,
      resetTimestamp: nextMidnight,
      resetTimeFormatted: '12:00 منتصف الليل',
      resetCountdown: computeCountdown(nextMidnight),
      breakdown: {
        tutorQueries: 0,
        ttsGenerations: 0,
        tutor: {
          queries: 0,
          limit: 20,
          tokens: 0,
          promptTokens: 0,
          candidatesTokens: 0,
          lastModel: 'gemini-3.8-flash',
        },
        tts: {
          queries: 0,
          limit: 10,
          tokens: 0,
          promptTokens: 0,
          candidatesTokens: 0,
          lastModel: 'gemini-3.1-flash-tts-preview',
        },
      },
      isExceeded: false,
    };
    this.saveToStorage(this.stats);
    this.notify();
  }

  public getStats(): AiUsageStats {
    return this.stats;
  }

  public subscribe(listener: UsageListener): () => void {
    this.listeners.add(listener);
    // Send state on next tick
    Promise.resolve().then(() => {
      if (this.listeners.has(listener)) {
        listener(this.stats);
      }
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.stats);
      } catch (err) {
        console.error('Error in AiUsage listener:', err);
      }
    });
  }

  public async refreshFromServer(): Promise<AiUsageStats> {
    try {
      const res = await fetch('/api/ai-usage');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.used === 'number') {
          const nextMidnight = data.resetTimestamp || calculateNextMidnight();
          this.stats = {
            ...data,
            resetTimestamp: nextMidnight,
            resetCountdown: computeCountdown(nextMidnight),
          };
          this.saveToStorage(this.stats);
          this.notify();
          return this.stats;
        }
      }
    } catch {
      // Offline fallback: keep local stats
    }
    return this.stats;
  }

  public recordUsage(type: 'tutor' | 'tts', estimatedTokens?: number) {
    const today = getTodayString();
    if (this.stats.date !== today) {
      this.resetForNewDay(today);
    }

    const currentUsed = this.stats.used + 1;
    const limit = this.stats.limit || DEFAULT_LIMIT;
    const remaining = Math.max(0, limit - currentUsed);
    const percent = Math.min(100, Math.round((currentUsed / limit) * 100));

    const addedTok = estimatedTokens || (type === 'tutor' ? 850 : 420);
    const totalTokens = (this.stats.totalTokens || 0) + addedTok;
    const tokensLimit = this.stats.tokensLimit || DEFAULT_TOKENS_LIMIT;
    const tokensPercent = Math.min(100, Math.round((totalTokens / tokensLimit) * 100));

    const breakdown = { ...this.stats.breakdown };
    if (type === 'tutor') {
      breakdown.tutorQueries += 1;
      if (breakdown.tutor) {
        breakdown.tutor = {
          ...breakdown.tutor,
          queries: breakdown.tutorQueries,
          tokens: breakdown.tutor.tokens + addedTok,
        };
      }
    }
    if (type === 'tts') {
      breakdown.ttsGenerations += 1;
      if (breakdown.tts) {
        breakdown.tts = {
          ...breakdown.tts,
          queries: breakdown.ttsGenerations,
          tokens: breakdown.tts.tokens + addedTok,
        };
      }
    }

    this.stats = {
      ...this.stats,
      used: currentUsed,
      remaining,
      percent,
      totalTokens,
      tokensPercent,
      breakdown,
      isExceeded: currentUsed >= limit,
    };

    this.saveToStorage(this.stats);
    this.notify();
  }

  public recordQuotaExceeded(service: 'tts' | 'tutor', retryDelay?: string, message?: string) {
    const breakdown = { ...this.stats.breakdown };
    if (service === 'tts') {
      const limit = breakdown.tts?.limit || 10;
      breakdown.ttsGenerations = Math.max(breakdown.ttsGenerations || 0, limit);
      if (breakdown.tts) {
        breakdown.tts = {
          ...breakdown.tts,
          queries: Math.max(breakdown.tts.queries || 0, limit),
          isExceeded: true,
        };
      }
    } else if (service === 'tutor') {
      const limit = breakdown.tutor?.limit || 20;
      breakdown.tutorQueries = Math.max(breakdown.tutorQueries || 0, limit);
      if (breakdown.tutor) {
        breakdown.tutor = {
          ...breakdown.tutor,
          queries: Math.max(breakdown.tutor.queries || 0, limit),
          isExceeded: true,
        };
      }
    }

    const totalUsed = (breakdown.tutorQueries || 0) + (breakdown.ttsGenerations || 0);
    const limit = this.stats.limit || DEFAULT_LIMIT;

    this.stats = {
      ...this.stats,
      used: totalUsed,
      remaining: Math.max(0, limit - totalUsed),
      percent: Math.min(100, Math.round((totalUsed / limit) * 100)),
      quotaWarning: {
        service,
        retryDelay,
        message,
      },
      breakdown,
      isExceeded: totalUsed >= limit,
    };

    this.saveToStorage(this.stats);
    this.notify();
  }

  public updateFromServerPayload(serverUsage: any) {
    if (!serverUsage || typeof serverUsage.used !== 'number') return;
    const nextMidnight = serverUsage.resetTimestamp || calculateNextMidnight();

    // Ensure if quotaWarning exists for a service, queries reflects that the quota is reached
    const breakdown = { ...serverUsage.breakdown };
    if (serverUsage.quotaWarning?.service === 'tts' || breakdown.tts?.isExceeded) {
      const ttsLimit = breakdown.tts?.limit || 10;
      breakdown.ttsGenerations = Math.max(breakdown.ttsGenerations || 0, ttsLimit);
      if (breakdown.tts) {
        breakdown.tts = {
          ...breakdown.tts,
          queries: Math.max(breakdown.tts.queries || 0, ttsLimit),
          isExceeded: true,
        };
      }
    }
    if (serverUsage.quotaWarning?.service === 'tutor' || breakdown.tutor?.isExceeded) {
      const tutorLimit = breakdown.tutor?.limit || 20;
      breakdown.tutorQueries = Math.max(breakdown.tutorQueries || 0, tutorLimit);
      if (breakdown.tutor) {
        breakdown.tutor = {
          ...breakdown.tutor,
          queries: Math.max(breakdown.tutor.queries || 0, tutorLimit),
          isExceeded: true,
        };
      }
    }

    const totalUsed = (breakdown.tutorQueries || 0) + (breakdown.ttsGenerations || 0);

    this.stats = {
      ...serverUsage,
      used: Math.max(serverUsage.used, totalUsed),
      breakdown,
      resetTimestamp: nextMidnight,
      resetCountdown: computeCountdown(nextMidnight),
    };
    this.saveToStorage(this.stats);
    this.notify();
  }
}

export const aiUsageService = new AiUsageManager();
