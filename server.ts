import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { GoogleGenAI, Modality } from "@google/genai";
import { allUnits } from "./src/data/index.ts";
import { answerArabicTutorDirectly } from "./src/utils/arabicPedagogyEngine.ts";
import "dotenv/config";
import { createServer as createViteServer } from "vite";

// Root directory of application (safe in both CJS and ESM execution)
const appRootDir = process.cwd();

// Safe audio directory determination (supports local, Cloud Run, and Vercel serverless /tmp)
function resolveAudioDir(): string {
  const preferredDir = path.join(appRootDir, "public", "audio");
  try {
    if (!fs.existsSync(preferredDir)) {
      fs.mkdirSync(preferredDir, { recursive: true });
    }
    const testFile = path.join(preferredDir, ".test_write");
    fs.writeFileSync(testFile, "1");
    fs.unlinkSync(testFile);
    return preferredDir;
  } catch {
    const tmpDir = path.join(os.tmpdir(), "selah_audio");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch {
      return os.tmpdir();
    }
  }
}

const AUDIO_DIR = resolveAudioDir();

// Fast in-memory audio snippet cache for instantaneous playback (0ms)
const audioMemoryCache = new Map<string, {
  rawBase64: string;
  dataUrl: string;
  rate: number;
  mimeType: string;
  voice: string;
  timestamp: number;
}>();
const MAX_MEMORY_CACHE_ITEMS = 250;

// Helper to convert Base64 PCM to WAV Buffer on server
function pcmBase64ToWavBuffer(base64Data: string, sampleRate = 24000, numChannels = 1): Buffer {
  const pcmBuffer = Buffer.from(base64Data, "base64");
  const dataSize = pcmBuffer.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const wavBuffer = Buffer.alloc(totalSize);

  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;

  // RIFF header
  wavBuffer.write("RIFF", 0);
  wavBuffer.writeUInt32LE(36 + dataSize, 4);
  wavBuffer.write("WAVE", 8);
  wavBuffer.write("fmt ", 12);
  wavBuffer.writeUInt32LE(16, 16);
  wavBuffer.writeUInt16LE(1, 20); // PCM
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(16, 34); // 16-bit
  wavBuffer.write("data", 36);
  wavBuffer.writeUInt32LE(dataSize, 40);

  pcmBuffer.copy(wavBuffer, headerSize);
  return wavBuffer;
}

export const app = express();

// CORS middleware for iframe, Vercel preview, and cross-origin environments
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, x-gemini-api-key");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use("/audio", express.static(AUDIO_DIR));

// Initialize Gemini client (supports server env and Vercel env)
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint (both /api/health and /health)
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
    audioDir: AUDIO_DIR,
    memoryCacheCount: audioMemoryCache.size,
  });
});

  // AI Daily Usage & Quota Tracker (Safe for local, Cloud Run, and Vercel serverless /tmp)
  let inMemoryUsage: any = null;

  function getUsageFilePath(): string {
    const localDir = path.join(appRootDir, "public", "audio");
    try {
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const testFile = path.join(localDir, ".check");
      fs.writeFileSync(testFile, "1");
      fs.unlinkSync(testFile);
      return path.join(localDir, "ai_usage.json");
    } catch {
      return path.join(os.tmpdir(), "ai_usage.json");
    }
  }

  const USAGE_FILE = getUsageFilePath();
  const DAILY_LIMIT = 500;
  const DAILY_TOKENS_LIMIT = 2000000;
  const TTS_DAILY_LIMIT = 250;
  const TUTOR_DAILY_LIMIT = 150;

  interface AiUsageRecord {
    date: string;
    tutorQueries: number;
    ttsGenerations: number;
    totalUsed: number;
    dailyLimit: number;
    totalTokens: number;
    promptTokens: number;
    candidatesTokens: number;
    dailyTokensLimit: number;
    tutorTokens: number;
    tutorPromptTokens: number;
    tutorCandidatesTokens: number;
    tutorLastModel: string;
    ttsTokens: number;
    ttsPromptTokens: number;
    ttsCandidatesTokens: number;
    ttsLastModel: string;
    lastApiCall?: {
      service: "tutor" | "tts";
      model: string;
      promptTokens: number;
      candidatesTokens: number;
      totalTokens: number;
      timestamp: string;
    };
    quotaWarning?: {
      service: "tutor" | "tts";
      retryDelay?: string;
      message?: string;
    } | null;
    lastUpdated: string;
  }

  function getTodayString(): string {
    return new Date().toISOString().split("T")[0];
  }

  function getNextMidnightTimestamp(): number {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    return nextMidnight.getTime();
  }

  function loadAiUsage(): AiUsageRecord {
    const today = getTodayString();
    if (inMemoryUsage && inMemoryUsage.date === today) {
      return inMemoryUsage;
    }
    try {
      if (fs.existsSync(USAGE_FILE)) {
        const raw = fs.readFileSync(USAGE_FILE, "utf-8");
        const data = JSON.parse(raw);
        if (data && data.date === today) {
          const tutorQ = Number(data.tutorQueries) || 0;
          const ttsG = Number(data.ttsGenerations) || 0;
          inMemoryUsage = {
            date: today,
            tutorQueries: tutorQ,
            ttsGenerations: ttsG,
            totalUsed: tutorQ + ttsG,
            dailyLimit: Number(data.dailyLimit) || DAILY_LIMIT,
            totalTokens: Number(data.totalTokens) || 0,
            promptTokens: Number(data.promptTokens) || 0,
            candidatesTokens: Number(data.candidatesTokens) || 0,
            dailyTokensLimit: Number(data.dailyTokensLimit) || DAILY_TOKENS_LIMIT,
            tutorTokens: Number(data.tutorTokens) || 0,
            tutorPromptTokens: Number(data.tutorPromptTokens) || 0,
            tutorCandidatesTokens: Number(data.tutorCandidatesTokens) || 0,
            tutorLastModel: data.tutorLastModel || "gemini-3.8-flash",
            ttsTokens: Number(data.ttsTokens) || 0,
            ttsPromptTokens: Number(data.ttsPromptTokens) || 0,
            ttsCandidatesTokens: Number(data.ttsCandidatesTokens) || 0,
            ttsLastModel: data.ttsLastModel || "gemini-3.8-flash-lite-tts",
            lastApiCall: data.lastApiCall || undefined,
            quotaWarning: data.quotaWarning || null,
            lastUpdated: data.lastUpdated || new Date().toISOString(),
          };
          return inMemoryUsage;
        }
      }
    } catch {
      // In-memory fallback
    }
    inMemoryUsage = {
      date: today,
      tutorQueries: 0,
      ttsGenerations: 0,
      totalUsed: 0,
      dailyLimit: DAILY_LIMIT,
      totalTokens: 0,
      promptTokens: 0,
      candidatesTokens: 0,
      dailyTokensLimit: DAILY_TOKENS_LIMIT,
      tutorTokens: 0,
      tutorPromptTokens: 0,
      tutorCandidatesTokens: 0,
      tutorLastModel: "gemini-3.8-flash",
      ttsTokens: 0,
      ttsPromptTokens: 0,
      ttsCandidatesTokens: 0,
      ttsLastModel: "gemini-3.8-flash-lite-tts",
      lastUpdated: new Date().toISOString(),
    };
    return inMemoryUsage;
  }

  function saveAiUsage(record: AiUsageRecord): void {
    inMemoryUsage = record;
    try {
      fs.writeFileSync(USAGE_FILE, JSON.stringify(record, null, 2), "utf-8");
    } catch {
      // Succeeded in-memory for serverless/read-only environments
    }
  }

  function recordAiUsage(
    type: "tutor" | "tts",
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number },
    modelName?: string
  ): AiUsageRecord {
    const record = loadAiUsage();
    const promptTok = Number(usageMetadata?.promptTokenCount) || (type === "tutor" ? 420 : 180);
    const candTok = Number(usageMetadata?.candidatesTokenCount) || (type === "tutor" ? 650 : 350);
    const totTok = Number(usageMetadata?.totalTokenCount) || (promptTok + candTok);
    const usedModel = modelName || (type === "tutor" ? "gemini-3.8-flash" : "gemini-3.8-flash-lite-tts");

    if (type === "tutor") {
      record.tutorQueries += 1;
      record.tutorTokens += totTok;
      record.tutorPromptTokens += promptTok;
      record.tutorCandidatesTokens += candTok;
      record.tutorLastModel = usedModel;
    } else if (type === "tts") {
      record.ttsGenerations += 1;
      record.ttsTokens += totTok;
      record.ttsPromptTokens += promptTok;
      record.ttsCandidatesTokens += candTok;
      record.ttsLastModel = usedModel;
    }

    record.totalUsed = record.tutorQueries + record.ttsGenerations;
    record.totalTokens += totTok;
    record.promptTokens += promptTok;
    record.candidatesTokens += candTok;

    record.lastApiCall = {
      service: type,
      model: usedModel,
      promptTokens: promptTok,
      candidatesTokens: candTok,
      totalTokens: totTok,
      timestamp: new Date().toISOString(),
    };

    record.quotaWarning = null;
    record.lastUpdated = new Date().toISOString();
    saveAiUsage(record);
    return record;
  }

  function recordQuotaWarning(service: "tutor" | "tts", retryDelay?: string, message?: string) {
    const record = loadAiUsage();
    record.quotaWarning = {
      service,
      retryDelay,
      message,
    };
    saveAiUsage(record);
  }

  function getAiUsageStats() {
    const record = loadAiUsage();
    const nextReset = getNextMidnightTimestamp();
    const now = Date.now();
    const msRemaining = Math.max(0, nextReset - now);
    const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const secondsRemaining = Math.floor((msRemaining % (1000 * 60)) / 1000);

    const ttsLimit = TTS_DAILY_LIMIT;
    const tutorLimit = TUTOR_DAILY_LIMIT;

    // Real quota is only marked exceeded if a 429 quota warning is active
    const isTtsExceeded = Boolean(record.quotaWarning?.service === "tts" && record.quotaWarning.retryDelay);
    const isTutorExceeded = Boolean(record.quotaWarning?.service === "tutor" && record.quotaWarning.retryDelay);

    const ttsQueries = record.ttsGenerations;
    const tutorQueries = record.tutorQueries;
    const totalUsed = ttsQueries + tutorQueries;

    const remaining = Math.max(0, record.dailyLimit - totalUsed);
    const percent = Math.min(100, Math.round((totalUsed / record.dailyLimit) * 100));
    const tokensPercent = Math.min(100, Math.round((record.totalTokens / record.dailyTokensLimit) * 100));

    let formattedArabic = "";
    if (hoursRemaining > 0) {
      formattedArabic = `بعد ${hoursRemaining} ساعة و ${minutesRemaining} دقيقة`;
    } else if (minutesRemaining > 0) {
      formattedArabic = `بعد ${minutesRemaining} دقيقة و ${secondsRemaining} ثانية`;
    } else {
      formattedArabic = `بعد ${secondsRemaining} ثانية`;
    }

    return {
      date: record.date,
      used: totalUsed,
      limit: record.dailyLimit,
      remaining,
      percent,
      totalTokens: record.totalTokens,
      promptTokens: record.promptTokens,
      candidatesTokens: record.candidatesTokens,
      tokensLimit: record.dailyTokensLimit,
      tokensPercent,
      resetTimestamp: nextReset,
      resetTimeFormatted: "12:00 منتصف الليل",
      resetCountdown: {
        hours: hoursRemaining,
        minutes: minutesRemaining,
        seconds: secondsRemaining,
        formattedArabic,
      },
      breakdown: {
        tutorQueries: tutorQueries,
        ttsGenerations: ttsQueries,
        tutor: {
          queries: tutorQueries,
          limit: tutorLimit,
          tokens: record.tutorTokens,
          promptTokens: record.tutorPromptTokens,
          candidatesTokens: record.tutorCandidatesTokens,
          lastModel: record.tutorLastModel,
          isExceeded: isTutorExceeded,
        },
        tts: {
          queries: ttsQueries,
          limit: ttsLimit,
          tokens: record.ttsTokens,
          promptTokens: record.ttsPromptTokens,
          candidatesTokens: record.ttsCandidatesTokens,
          lastModel: record.ttsLastModel,
          isExceeded: isTtsExceeded,
        },
      },
      lastApiCall: record.lastApiCall,
      quotaWarning: record.quotaWarning,
      isExceeded: isTtsExceeded && isTutorExceeded,
    };
  }

  // AI Usage Endpoint (both /api/ai-usage and /ai-usage for Vercel rewrite compatibility)
  app.get(["/api/ai-usage", "/ai-usage"], (_req, res) => {
    res.json(getAiUsageStats());
  });

  // Valid Gemini TTS voice names: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
  function normalizeGeminiVoice(voiceName?: any): "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr" {
    if (!voiceName) return "Zephyr";
    const v = String(voiceName).trim();
    const lower = v.toLowerCase();
    if (lower === "puck") return "Puck";
    if (lower === "charon") return "Charon";
    if (lower === "kore") return "Kore";
    if (lower === "fenrir") return "Fenrir";
    if (lower === "zephyr") return "Zephyr";
    if (lower === "aoede") return "Kore"; // Graceful fallback for Maryam
    return "Zephyr";
  }

  // Helper to format educational text into 2-speaker dialogue turns for Gemini TTS multiSpeakerVoiceConfig
  function formatMultiSpeakerDialogueTurns(
    rawText: string,
    spk1Name: string = "Speaker1",
    spk2Name: string = "Speaker2"
  ): Array<{ speaker: string; text: string }> {
    const lines = rawText.split(/\n+/).filter((l) => l.trim().length > 0);
    const turns: Array<{ speaker: string; text: string }> = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Check for quotes indicating spoken dialogue
      if (trimmed.includes("«") && trimmed.includes("»")) {
        const parts = trimmed.split(/(«[^»]+»)/g);
        for (const part of parts) {
          const p = part.trim();
          if (!p) continue;
          if (p.startsWith("«") && p.endsWith("»")) {
            const cleanQuote = p.replace(/[«»]/g, "").trim();
            if (cleanQuote) turns.push({ speaker: spk2Name, text: cleanQuote });
          } else {
            turns.push({ speaker: spk1Name, text: p });
          }
        }
      } else if (trimmed.includes('"') && trimmed.lastIndexOf('"') > trimmed.indexOf('"')) {
        const parts = trimmed.split(/("[^"]+")/g);
        for (const part of parts) {
          const p = part.trim();
          if (!p) continue;
          if (p.startsWith('"') && p.endsWith('"')) {
            const cleanQuote = p.replace(/["]/g, "").trim();
            if (cleanQuote) turns.push({ speaker: spk2Name, text: cleanQuote });
          } else {
            turns.push({ speaker: spk1Name, text: p });
          }
        }
      } else if (/^(قَالَ|سَأَلَ|أَجَابَ|رَدَّ|هَتَفَ|المُعَلِّم|التِّلْمِيذ|الأَب|الجَدّ|الأُم)[\s:]/i.test(trimmed)) {
        turns.push({ speaker: spk2Name, text: trimmed });
      } else {
        turns.push({ speaker: spk1Name, text: trimmed });
      }
    }

    // If no quotes/dialogue parts were extracted, dynamically alternate sentences between narrator & character
    const hasSpeaker2 = turns.some((t) => t.speaker === spk2Name);
    if (!hasSpeaker2) {
      const altTurns: Array<{ speaker: string; text: string }> = [];
      const sentences = rawText.match(/[^.!?؟]+[.!?؟]*/g) || [rawText];
      sentences.forEach((sent, idx) => {
        const s = sent.trim();
        if (!s) return;
        const currentSpeaker = idx % 2 === 0 ? spk1Name : spk2Name;
        altTurns.push({ speaker: currentSpeaker, text: s });
      });
      return altTurns;
    }

    return turns;
  }

  // TTS Endpoint using high-speed gemini-3.8-flash-lite-tts, multi-speaker gemini-3.8-flash-tts, in-memory caching, and resilient Vercel dataUrl delivery
  app.post(["/api/tts", "/tts"], async (req, res) => {
    try {
      const {
        text,
        voice = "Zephyr",
        lessonId,
        forceRegenerate = false,
        multiSpeaker = false,
        speaker1Voice = "Charon",
        speaker2Voice = "Puck",
        customSegments,
        characterVoiceMap,
      } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      // Check if custom character segmentation was provided
      const hasCustomSegments = Array.isArray(customSegments) && customSegments.length > 0;

      // Compute cache file key incorporating voice configuration and multi-speaker mode
      let voiceKey = String(voice);
      if (hasCustomSegments) {
        const segTokens = customSegments
          .map((s: any) => `${s.speaker || "الراوي"}:${s.voice || "Zephyr"}`)
          .join("-");
        voiceKey = `char_${segTokens.slice(0, 100)}`;
      } else if (multiSpeaker) {
        voiceKey = `multi_${speaker1Voice}_${speaker2Voice}`;
      }

      const contentHash = crypto
        .createHash("md5")
        .update(`${text.trim()}_${voiceKey}`)
        .digest("hex");
      const safePrefix = lessonId
        ? `${String(lessonId).replace(/[^a-zA-Z0-9_-]/g, "")}_`
        : "speech_";
      const fileName = `${safePrefix}${contentHash}.wav`;
      const filePath = path.join(AUDIO_DIR, fileName);
      const publicUrl = `/audio/${fileName}`;

      // 1. Fast in-memory cache check (0ms latency, zero API cost, completely independent of disk)
      const cachedMem = audioMemoryCache.get(contentHash);
      if (!forceRegenerate && cachedMem) {
        return res.json({
          cached: true,
          audio: cachedMem.rawBase64,
          audioUrl: cachedMem.dataUrl,
          dataUrl: cachedMem.dataUrl,
          fileName,
          rate: cachedMem.rate,
          multiSpeaker: !!(multiSpeaker || hasCustomSegments),
          voice: voiceKey,
        });
      }

      // 2. Local disk file check
      if (!forceRegenerate && fs.existsSync(filePath)) {
        return res.json({
          cached: true,
          audioUrl: publicUrl,
          dataUrl: publicUrl,
          fileName,
          rate: 24000,
          multiSpeaker: !!(multiSpeaker || hasCustomSegments),
          voice: voiceKey,
        });
      }

      const currentStats = getAiUsageStats();
      // Only block if a real 429 quota error was received from Gemini
      const isQuotaAlreadyReached = Boolean(
        currentStats.quotaWarning?.service === "tts" && currentStats.quotaWarning.retryDelay
      );

      if (isQuotaAlreadyReached) {
        return res.json({
          fallback: true,
          quotaExceeded: true,
          message: currentStats.quotaWarning?.message || "بلغ استهلاك خدمة توليد الأصوات الحد المؤقت لدى مزود الخدمة",
          usage: currentStats,
        });
      }

      const ai = getGeminiClient();
      if (!ai) {
        if (fs.existsSync(filePath)) {
          return res.json({
            cached: true,
            audioUrl: publicUrl,
            fileName,
            rate: 24000,
            multiSpeaker: !!(multiSpeaker || hasCustomSegments),
            voice: voiceKey,
          });
        }
        return res.json({
          message: "GEMINI_API_KEY is not configured on the server",
          fallback: true,
          quotaExceeded: false,
        });
      }

      let response: any = null;
      let usedModelName = "gemini-3.8-flash-lite-tts";

      try {
        if (hasCustomSegments) {
          // Dynamic multi-character dialogue generation
          const cleanSegments = customSegments
            .map((seg: any) => {
              const rawSpk = String(seg.speaker || "الراوي").trim();
              const spkVoice = normalizeGeminiVoice(seg.voice || characterVoiceMap?.[rawSpk]);
              const textContent = String(seg.text || "").replace(/\n+/g, " ").trim();
              const isNarrator = rawSpk.includes("راوي") || rawSpk.includes("سرد");
              return {
                speaker: rawSpk,
                voice: spkVoice,
                text: textContent,
                isNarrator,
              };
            })
            .filter((s: any) => s.text.length > 0);

          const uniqueVoices = Array.from(new Set(cleanSegments.map((s: any) => s.voice)));

          if (uniqueVoices.length <= 1) {
            // Only 1 voice across all segments -> Use fast single-speaker flash-lite-tts
            const singleVoice = uniqueVoices[0] || normalizeGeminiVoice(voice);
            const fullDialogueText = cleanSegments.map((s: any) => s.text).join("\n");

            try {
              usedModelName = "gemini-3.8-flash-lite-tts";
              response = await ai.models.generateContent({
                model: "gemini-3.8-flash-lite-tts",
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: fullDialogueText,
                        speechMetadata: {
                          style: "Clear, engaging educational reader in vocalized classical Arabic with correct articulation",
                        },
                      },
                    ],
                  },
                ],
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: singleVoice },
                    },
                  },
                },
              });
            } catch (flashLiteErr) {
              console.warn("Retrying dialogue with gemini-3.8-flash-tts:", flashLiteErr);
              usedModelName = "gemini-3.8-flash-tts";
              response = await ai.models.generateContent({
                model: "gemini-3.8-flash-tts",
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: fullDialogueText,
                        speechMetadata: {
                          style: "Clear, engaging educational reader in vocalized classical Arabic with correct articulation",
                        },
                      },
                    ],
                  },
                ],
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: singleVoice },
                    },
                  },
                },
              });
            }
          } else {
            // Multi-speaker generation with exactly 2 speakers as required by Gemini TTS
            const narratorSegment = cleanSegments.find((s: any) => s.isNarrator) || cleanSegments[0];
            const spk1Voice = narratorSegment.voice;
            const spk1Tag = "Speaker1";

            const characterSegment =
              cleanSegments.find((s: any) => !s.isNarrator && s.voice !== spk1Voice) ||
              cleanSegments.find((s: any) => s.voice !== spk1Voice) ||
              cleanSegments[1];
            let spk2Voice = characterSegment ? characterSegment.voice : "Puck";
            if (spk2Voice === spk1Voice) {
              spk2Voice = spk1Voice === "Zephyr" ? "Puck" : "Zephyr";
            }
            const spk2Tag = "Speaker2";

            const hasSpeaker1 = cleanSegments.some((s: any) => s.isNarrator || s.voice === spk1Voice);
            const hasSpeaker2 = cleanSegments.some((s: any) => !s.isNarrator && s.voice !== spk1Voice);

            if (hasSpeaker1 && hasSpeaker2) {
              // Construct individual dialogue parts matching the multiSpeakerVoiceConfig spec
              const dialogueParts = cleanSegments.map((seg: any) => {
                const belongsToSpk1 = seg.isNarrator || seg.voice === spk1Voice;
                const tag = belongsToSpk1 ? spk1Tag : spk2Tag;
                const style = belongsToSpk1
                  ? "Clear, engaging educational reader in vocalized classical Arabic with correct articulation"
                  : "Expressive Arabic dialogue with clear pronunciation, emotion, and proper diacritics";
                return {
                  text: `${tag}: ${seg.text}`,
                  speechMetadata: {
                    speaker: tag,
                    style,
                  },
                };
              });

              usedModelName = "gemini-3.8-flash-tts";
              try {
                response = await ai.models.generateContent({
                  model: "gemini-3.8-flash-tts",
                  contents: [
                    {
                      role: "user",
                      parts: dialogueParts,
                    },
                  ],
                  config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                      multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                          {
                            speaker: spk1Tag,
                            voiceConfig: {
                              prebuiltVoiceConfig: { voiceName: spk1Voice },
                            },
                          },
                          {
                            speaker: spk2Tag,
                            voiceConfig: {
                              prebuiltVoiceConfig: { voiceName: spk2Voice },
                            },
                          },
                        ],
                      },
                    },
                  },
                });
              } catch (multiErr) {
                console.warn("Multi-speaker model error, falling back to fast flash-lite-tts single voice:", multiErr);
                usedModelName = "gemini-3.8-flash-lite-tts";
                const cleanDialogueText = cleanSegments.map((s: any) => s.text).join("\n");
                response = await ai.models.generateContent({
                  model: "gemini-3.8-flash-lite-tts",
                  contents: [
                    {
                      role: "user",
                      parts: [
                        {
                          text: cleanDialogueText,
                          speechMetadata: {
                            style: "Clear, engaging educational reader in vocalized classical Arabic",
                          },
                        },
                      ],
                    },
                  ],
                  config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: spk1Voice || "Zephyr" },
                      },
                    },
                  },
                });
              }
            } else {
              // Only 1 speaker found, use single speaker without speaker tags
              const singleVoice = spk1Voice || "Zephyr";
              const cleanDialogueText = cleanSegments.map((s: any) => s.text).join("\n");
              usedModelName = "gemini-3.8-flash-lite-tts";
              response = await ai.models.generateContent({
                model: "gemini-3.8-flash-lite-tts",
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: cleanDialogueText,
                        speechMetadata: {
                          style: "Clear, engaging educational reader in vocalized classical Arabic",
                        },
                      },
                    ],
                  },
                ],
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: singleVoice },
                    },
                  },
                },
              });
            }
          }
        } else if (multiSpeaker) {
          // Multi-speaker dialogue config with 2 distinct character voices
          const spk1 = normalizeGeminiVoice(speaker1Voice || "Charon");
          let spk2 = normalizeGeminiVoice(speaker2Voice || "Puck");
          if (spk2 === spk1) {
            spk2 = spk1 === "Zephyr" ? "Puck" : "Zephyr";
          }

          const turns = formatMultiSpeakerDialogueTurns(text, "Speaker1", "Speaker2");
          const hasSpeaker1 = turns.some((t) => t.speaker === "Speaker1");
          const hasSpeaker2 = turns.some((t) => t.speaker === "Speaker2");

          if (hasSpeaker1 && hasSpeaker2) {
            const dialogueParts = turns.map((turn) => {
              const isSpk1 = turn.speaker === "Speaker1";
              return {
                text: `${turn.speaker}: ${turn.text}`,
                speechMetadata: {
                  speaker: turn.speaker,
                  style: isSpk1
                    ? "Clear, engaging educational reader in vocalized classical Arabic with correct articulation"
                    : "Expressive Arabic dialogue with clear pronunciation, emotion, and proper diacritics",
                },
              };
            });

            usedModelName = "gemini-3.8-flash-tts";
            try {
              response = await ai.models.generateContent({
                model: "gemini-3.8-flash-tts",
                contents: [
                  {
                    role: "user",
                    parts: dialogueParts,
                  },
                ],
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    multiSpeakerVoiceConfig: {
                      speakerVoiceConfigs: [
                        {
                          speaker: "Speaker1",
                          voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: spk1 },
                          },
                        },
                        {
                          speaker: "Speaker2",
                          voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: spk2 },
                          },
                        },
                      ],
                    },
                  },
                },
              });
            } catch (multiErr) {
              console.warn("Multi-speaker dialogue error, fallback to flash-lite-tts:", multiErr);
              usedModelName = "gemini-3.8-flash-lite-tts";
              response = await ai.models.generateContent({
                model: "gemini-3.8-flash-lite-tts",
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: text.trim(),
                        speechMetadata: {
                          style: "Clear, engaging educational reader in vocalized classical Arabic",
                        },
                      },
                    ],
                  },
                ],
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: spk1 },
                    },
                  },
                },
              });
            }
          } else {
            // Only 1 speaker found, use single speaker
            usedModelName = "gemini-3.8-flash-lite-tts";
            response = await ai.models.generateContent({
              model: "gemini-3.8-flash-lite-tts",
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: text.trim(),
                      speechMetadata: {
                        style: "Clear, engaging educational reader in vocalized classical Arabic",
                      },
                    },
                  ],
                },
              ],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: spk1 },
                  },
                },
              },
            });
          }
        } else {
          // Single voice reading with requested voice
          const voiceChoice = normalizeGeminiVoice(voice);
          usedModelName = "gemini-3.8-flash-lite-tts";

          try {
            response = await ai.models.generateContent({
              model: "gemini-3.8-flash-lite-tts",
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: text.trim(),
                      speechMetadata: {
                        style: "Clear, engaging educational reader in vocalized classical Arabic with correct articulation and diacritics",
                      },
                    },
                  ],
                },
              ],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceChoice },
                  },
                },
              },
            });
          } catch (liteErr) {
            console.warn("Primary gemini-3.8-flash-lite-tts error, trying gemini-3.8-flash-tts:", liteErr);
            usedModelName = "gemini-3.8-flash-tts";
            response = await ai.models.generateContent({
              model: "gemini-3.8-flash-tts",
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: text.trim(),
                      speechMetadata: {
                        style: "Clear, engaging educational reader in vocalized classical Arabic with correct articulation and diacritics",
                      },
                    },
                  ],
                },
              ],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceChoice },
                  },
                },
              },
            });
          }
        }
      } catch (genErr: any) {
        // Cache fallback recovery
        if (fs.existsSync(filePath)) {
          return res.json({
            cached: true,
            audioUrl: publicUrl,
            dataUrl: publicUrl,
            fileName,
            rate: 24000,
            multiSpeaker: !!(multiSpeaker || hasCustomSegments),
            voice: voiceKey,
            recoveredFromCache: true,
          });
        }

        const isQuota =
          genErr?.status === 429 ||
          genErr?.message?.includes("429") ||
          genErr?.message?.includes("quota") ||
          genErr?.message?.includes("RESOURCE_EXHAUSTED");

        if (isQuota) {
          console.warn("[TTS Warning] Gemini TTS quota limit reached (429).");
          const retryMatch = genErr?.message?.match(/retry in\s+([0-9.]+s)/i) || genErr?.message?.match(/retryDelay":"([^"]+)"/i);
          const retryDelayStr = retryMatch ? retryMatch[1] : "15s";
          recordQuotaWarning("tts", retryDelayStr, "بلغ استهلاك خدمة توليد الأصوات حد الحصة المؤقت");
        } else {
          console.warn("[TTS Warning] Gemini TTS unavailable:", genErr?.message || "unknown error");
        }

        return res.json({
          fallback: true,
          quotaExceeded: isQuota,
          message: isQuota
            ? "بلغ استهلاك خدمة توليد الأصوات حد الاستهلاك المؤقت لدى مزود الخدمة"
            : "تعذر توليد الصوت عبر جيمناي حالياً",
          usage: getAiUsageStats(),
        });
      }

      const audioPart = response?.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData && p.inlineData.data
      );

      if (audioPart && audioPart.inlineData?.data) {
        const rawBase64 = audioPart.inlineData.data;
        const wavBuffer = pcmBase64ToWavBuffer(rawBase64, 24000, 1);
        const dataUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;

        // Save immediately as standard WAV audio file into AUDIO_DIR if writable
        let diskSaved = false;
        try {
          fs.writeFileSync(filePath, wavBuffer);
          diskSaved = true;
        } catch {
          // Safe on read-only environments like Vercel
        }

        // Cache in fast memory cache
        if (audioMemoryCache.size >= MAX_MEMORY_CACHE_ITEMS) {
          const firstKey = audioMemoryCache.keys().next().value;
          if (firstKey) audioMemoryCache.delete(firstKey);
        }
        audioMemoryCache.set(contentHash, {
          rawBase64,
          dataUrl,
          rate: 24000,
          mimeType: audioPart.inlineData.mimeType || "audio/pcm;rate=24000",
          voice: voiceKey,
          timestamp: Date.now(),
        });

        const usageMeta = response?.usageMetadata;
        recordAiUsage("tts", usageMeta, usedModelName);

        const finalUrl = diskSaved && AUDIO_DIR.includes("public") ? publicUrl : dataUrl;

        return res.json({
          audio: rawBase64,
          audioUrl: finalUrl,
          dataUrl,
          fileName,
          cached: false,
          mimeType: audioPart.inlineData.mimeType || "audio/pcm;rate=24000",
          rate: 24000,
          voice: voiceKey,
          usage: getAiUsageStats(),
        });
      }

      return res.json({ error: "No audio generated", fallback: true });
    } catch (err: any) {
      console.warn("Unexpected /api/tts handling:", err?.message || err);
      return res.json({
        fallback: true,
        message: "Fallback to browser speech synthesis",
      });
    }
  });

  // Check if an audio file exists in memory or on disk
  app.post(["/api/audio-status", "/audio-status"], (req, res) => {
    try {
      const { text, voice = "Zephyr", lessonId } = req.body;
      if (!text || typeof text !== "string") {
        return res.json({ exists: false });
      }
      const contentHash = crypto.createHash("md5").update(`${text.trim()}_${voice}`).digest("hex");
      const safePrefix = lessonId ? `${String(lessonId).replace(/[^a-zA-Z0-9_-]/g, "")}_` : "speech_";
      const fileName = `${safePrefix}${contentHash}.wav`;
      const filePath = path.join(AUDIO_DIR, fileName);

      const mem = audioMemoryCache.get(contentHash);
      if (mem) {
        return res.json({
          exists: true,
          audioUrl: mem.dataUrl,
          fileName,
          size: mem.rawBase64.length,
        });
      }

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return res.json({
          exists: true,
          audioUrl: `/audio/${fileName}`,
          fileName,
          size: stats.size,
        });
      }
      return res.json({ exists: false });
    } catch {
      return res.json({ exists: false });
    }
  });

  // Explicitly persist an audio file to disk or memory (safe on Vercel)
  app.post(["/api/save-audio", "/save-audio"], (req, res) => {
    try {
      const { base64Data, fileName, text, voice = "Zephyr", lessonId } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: "Audio base64 data required" });
      }

      let targetFileName = fileName;
      if (!targetFileName) {
        const contentHash = crypto.createHash("md5").update(`${(text || "").trim()}_${voice}`).digest("hex");
        const safePrefix = lessonId ? `${String(lessonId).replace(/[^a-zA-Z0-9_-]/g, "")}_` : "speech_";
        targetFileName = `${safePrefix}${contentHash}.wav`;
      }

      const filePath = path.join(AUDIO_DIR, targetFileName);
      const wavBuffer = pcmBase64ToWavBuffer(base64Data, 24000, 1);
      const dataUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;

      try {
        fs.writeFileSync(filePath, wavBuffer);
        return res.json({
          success: true,
          fileName: targetFileName,
          audioUrl: `/audio/${targetFileName}`,
          dataUrl,
        });
      } catch {
        return res.json({
          success: true,
          fileName: targetFileName,
          audioUrl: dataUrl,
          dataUrl,
        });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || "Failed to save audio file" });
    }
  });

  // Check if a question is outside the scope of Arabic language, literature, and curriculum
  function isNonArabicOrOutOfScope(question: string): { isOutOfScope: boolean; reason?: string } {
    const q = (question || "").trim().toLowerCase();

    // 1. Gaming & Entertainment
    const gameKeywords = [
      "ماينكرافت", "minecraft", "ببجي", "pubg", "فورتنايت", "fortnite", "روبلوكس", "roblox",
      "بلايستيشن", "playstation", "اكس بوكس", "xbox", "gta", "فيفا", "fifa", "العاب فيديو",
      "تهكير", "شفرات", "شدات", "free fire", "فري فاير", "لعبه حرب", "لعبة حرب"
    ];
    if (gameKeywords.some((kw) => q.includes(kw))) {
      return { isOutOfScope: true, reason: "games" };
    }

    // 2. Computer Programming & Software Engineering (unrelated to Arabic)
    const codeKeywords = [
      "python", "بايثون", "javascript", "جافاسكريبت", "html", "css", "c++", "كود برمجي", 
      "برمجة", "هاكر", "sql", "react", "node.js", "خوارزمية برمجية"
    ];
    if (codeKeywords.some((kw) => q.includes(kw))) {
      return { isOutOfScope: true, reason: "coding" };
    }

    // 3. Sports Gossip & Pop Culture (unrelated to Arabic literature/pedagogy)
    const popKeywords = [
      "ميسي", "رونالدو", "هالاند", "نادي الهلال", "نادي النصر", "مباراة اليوم",
      "دوري ابطال", "فيلم رعب", "نتفلكس", "netflix", "اغاني راب", "هوليوود", "مسلسل تركي"
    ];
    if (popKeywords.some((kw) => q.includes(kw))) {
      return { isOutOfScope: true, reason: "sports_pop" };
    }

    // 4. Pure math calculation or foreign languages
    if (/^[0-9+\-*/=^() ]{4,}$/.test(q)) {
      return { isOutOfScope: true, reason: "pure_math" };
    }
    const foreignLang = ["english grammar", "translate to french", "ترجم للانجليزي", "ترجم للفرنسي", "past simple", "present continuous"];
    if (foreignLang.some((kw) => q.includes(kw))) {
      return { isOutOfScope: true, reason: "foreign_language" };
    }

    // 5. Crypto, Trading, Politics, Cooking recipes unrelated to Arabic
    const otherUnrelated = ["بيتكوين", "bitcoin", "سعر الدولار اليوم", "بورصة", "اسلحة", "سياسة", "طريقة عمل البيتزا"];
    if (otherUnrelated.some((kw) => q.includes(kw))) {
      return { isOutOfScope: true, reason: "unrelated" };
    }

    return { isOutOfScope: false };
  }

  const OUT_OF_SCOPE_REFUSAL = `عذرًا يا بطل! أنا «مُعَلِّمُ لُغَتِي الذَّكِيُّ»، ومهمتي التربوية مخصصة حصريًا لمادة اللغة العربية وقواعدها النحوية والإملائية وبلاغتها ومعاجمها الأدبية وشرح دروس منهج «سلاح التلميذ». 🌟

يرجى توجيه سؤالك حول لغتنا العربية الجميلة، مثل:
• **القواعد النحوية والإعراب**: إعراب الفاعل، المفعول به، المبتدأ، والخبر، وعلامات الإعراب الأصلية والفرعية.
• **المعاجم والمفردات**: معاني الكلمات، والمضاد، والمفرد، والجمع من درسك أو من المعجم اللغوي.
• **القواعد الإملائية والترقيم**: همزات الوصل والقطع، الهمزة المتطرفة على السطر، التنوين، وعلامات الترقيم.
• **شرح النصوص والأشعار**: فهم الفكرة الرئيسة وتذوق التعبيرات الحقيقية والمجازية.

أنا بانتظار سؤالك اللغوي المفيد لنتعلم معًا ونتميز! 📖✨`;

  // Helper: Deep Curriculum Knowledge Search across all lessons and units
  function findCurriculumContext(question: string, currentLessonTitle?: string, currentLessonData?: any) {
    const q = (question || "").trim().toLowerCase();

    // 1. Matched writing topics
    const isWritingQuery =
      q.includes("تعبير") ||
      q.includes("رسالة") ||
      q.includes("سيرة") ||
      q.includes("استقصاء") ||
      q.includes("قصة") ||
      q.includes("شخصية") ||
      q.includes("مناقشة") ||
      q.includes("مقال") ||
      q.includes("نموذج") ||
      q.includes("اكتب");

    const matchedWritingTopics: any[] = [];
    for (const unit of allUnits) {
      for (const lesson of unit.lessons) {
        if (lesson.writingTopic) {
          const wt = lesson.writingTopic;
          const matchTopic =
            q.includes(wt.title.toLowerCase()) ||
            q.includes(wt.type.toLowerCase()) ||
            (q.includes("رسالة") && wt.type.includes("رسالة")) ||
            (q.includes("سيرة") && wt.type.includes("سيرة")) ||
            (q.includes("استقصاء") && wt.type.includes("استقصاء")) ||
            (q.includes("قصة") && wt.type.includes("قصة")) ||
            (q.includes("شخصية") && wt.type.includes("شخصية")) ||
            (q.includes("مناقشة") && wt.type.includes("مناقشة")) ||
            (isWritingQuery && currentLessonTitle && lesson.title === currentLessonTitle);

          if (matchTopic && !matchedWritingTopics.some((m) => m.id === wt.id)) {
            matchedWritingTopics.push({ ...wt, unitTitle: unit.title, lessonTitle: lesson.title });
          }
        }
      }
    }

    // 2. Matched vocabulary across whole curriculum
    const matchedVocab: any[] = [];
    // Current lesson first
    if (Array.isArray(currentLessonData?.vocabulary)) {
      for (const v of currentLessonData.vocabulary) {
        if (v.word && (q.includes(v.word.toLowerCase()) || (v.meaning && q.includes(v.meaning.toLowerCase())))) {
          matchedVocab.push({ ...v, lessonTitle: currentLessonTitle || "الدرس الحالي" });
        }
      }
    }
    // Search all units
    for (const unit of allUnits) {
      for (const lesson of unit.lessons) {
        if (Array.isArray(lesson.vocabulary)) {
          for (const v of lesson.vocabulary) {
            if (v.word && q.includes(v.word.toLowerCase()) && !matchedVocab.some((mv) => mv.word === v.word)) {
              matchedVocab.push({ ...v, lessonTitle: lesson.title });
            }
          }
        }
      }
    }

    // 3. Matched grammar lessons
    const matchedGrammar: any[] = [];
    for (const unit of allUnits) {
      for (const lesson of unit.lessons) {
        if (Array.isArray(lesson.grammarLessons)) {
          for (const g of lesson.grammarLessons) {
            const matchesGrammar =
              q.includes(g.title.toLowerCase()) ||
              (q.includes("فاعل") && g.title.includes("فاعل")) ||
              (q.includes("مفعول") && g.title.includes("مفعول")) ||
              (q.includes("مبتدأ") && g.title.includes("مبتدأ")) ||
              (q.includes("همزة") && (g.title.includes("همزة") || g.category?.includes("إملاء"))) ||
              (q.includes("شبه جملة") && g.title.includes("شبه")) ||
              (currentLessonTitle && lesson.title === currentLessonTitle);

            if (matchesGrammar && !matchedGrammar.some((mg) => mg.title === g.title)) {
              matchedGrammar.push({ ...g, lessonTitle: lesson.title });
            }
          }
        }
      }
    }

    // 4. Matched discussion / comprehension questions
    const matchedDiscussion: any[] = [];
    for (const unit of allUnits) {
      for (const lesson of unit.lessons) {
        if (Array.isArray(lesson.discussionPoints)) {
          for (const dp of lesson.discussionPoints) {
            if (
              q.includes(dp.question.toLowerCase().slice(0, 15)) ||
              (currentLessonTitle && lesson.title === currentLessonTitle)
            ) {
              matchedDiscussion.push({ ...dp, lessonTitle: lesson.title });
            }
          }
        }
      }
    }

    return {
      writingTopics: matchedWritingTopics,
      vocabulary: matchedVocab,
      grammar: matchedGrammar,
      discussion: matchedDiscussion,
    };
  }

  // Pedagogical fallback generator powered by dynamic Arabic linguistic engine
  function generateSmartArabicTutorFallback(question: string, context?: string, lessonData?: any): string {
    const q = (question || "").trim().toLowerCase();

    // 1. Guardrail check for out-of-scope non-educational inquiries
    if (isNonArabicOrOutOfScope(q).isOutOfScope) {
      return OUT_OF_SCOPE_REFUSAL;
    }

    // Direct, dynamic expert response for parsing, vocabulary, writing models, and grammar rules
    return answerArabicTutorDirectly(question, {
      lessonTitle: lessonData?.lessonTitle || "",
      vocabulary: lessonData?.vocabulary || [],
      grammarLessons: lessonData?.grammarLessons || [],
      readingText: context || "",
    });
  }

  // Legacy fallback reference
  function _legacyFallback(question: string, context?: string, lessonData?: any): string {
    const q = (question || "").trim().toLowerCase();
    const lessonTitle = lessonData?.lessonTitle || "";
    const vocabList: any[] = Array.isArray(lessonData?.vocabulary) ? lessonData.vocabulary : [];

    // 2. Writing Models (كتابة نماذج التعبير المقرر بالمنهج)
    if (
      q.includes("رسالة") ||
      (q.includes("تعبير") && q.includes("رسمي")) ||
      (q.includes("اكتب") && q.includes("رسالة"))
    ) {
      return `أهلاً بك يا كاتب المستقبل ومبدع لغتنا الجميلة! ✍️✨
بناءً على منهج التعبير الكتابي المقرّر بالصف الخامس الابتدائي في سلاح التلميذ، إليك نموذجًا تطبيقيًا كاملًا لـ **«كتابة الرسالة الرسمية»**:

### أولاً: العناصر المنهجية الستة للرسالة الرسمية:
1. **المرسل إليه**: اسم أو منصب الشخص الموجهة إليه الرسالة مع لقبه الرسمي في أعلى يمين الصفحة.
2. **التحية الرسمية**: تحية مهذبة وموجزة (مثل: «تحية طيبة، وبعد..»).
3. **سبب الرسالة**: جملة توضح الهدف الأساسي من الكتابة.
4. **الموضوع والعرض المفصل**: شرح المقترحات والأنشطة والفوائد المرجوة.
5. **الخاتمة وعبارة الشكر**: عبارة مهذبة ترجو القبول وتعبر عن فائق التقدير.
6. **التوقيع والتاريخ**: اسم كاتب الرسالة وصفته وتاريخ إرسالها.

---

### ثانياً: النموذج التطبيقي المقرّر:
السَّيِّدُ الفَاضِلُ / مُدِيرُ مَدْرَسَةِ النِّيلِ الِابْتِدَائِيَّةِ المُحْتَرَمُ.
تَحِيَّةٌ طَيِّبَةٌ، وَبَعْدُ..

فَإِنِّي أَرْفَعُ إِلَى سِيَادَتِكُمْ هَذِهِ الرِّسَالَةَ؛ لِطَلَبِ المُوافَقَةِ الكَرِيمَةِ عَلَى إِطْلَاقِ حَمْلَةٍ تَوْعَوِيَّةٍ بِالمَدْرَسَةِ بِعُنْوَانِ: «قَطْرَةُ مَاءٍ تُسَاوِي حَيَاةً» خِلَالَ الأُسْبُوعِ القَادِمِ.

تَتَضَمَّنُ الحَمْلَةُ تَقْدِيمَ إِذَاعَةٍ مَدْرَسِيَّةٍ صَبَاحِيَّةٍ، وَتَعْلِيقَ لَافِتَاتٍ إِرْشَادِيَّةٍ عَنْ تَرْشِيدِ اسْتِهْلَاكِ المِيَاهِ، وَإِقَامَةَ مَسْرَحِيَّةٍ قَصِيرَةٍ تُوَضِّحُ دَوْرَ كُلِّ تِلْمِيذٍ فِي حِمَايَةِ نَهْرِ النِّيلِ مِنَ التَّلَوُّثِ.

نَرْجُو مِنْ سِيَادَتِكُمْ قَبُولَ طَلَبِنَا وَدَعْمَنَا فِي تَنْفِيذِ هَذِهِ المُبَادَرَةِ، وَتَفَضَّلُوا بِقَبُولِ فَائِقِ التَّقْدِيرِ وَالاحْتِرَامِ.

مُمَثِّلُ أُسْرَةِ التَّرْبِيَةِ البِيئِيَّةِ: الطَّالِبُ / عُمَر مَحْمُود
تَارِيخُ الإِرْسَالِ: ١٠ أُكْتُوبَر ٢٠٢٦م

---

### ثالثاً: التحليل التفصيلي لعناصر النموذج:
• **المرسل إليه**: «السيد الفاضل / مدير مدرسة النيل الابتدائية المحترم» (ذكر المنصب الرسمي بأدب).
• **التحية**: «تحية طيبة، وبعد..» (عبارة افتتاحية راقية).
• **السبب**: «طلب الموافقة الكريمة على إطلاق حملة توعوية...» (محدد ومباشر).
• **العرض**: «تتضمن الحملة إذاعة صباحية ولافتات ومسرحية قصيرة...» (تنظيم الفكر).
• **الخاتمة**: «نرجو من سيادتكم قبول طلبنا، وتفضلوا بقبول فائق التقدير والاحترام» (صيغة جمع تدل على الاحترام).
• **التوقيع والتاريخ**: «الطالب / عمر محمود - 10 أكتوبر 2026م».

💡 **نصيحة ذهبية**: استخدم دائمًا صيغة الجمع الدالة على التقدير (سيادتكم، حضراتكم، نرجو)، واحرص على علامات الترقيم (النقطتان بعد التحية، والنقطة عند نهاية كل فقرة)!`;
    }

    if (
      q.includes("سيرة ذاتية") ||
      (q.includes("تعبير") && q.includes("سيرة")) ||
      (q.includes("اكتب") && q.includes("سيرة"))
    ) {
      return `أهلاً بك يا بطل! 🌟
إليك نموذجًا تطبيقيًا متكاملًا لـ **«كتابة السيرة الذاتية»** المقررة بالصف الخامس:

### أولاً: العناصر المنهجية الأربعة للسيرة الذاتية:
1. **من أنا؟**: الاسم، تاريخ ومكان الميلاد، والنشأة والأسرة.
2. **رحلتي الدراسية**: الالتحاق بالمدرسة، المواد الدراسية المحببة، والهوايات والأنشطة.
3. **موقف لا يُنسى**: يوم مميز مرّ به التلميذ (يوم صعب وتجاوزه، أو نجاح وتفوق).
4. **طموحي وحلمي للمستقبل**: المهنة التي يتمنى العمل بها، وكيف سيخدم بها وطنه.

---

### ثانياً: النموذج التطبيقي:
**«حُلْمِي يَبْدَأُ مِنْ هُنَا»**
أَنَا سَيْفُ الدِّينِ، وُلِدْتُ فِي القَاهِرَةِ عَامَ ٢٠١٥م، وَنَشَأْتُ فِي أُسْرَةٍ مُحِبَّةٍ لِلْعِلْمِ تُشَجِّعُنِي دَائِمًا عَلَى القِرَاءَةِ وَالمَعْرِفَةِ.

الْتَحَقْتُ بِمَدْرَسَةِ النَّهْضَةِ الِابْتِدَائِيَّةِ، وَأَنَا الآنَ فِي الصَّفِّ الخَامِسِ. مَادَّتِي المُفَضَّلَةُ هِيَ اللُّغَةُ العَرَبِيَّةُ وَالعُلُومُ، وَأَهْوَى القِرَاءَةَ وَلَعِبَ الشَّطْرَنْجِ لِأَنَّهُ يُنَمِّي التَّفْكِيرَ.

مِنَ المَوَاقِفِ الَّتِي لَا أَنْسَاهَا يَوْمَ اشْتَرَكْتُ فِي مُسَابَقَةِ الإِلْقَاءِ الشِّعْرِيِّ عَلَى مُسْتَوَى المَدْرَسَةِ؛ شَعَرْتُ بِالخَوْفِ فِي البِدَايَةِ، وَلَكِنَّنِي تَذَكَّرْتُ تَشْجِيعَ مُعَلِّمِي لِي، فَوَقَفْتُ بِثِقَةٍ وَأَلْقَيْتُ النَّشِيدَ فَحَصَلْتُ عَلَى المَرْكَزِ الأَوَّلِ.

حُلْمِي فِي المُسْتَقْبَلِ أَنْ أُصْبِحَ طَبِيبًا بَارِعًا أُعَالِجُ المَرْضَى وَأُخَفِّفُ آلاَمَهُمْ، وَأَرْفَعَ اسْمَ وَطَنِي الغَالِي مِصْرَ عَالِيًا.

💡 **نصيحة ذهبية**: اكتب بضمير المتكلم دائمًا (أنا، التحقتُ، شعرتُ، حلمي)، ورتّب الأحداث ترتيبًا زمنيًا متسلسلًا!`;
    }

    if (
      q.includes("استقصاء") ||
      (q.includes("تعبير") && q.includes("استقصاء")) ||
      (q.includes("اكتب") && q.includes("استقصاء"))
    ) {
      return `مرحبًا بك يا باحث المستقبل! 📊
إليك النموذج التطبيقي لـ **«كتابة الاستقصاء لجمع المعلومات»** المقرر بالصف الخامس:

### عناصر الاستقصاء المنهجية:
1. **العنوان المثير**: يعبر عن موضوع البحث بدقة.
2. **المقدمة**: تتضمن الهدف من الاستقصاء، وأهمية رأي المشارك، وعبارة شكر مسبقة.
3. **الأسئلة المصنفة**:
   - أسئلة شخصية (الاسم، السن، الصف).
   - بنود الاستقصاء وخيارات الإجابة (دائمًا / أحيانًا / أبدًا).
4. **الخاتمة**: شكر المشارك وتأكيد أن إجاباته ستُستخدم لتطوير الخدمة أو النشاط.

---

### النموذج التطبيقي:
**«اسْتِقْصَاءُ تَطْوِيرِ مَكْتَبَةِ المَدْرَسَةِ»**
عَزِيزِي التِّلْمِيذَ، نَشْكُرُكَ عَلَى مُشَارَكَتِكَ فِي هَذَا الاسْتِقْصَاءِ الَّذِي يَهْدِفُ إِلَى مَعْرِفَةِ آرَائِكُمْ حَوْلَ مَكْتَبَةِ المَدْرَسَةِ وَتَوْفِيرِ كُتُبٍ وَأَنْشِطَةٍ جَدِيدَةٍ تُنَاسِبُ اهْتِمَامَاتِكُمْ، فَرَأْيُكَ يُهِمُّنَا جِدًّا لِتَحْسِينِ خِدْمَاتِنَا.

**البَيَانَاتُ الشَّخْصِيَّةُ**:
• الصَّفُّ: ............... • الجِنْسُ: [ ] ذَكَر  [ ] أُنْثَى

**بُنُودُ الاسْتِقْصَاءِ**:
١. هَلْ تَزُورُ مَكْتَبَةَ المَدْرَسَةِ أُسْبُوعِيًّا؟ ( ) دَائِمًا  ( ) أَحْيَانًا  ( ) أَبَدًا
٢. هَلْ تَجِدُ الكُتُبَ وَالقِصَصَ الَّتِي تُفَضِّلُ قِرَاءَتَهَا؟ ( ) دَائِمًا  ( ) أَحْيَانًا  ( ) أَبَدًا
٣. هَلْ هُدُوءُ المَكْتَبَةِ وَإِضَاءَتُهَا مُنَاسِبَةٌ لِلْمُطَالَعَةِ؟ ( ) دَائِمًا  ( ) أَحْيَانًا  ( ) أَبَدًا
٤. هَلْ تُحِبُّ إِقَامَةَ مُسَابَقَاتٍ قِرَائِيَّةٍ شَهْرِيَّةٍ؟ ( ) دَائِمًا  ( ) أَحْيَانًا  ( ) أَبَدًا

**الخَاتِمَةُ**:
شُكْرًا لَكَ عَلَى وَقْتِكَ وَصِدْقِ إِجَابَتِكَ؛ نَعِدُكَ أَنَّ جَمِيعَ الإِجَابَاتِ سَتُؤْخَذُ بِعَيْنِ الِاعْتِبَارِ لِتَكُونَ مَكْتَبَتُنَا أَجْمَلَ وَأَثْرَى لِلْجَمِيعِ.`;
    }

    if (
      q.includes("قصة") ||
      (q.includes("تعبير") && q.includes("قصة")) ||
      (q.includes("اكتب") && q.includes("قصة"))
    ) {
      return `أهلاً بك يا راوي الحكايات المبدع! 📖✨
إليك النموذج التطبيقي لـ **«كتابة القصة القصيرة»** المقررة بالصف الخامس:

### عناصر القصة القصيرة المنهجية:
1. **العنوان**: جذاب وموحٍ بفكرة القصة.
2. **الزمان والمكان**: تحديد وقت وقوع الأحداث ومكانها بدقة.
3. **الشخصيات**: الشخصيات الرئيسة والثانوية.
4. **البداية والتمهيد**: وصف الحالة الطبيعية قبل وقوع المشكلة.
5. **المشكلة / العقدة**: الحدث المفاجئ الذي يغير مجرى القصة.
6. **الحل والنهاية**: كيفية حل المشكلة والدرس المستفاد.

---

### النموذج التطبيقي:
**«أَمَانَةٌ تَصْنَعُ الفَرْقَ»**
فِي صَبَاحِ يَوْمِ الخَمِيسِ المَاضِي، كَانَ التِّلْمِيذُ «زِيَادٌ» يَسِيرُ فِي فِنَاءِ مَدْرَسَتِهِ الابْتِدَائِيَّةِ أَثْنَاءَ الفُسْحَةِ المَدْرَسِيَّةِ. كَانَ الفِنَاءُ مَلِيئًا بِالتَّلَامِيذِ يَمْرَحُونَ فِي سَعَادَةٍ.

فَجْأَةً، لَمَحَ زِيَادٌ مِحْفَظَةً جِلْدِيَّةً صَغِيرَةً مُلْقَاةً عَلَى المَقْعَدِ الخَشَبِيِّ. فَتَحَهَا فَوَجَدَ بِهَا مَبْلَغًا مِنَ المَالِ وَبِطَاقَةً مَدْرَسِيَّةً لِزَمِيلِهِ «مُصْطَفَى». تَرَدَّدَ لِلَحْظَةٍ، وَلَكِنَّهُ تَذَكَّرَ حَدِيثَ النَّبِيِّ ﷺ عَنْ أَدَاءِ الأَمَانَةِ.

انْطَلَقَ زِيَادٌ دُونَ تَرَدُّدٍ إِلَى غُرْفَةِ مُدِيرِ المَدْرَسَةِ وَسَلَّمَهُ المِحْفَظَةَ. قَامَ المُدِيرُ فِي الإِذَاعَةِ بِمُنَادَاةِ صَاحِبِهَا، فَجَاءَ مُصْطَفَى وَالفَرْحَةُ تَغْمُرُ وَجْهَهُ لِأَنَّ المَالَ كَانَ مَصْرُوفَهُ الشَّهْرِيَّ.

كَافَأَ المُدِيرُ زِيَادًا أَمَامَ جَمِيعِ التَّلَامِيذِ بِشَهَادَةِ تَقْدِيرٍ، وَشَعَرَ زِيَادٌ بِفَخْرٍ عَظِيمٍ؛ لِأَنَّ الأَمَانَةَ هِيَ كَنْزُ الإِنْسَانِ الحَقِيقِيُّ.`;
    }

    if (
      q.includes("وصف شخصية") ||
      (q.includes("تعبير") && q.includes("شخصية")) ||
      (q.includes("اكتب") && q.includes("وصف"))
    ) {
      return `مرحبًا بك يا فنان الوصف والتعبير الأدبي! 🎨
إليك النموذج التطبيقي لـ **«كتابة وصف شخصية»** المقرر بالصف الخامس:

### عناصر وصف الشخصية:
1. **العنوان**: اسم الشخصية أو صفتها البارزة.
2. **المقدمة**: تمهيد يوضح من هي الشخصية ومكانتها في قلب الكاتب.
3. **الوصف الشكلي والخارجي**: ملامح الوجه، العينان، القامة، والهيئة.
4. **الوصف النفسي والخلقي**: الأخلاق، الطباع، طريقة المعاملة، وحب الخير.
5. **الخاتمة**: المشاعر الصادقة تجاه الشخصية والدعاء أو التقدير لها.

---

### النموذج التطبيقي:
**«مُعَلِّمِي.. قُدْوَتِي وَمَنَارَتِي»**
مِنْ أَجْمَلِ الشَّخْصِيَّاتِ الَّتِي أَثَّرَتْ فِي حَيَاتِي وَتَرَكَتْ أَثَرًا طَيِّبًا فِي نَفْسِي مُعَلِّمُ اللُّغَةِ العَرَبِيَّةِ «الأُسْتَاذُ أَحْمَد».

هُوَ رَجُلٌ فِي العَقْدِ الرَّابِعِ مِنْ عُمْرِهِ، مُتَوَسِّطُ القَامَةِ، ذُو وَجْهٍ بَشُوشٍ تَعْلُوهُ دَائِمًا ابْتِسَامَةٌ هَادِئَةٌ تَبْعَثُ عَلَى الاطْمِئْنَانِ. عَيْنَاهُ بَرَّاقَتَانِ تَفِيضَانِ بِالذَّكَاءِ وَالعَطْفِ، وَصَوْتُهُ جَهْوَرِيٌّ فَصِيحٌ يَأْسِرُ القُلُوبَ حِينَ يَقْرَأُ الشِّعْرَ.

أَمَّا عَنْ صِفَاتِهِ الخُلُقِيَّةِ، فَهُوَ إِنْسَانٌ صَبُورٌ جِدًّا لَا يَمَلُّ مِنْ إِعَادَةِ الشَّرْحِ لِمَنْ لَمْ يَفْهَمْ، عَادِلٌ بَيْنَ تَلاَمِيذِهِ يُشَجِّعُ الضَّعِيفَ حَتَّى يَتَفَوَّقَ. يَتَمَيَّزُ بِالتَّوَاضُعِ وَحُبِّ الخَيْرِ وَإِتْقَانِ العَمَلِ.

إِنَّنِي أُكِنُّ لِمُعَلِّمِي كُلَّ الحُبِّ وَالاحْتِرَامِ، وَأَدْعُو اللهَ أَنْ يَجْزِيَهُ عَنَّا خَيْرَ الجَزَاءِ، وَأَتَمَنَّى أَنْ أَكُونَ مِثْلَهُ فِي إِخْلَاصِهِ وَعِلْمِهِ.`;
    }

    if (
      q.includes("مناقشة فكرة") ||
      (q.includes("تعبير") && q.includes("مميزات وعيوب")) ||
      (q.includes("اكتب") && q.includes("مناقشة"))
    ) {
      return `أهلاً بك يا مفكر المستقبل المتميز! 💡⚖️
إليك النموذج التطبيقي لـ **«كتابة مناقشة فكرة (المميزات والعيوب)»** المقرر بالصف الخامس:

### عناصر مناقشة الفكرة:
1. **العنوان**: صريح ومحدد يبرز موضوع المناقشة.
2. **المقدمة**: تمهيد عام يبين انتشار الفكرة أو الظاهرة في عصرنا.
3. **المميزات والإيجابيات**: ذكر الفوائد والمنافع بالأدلة والأمثلة.
4. **العيوب والسلبيات**: ذكر الأضرار والآثار السلبية المحتملة.
5. **الخاتمة والتوصية الموزونة**: تقديم نصيحة متوازنة لكيفية الاستفادة وتجنب الضرر.

---

### النموذج التطبيقي:
**«الهَاتِفُ المَحْمُولُ.. سِلَاحٌ ذُو حَدَّيْنِ»**
أَصْبَحَ الهَاتِفُ المَحْمُولُ فِي عَصْرِنَا الحَالِيِّ جُزْءًا لَا يَتَجَزَّأُ مِنْ حَيَاتِنَا اليَوْمِيَّةِ، حَيْثُ يَسْتَخْدِمُهُ الكِبَارُ وَالصِّغَارُ فِي كُلِّ مَكَانٍ، وَلِهَذِهِ التِّقْنِيَّةِ مُمَيِّزَاتٌ كَثِيرَةٌ كَمَا أَنَّ لَهَا عُيُوبًا يَجِبُ الانْتِبَاهُ إِلَيْهَا.

مِنْ أَبْرَزِ **مُمَيِّزَاتِ** الهَاتِفِ المَحْمُولِ أَنَّهُ يُسَهِّلُ التَّوَاصُلَ السَّرِيعَ مَعَ الأَهْلِ وَالأَصْدِقَاءِ فِي أَيِّ وَقْتٍ، كَمَا يُتِيحُ لَنَا التَّعَلُّمَ عَنْ بُعْدٍ وَالبَحْثَ عَنِ المَعْلُومَاتِ الدِّرَاسِيَّةِ بِكُلِّ سُهُولَةٍ، بِالإِضَافَةِ إِلَى اسْتِخْدَامِهِ فِي أَوْقَاتِ الطَّوَارِئِ.

عَلَى الجَانِبِ الآخَرِ، يَحْمِلُ الهَاتِفُ عِدَّةَ **عُيُوبٍ** عِنْدَ الإِفْرَاطِ فِي اسْتِخْدَامِهِ؛ فَقَدْ يُؤَدِّي إِلَى إِضَاعَةِ الوَقْتِ، وَإِجْهَادِ العَيْنَيْنِ، وَالشُّعُورِ بِالكَسَلِ وَقِلَّةِ النَّوْمِ، فَمَنْ يَقْضِي سَاعَاتٍ طَوِيلَةً أَمَامَ الشَّاشَةِ يَنْعَزِلُ عَنْ أُسْرَتِهِ وَيَتَرَاجَعُ مُسْتَوَاهُ الدِّرَاسِيُّ.

**خِتَامًا**: الهَاتِفُ المَحْمُولُ أَدَاةٌ رَائِعَةٌ إِذَا اسْتَخْدَمْنَاهَا بِاعْتِدَالٍ، وَلِذَا أُوصِي زُمَلَائِي بِتَحْدِيدِ وَقْتٍ لِلِاسْتِخْدَامِ النَّافِعِ فِي الدِّرَاسَةِ، وَتَجَنُّبِ السَّهَرِ مَعَهُ لِلْحِفَاظِ عَلَى صِحَّتِنَا وَتَفَوُّقِنَا.`;
    }

    // 3. Exact Vocabulary Search from curriculum
    if (vocabList.length > 0) {
      for (const v of vocabList) {
        if (v.word && q.includes(v.word.toLowerCase())) {
          return `أهلاً بك يا باحث المعجم الذكي! 📖
بناءً على جدول مفردات درسك **«${lessonTitle || "المقرر"}»** في منصة سلاح التلميذ:

• **الكلمة**: «${v.word}»
• **المعنى / المرادف**: ${v.meaning}
${v.opposite ? `• **المضاد**: ${v.opposite}\n` : ""}${v.plural ? `• **الجمع**: ${v.plural}\n` : ""}${
            v.singular ? `• **المفرد**: ${v.singular}\n` : ""
          }${v.contextSentence ? `• **في جملة سياقية من النص**: «${v.contextSentence}»\n` : ""}
• **خريطة الكلمة**:
  - النوع: اسم / فعل
  - المعنى: ${v.meaning}
  - المضاد: ${v.opposite || "غير متاح"}
  - الجملة: «${v.contextSentence || v.word}»

💡 **فائدة لغوية**: سياق الجملة في النص القرائي هو الذي يحدد المعنى بدقة. استمع لنطقها الفصيح عبر الضغط على زر السماعة في تبويب المفردات! ✨`;
        }
      }
    }

    // Check all units vocabulary
    for (const unit of allUnits) {
      for (const lesson of unit.lessons) {
        if (Array.isArray(lesson.vocabulary)) {
          for (const v of lesson.vocabulary) {
            if (v.word && q.includes(v.word.toLowerCase())) {
              return `أهلاً بك يا باحث المعجم اللغوي! 📖
من معجم مفردات درس **«${lesson.title}»** (الوحدة: ${unit.title}) بسلاح التلميذ:

• **الكلمة**: «${v.word}»
• **المعنى**: ${v.meaning}
${v.opposite ? `• **المضاد**: ${v.opposite}\n` : ""}${v.plural ? `• **الجمع**: ${v.plural}\n` : ""}${
                v.singular ? `• **المفرد**: ${v.singular}\n` : ""
              }${v.contextSentence ? `• **السياق**: «${v.contextSentence}»\n` : ""}
• **الجذر اللغوي الثلاثي**: نرد الكلمة لأصلها المجرد لنجد بابها في المعجم المدرسي.`;
            }
          }
        }
      }
    }

    // 4. Grammar & Syntax (النحو والإعراب التفصيلي)
    if (
      q.includes("إعراب") ||
      q.includes("أعرب") ||
      q.includes("مفعول") ||
      q.includes("فاعل") ||
      q.includes("مبتدأ") ||
      q.includes("خبر") ||
      q.includes("علامة") ||
      q.includes("نحو") ||
      q.includes("جملة")
    ) {
      // Sentence sample parser check
      if (q.includes("كافأ") || q.includes("معلم") || q.includes("تلميذ")) {
        return `أهلاً بك يا بطل النحو والإعراب! 🌟
إليك الإعراب التفصيلي التام لجملة: **«كَافَأَ المُعَلِّمُ التِّلْمِيذَيْنِ المُجْتَهِدَيْنِ»**:

| الكلمة | موقعها الإعرابي | الحالة والعلامة | السبب |
| :--- | :--- | :--- | :--- |
| **كَافَأَ** | فعل ماضٍ | مبني على الفتح | لدلالته على حدث وقع في الماضي |
| **المُعَلِّمُ** | فاعل | مرفوع وعلامة رفعه **الضمة** الظاهرة | لأنه مفرد (هو من قام بالمكافأة) |
| **التِّلْمِيذَيْنِ** | مفعول به | منصوب وعلامة نصبه **الياء** | لأنه **مثنى** (وقع عليه التكريم) |
| **المُجْتَهِدَيْنِ** | نعت (صفة) | منصوب وعلامة نصبه **الياء** | لأنه مثنى يتبع ما قبله في الإعراب |

---

💡 **القواعد الذهبية المقررة بالصف الخامس**:
1. **علامات رفع الفاعل والمبتدأ والخبر**:
   • **الضمة**: للمفرد، وجمع التكسير، وجمع المؤنث السالم.
   • **الألف**: للمثنى (المتسابقان).
   • **الواو**: لجمع المذكر السالم (المعلمون).
2. **علامات نصب المفعول به**:
   • **الفتحة**: للمفرد وجمع التكسير.
   • **الياء**: للمثنى وجمع المذكر السالم.
   • **الكسرة**: لجمع المؤنث السالم نيابة عن الفتحة.`;
      }

      return `أهلاً بك يا بطل النحو والإعراب! 🌟
سؤالك في القواعد النحوية ذكي ومهم جدًا، وإليك التفصيل الدقيق وفق منهج الصف الخامس الابتدائي:

1. **أركان الجملة الفعلية**:
   • **الفعل**: يدل على حدث وقع في زمن معين (ماضٍ، مضارع، أمر).
   • **الفاعل**: اسم مرفوع دائمًا يدل على من قام بالفعل أو اتصف به.
     - **الضمة**: إذا كان مفردًا (كَتَبَ **التِّلْمِيذُ**)، أو جمع تكسير (حَضَرَ **العُلَمَاءُ**)، أو جمع مؤنث سالمًا (نَجَحَتِ **الطَّالِبَاتُ**).
     - **الألف**: إذا كان مثنى (فَازَ **المُتَسَابِقَانِ**).
     - **الواو**: إذا كان جمع مذكر سالمًا (انْتَصَرَ **المُعَلِّمُونَ**).
   • **المفعول به**: اسم منصوب يدل على من وقع عليه فعل الفاعل (ليس ركنًا أساسيًا في كل جملة ولكنه يكمل المعنى).
     - **الفتحة**: للمفرد وجمع التكسير (قَرَأَ الطَّالِبُ **كِتَابًا** / **قِصَصًا**).
     - **الياء**: للمثنى وجمع المذكر السالم (كَافَأَ المُعَلِّمُ **التِّلْمِيذَيْنِ** / **المُجْتَهِدِينَ**).
     - **الكسرة**: لجمع المؤنث السالم نيابة عن الفتحة (شَكَرَ المُدِيرُ **المُعَلِّمَاتِ**).

2. **الجملة الاسمية**: تتكون من **المبتدأ** و**الخبر**، وكلاهما مرفوع دائمًا بنفس علامات الرفع (الضمة، الألف، الواو).

💡 **السر الذهبي للإعراب**:
• اسأل دائمًا: «**مَن** فعل؟» ⬅️ الجواب هو **الفاعل**.
• اسأل دائمًا: «**ماذا** فعل؟» ⬅️ الجواب هو **المفعول به**.
${lessonTitle ? `راجع تبويب «القواعد النحوية» في درس «${lessonTitle}» لتجد تدريبات تفاعلية ممتازة!` : ""}`;
    }

    // 5. Poetry & Rhetoric (الشعر، البلاغة، مظاهر الجمال)
    if (
      q.includes("شعر") ||
      q.includes("نشيد") ||
      q.includes("بيت") ||
      q.includes("جمال") ||
      q.includes("مجاز") ||
      q.includes("حقيقي") ||
      q.includes("بلاغ")
    ) {
      return `أهلاً بك يا فنان التذوق البلاغي والأدبي! 🎨
في البلاغة العربية للصف الخامس الابتدائي، نميز دائمًا بين نوعين رئيسيين من التعبيرات:
1. **التعبير الحقيقي**: هو استخدام الكلمات في معانيها الأصلية الواقعية التي تحدث فعلاً في حياتنا.
   • مثال: «الشَّمْسُ تُشْرِقُ صَبَاحًا» (تعبير حقيقي لأن الشمس تشرق في الواقع).
2. **التعبير المجازي**: هو استخدام الكلمات في غير معانيها الحقيقية لإضفاء جمال وخيال وروعة على الكلام.
   • مثال: «الشَّمْسُ تَبْتَسِمُ لِلْأَزْهَارِ» (تعبير مجازي؛ حيث شبّه الشاعر الشمس بإنسان يبتسم لإبراز الفرح والجمال).

💡 **في الأبيات الشعرية**: تأمل دائمًا كيف يختار الشاعر كلماته لتصوير المعنى، واقرأ التوضيح الجمالي المرفق أسفل كل بيت في تبويب «القراءة والاستماع» لدرسك ${
        lessonTitle ? `«${lessonTitle}»` : ""
      }!`;
    }

    // 6. Spelling & Punctuation (الإملاء والترقيم والهمزات)
    if (
      q.includes("همزة") ||
      q.includes("إملاء") ||
      q.includes("وصل") ||
      q.includes("قطع") ||
      q.includes("سطر") ||
      q.includes("تنوين") ||
      q.includes("ترقيم")
    ) {
      return `مرحبًا بك يا متقن الخط والإملاء الصحيح! ✍️
إليك القواعد الإملائية الذهبية المقررة في الصف الخامس:
1. **همزة القطع**: همزة أصلية تُرسم وتُنطق دائمًا في أول الكلمة (أَ، إِ، أُ).
   • أمثلة: «أَحْمَدُ، إِحْسَانٌ، أُمِّي، أَمَلٌ».
2. **ألف الوصل**: ألف تُنطق في أول الكلام فقط وتسقط نطقًا عند وصله، وتُكتب ألفًا مجردة دون همزة (ا).
   • أمثلة: «انْطَلَقَ، اسْتِمَاعٌ، اسْمٌ، ابْنٌ».
   • **طريقة التمييز السحرية**: ضع حرف الواو قبل الكلمة؛ فإذا نطقت الهمزة فهي (قطع) مثل «وَأَحْمَدُ»، وإذا سقطت فهي (وصل) مثل «وَانْطَلَقَ».
3. **الهمزة المتطرفة على السطر**: تُكتب مفردة على السطر في نهاية الكلمة إذا سُبقت بحرف ساكن أو حرف مد (ألف، واو، ياء).
   • أمثلة: «مَاءٌ، هَوَاءٌ، ضَوْءٌ، هُدُوءٌ، جَزْءٌ، بُطْءٌ».
4. **التنوين**: نون ساكنة تلحق آخر الاسم نطقًا لا كتابة، وأنواعه: تنوين الفتح (ـً)، الضم (ـٌ)، الكسر (ـٍ).`;
    }

    // 7. General lesson comprehension
    return `أهلاً بك يا بطل! سؤالك رائع ومهم: «${question}».
${lessonTitle ? `في درسك الحالي **«${lessonTitle}»** بسلاح التلميذ:\n` : ""}
نحرص دائمًا على فهم النص القرائي بدقة، واستيعاب معاني المفردات وتطبيقها، وإتقان إعراب الفاعل والمفعول به، ومراعاة القواعد الإملائية والتعبير الكتابي.
تفضل بطرح أي سؤال عن الدرس أو أي كلمة تريد إعرابها أو معرفة معناها، أو اطلب مني كتابة أي نموذج تعبير مقرر بالمنهج، وأنا هنا دائمًا كمعلمك الخبير لأشرحها لك خطوة بخطوة! 🎓✨`;
  }

  // Interactive AI Arabic Tutor Endpoint
  app.post("/api/tutor", async (req, res) => {
    try {
      const {
        question,
        lessonTitle,
        lessonContent,
        lessonContext,
        lessonType,
        unitTitle,
        vocabulary,
        grammarLessons,
        discussionPoints,
        writingTopic,
      } = req.body;

      if (!question || typeof question !== "string" || !question.trim()) {
        return res.status(400).json({ error: "Question is required" });
      }

      const cleanQuestion = question.trim();

      // Guardrail Check: Strict prohibition of non-Arabic / out-of-scope non-educational questions
      const scopeCheck = isNonArabicOrOutOfScope(cleanQuestion);
      if (scopeCheck.isOutOfScope) {
        return res.json({
          reply: OUT_OF_SCOPE_REFUSAL,
          answer: OUT_OF_SCOPE_REFUSAL,
          filtered: true,
        });
      }

      // Find deep cross-curriculum context (writing topics, vocabulary, grammar rules, discussion points)
      const curriculumMatches = findCurriculumContext(cleanQuestion, lessonTitle, {
        vocabulary,
        grammarLessons,
        discussionPoints,
        readingText: lessonContent || req.body.readingText,
      });

      // Format rich system curriculum data so Gemini gives absolute priority to in-system lessons
      let lessonDataSummary = "";
      if (lessonTitle) lessonDataSummary += `• عنوان الدرس الحالي: ${lessonTitle}\n`;
      if (unitTitle) lessonDataSummary += `• الوحدة: ${unitTitle}\n`;
      if (lessonType) {
        lessonDataSummary += `• نوع الدرس: ${
          lessonType === "poetry" ? "نص شعري / نشيد" : lessonType === "reading" ? "نص قرائي" : "نص استماع"
        }\n`;
      }
      if (lessonContent || req.body.readingText) {
        const textSample = (req.body.readingText || lessonContent || "").slice(0, 2000);
        lessonDataSummary += `• نص الدرس المقروء المعتمد:\n${textSample}\n`;
      }
      if (Array.isArray(vocabulary) && vocabulary.length > 0) {
        lessonDataSummary +=
          `• جدول معجم ومفردات الدرس المعتمد بنظام سلاح التلميذ:\n` +
          vocabulary
            .slice(0, 35)
            .map(
              (v: any) =>
                `  - الكلمة: «${v.word}» | المعنى: «${v.meaning}»${v.opposite ? ` | المضاد: «${v.opposite}»` : ""}${
                  v.plural ? ` | الجمع: «${v.plural}»` : ""
                }${v.singular ? ` | المفرد: «${v.singular}»` : ""}`
            )
            .join("\n") +
          "\n";
      }
      if (Array.isArray(grammarLessons) && grammarLessons.length > 0) {
        lessonDataSummary +=
          `• قواعد الدرس النحوية والإملائية:\n` +
          grammarLessons
            .map((g: any) => `  - [${g.category || "قاعدة"}]: ${g.title} (${(g.rules || []).slice(0, 4).join(" • ")})`)
            .join("\n") +
          "\n";
      }
      if (Array.isArray(discussionPoints) && discussionPoints.length > 0) {
        lessonDataSummary +=
          `• أهم أسئلة الفهم والمناقشة بالدرس:\n` +
          discussionPoints
            .slice(0, 5)
            .map((d: any) => `  - س: ${d.question} -> ج: ${d.answer}`)
            .join("\n") +
          "\n";
      }
      if (writingTopic) {
        lessonDataSummary += `• موضوع التعبير الكتابي المرتبط بالدرس: ${writingTopic.title || ""} (نوعه: ${writingTopic.type || ""})\n`;
      }

      // Add cross-curriculum matches (other units, matching writing topics or grammar or vocabulary)
      let crossCurriculumSummary = "";
      if (curriculumMatches.writingTopics.length > 0) {
        crossCurriculumSummary += `• مواضيع التعبير الكتابي ذات الصلة من المنهج:\n` +
          curriculumMatches.writingTopics.map((wt: any) => 
            `  - [${wt.title}] (نوعه: ${wt.type} - درس: ${wt.lessonTitle}): عناصره الأساسية: ${(wt.elements || []).map((e: any) => e.name).join("، ")}`
          ).join("\n") + "\n";
      }
      if (curriculumMatches.vocabulary.length > 0) {
        crossCurriculumSummary += `• مفردات إضافية مطابقة من معجم المنهج:\n` +
          curriculumMatches.vocabulary.slice(0, 8).map((v: any) => 
            `  - «${v.word}» (درس: ${v.lessonTitle}): المعنى «${v.meaning}»${v.opposite ? ` | المضاد: «${v.opposite}»` : ""}`
          ).join("\n") + "\n";
      }
      if (curriculumMatches.grammar.length > 0) {
        crossCurriculumSummary += `• قواعد نحوية مطابقة من المنهج:\n` +
          curriculumMatches.grammar.slice(0, 3).map((g: any) => 
            `  - [${g.title}] (درس: ${g.lessonTitle}): ${(g.rules || []).slice(0, 3).join(" • ")}`
          ).join("\n") + "\n";
      }

      const prompt = `أنت «مُعَلِّمُ لُغَتِي الذَّكِيُّ»، أستاذ خبير ومرجع لغوي وتربوي متميز في اللغة العربية وقواعدها النحوية والإملائية وبلاغتها ومعاجمها، وتعمل ضمن منصة «سلاح التلميذ» التفاعلية المخصصة لتلاميذ المرحلة الابتدائية (الصف الخامس الابتدائي) في مصر.

[الركائز الأربع الأساسية لمهامك]:
1. [إجابة جميع أسئلة المنهج والفهم القرائي]:
   - أجب عن جميع أسئلة الفهم، وأفكار النصوص (القراءة، الاستماع، الأناشيد)، والأسئلة والتدريبات الواردة في المنهج بدقة تامة وبالرجوع للدروس المعتمدة في سلاح التلميذ.
   - وضّح مظاهر الجمال، والتعبيرات الحقيقية والمجازية، والأساليب البلاغية (أمر، نهي، نداء، تشبيه).
   - إذا سأل عن نص شعري، اشرح البيت بأسلوب جميل ومبسط.

2. [معاني المفردات والمعاجم اللغوية]:
   - عند السؤال عن أي كلمة، قدّم تفصيلاً معجمياً شاملاً: المعنى / المرادف، المضاد، الجمع، المفرد، الجملة السياقية، والجذر اللغوي الثلاثي.
   - إذا طُلب خريطة الكلمة، وضّح: (النوع: اسم/فعل، المعنى، المضاد، الكلمة في جملة).
   - إذا طُلب شبكة المفردات، قدّم 4-6 كلمات وثيقة الصلة بالمفهوم.
   - اضبط الكلمات بالشكل التام (التشكيل).

3. [القواعد النحوية والإعراب الكامل]:
   - قدّم إعراباً تاماً مفصلاً خطوة بخطوة لأي جملة أو كلمة يسألها التلميذ: (الموقع الإعرابي + الحالة الإعرابية + علامة الإعراب + السبب: لأنه مفرد/مثنى/جمع...).
   - نسق الإعراب في جدول منظم واضح.
   - اشرح علامات رفع المبتدأ والخبر والفاعل (الضمة، الألف، الواو) وعلامات نصب المفعول به (الفتحة، الكسرة، الياء) وشبه الجملة وحروف الجر والقواعد الإملائية (همزة القطع وألف الوصل، الهمزة المتطرفة على السطر، التنوين بأنواعه، وعلامات الترقيم) بأسلوب ممتع ومبسط يناسب مدارك تلميذ الصف الخامس (10-11 سنة).

4. [كتابة نماذج التعبير المقرر بالمنهج]:
   - إذا طلب التلميذ كتابة نموذج تعبير أو سأل عن أحد فنون التعبير المقررة في الصف الخامس (كتابة رسالة رسمية، كتابة سيرة ذاتية، كتابة استقصاء، كتابة قصة قصيرة، كتابة وصف شخصية، كتابة مناقشة فكرة):
     أ) اذكر أولاً «العناصر المنهجية المعتمدة» لهذا الفن الكتابي.
     ب) اكتب «نموذجاً تطبيقياً إبداعياً متكاملاً ومشوقاً» ومشكولاً يناسب تلميذ الصف الخامس ومستوفياً لكافة العناصر بدقة.
     ج) قدّم «التحليل التفصيلي لعناصر النموذج المكتوب» (العنصر في سطر، ثم التحليل يبدأ من السطر التالي) لبيان أين ورد كل عنصر في النموذج وكيف طُبّق.
     د) اختم بـ «نصيحة ذهبية» للتلميذ للحصول على الدرجة النهائية في ورقة الامتحان.

[الضابط الحاسم لنطاق التخصص - إلزامي وصارم]:
أنت مخصص حصرًا لمادة اللغة العربية وفروعها المذكورة.
⛔ إذا كان سؤال التلميذ خارج مادة اللغة العربية تمامًا (مثل: ألعاب الفيديو، البرمجة والحواسيب، الرياضة وكرة القدم، المشاهير والأفلام، السياسة، الحساب والرياضيات غير اللغوية، أو مواد أخرى):
ارفض الإجابة بلطف شديد وأسلوب تربوي مشجع، واعتذر مبينًا أنك معلم مخصص حصريًا للغة العربية ومنهجها في سلاح التلميذ، واطلب منه طرح أي سؤال في لغتنا العربية أو درسه.

[بيانات الدرس الحالي من منصة سلاح التلميذ]:
${lessonDataSummary || (lessonContext || "منهج اللغة العربية للصف الخامس الابتدائي - سلاح التلميذ")}
${crossCurriculumSummary}

سؤال التلميذ: ${cleanQuestion}

[تعليمات صياغة الرد الحاسمة والمباشرة]:
1. أجب عن سؤال التلميذ مباشرة وبشكل واضح ومفصل دون أي إحالة لتبويبات أو مصادر أخرى ودون إجابات تقليدية أو مكررة.
2. إذا كان السؤال إعراباً: أعرب كل كلمة في الجملة إعراباً تاماً مفصلاً في جدول منظم يوضح (الكلمة مع التشكيل، موقعها الإعرابي، حالتها وعلامتها، والسبب بالتفصيل: مفرد، مثنى، جمع، إلخ) مع ذكر القواعد المستفادة.
3. إذا كان السؤال عن معنى أو مفرد أو جمع أو مضاد أو جذر كلمة: قدّم بياناً معجمياً شاملاً ومباشراً (المعنى الدقيق، المضاد، المفرد/الجمع، الجذر اللغوي الثلاثي، خريطة الكلمة، وجملة سياقية فصيحة).
4. إذا كان السؤال كتابة نموذج تعبير مقرر بالمنهج (رسالة رسمية، سيرة ذاتية، قصة قصيرة، وصف شخصية، مناقشة فكرة، استقصاء): اكتب النموذج التطبيقي فوراً كاملاً ومشكولاً ومستوفياً لكافة العناصر بدقة مع التحليل والنصيحة الذهبية.
5. إذا كان السؤال عن قاعدة إملائية أو نحوية: اشرحها بأسلوب تربوي مبسط مع أمثلة عملية وقاعدة التمييز السحرية.
6. كن دقيقاً لغويًا 100% وبأسلوب معلم خبير محبب ومشجع.`;

      const ai = getGeminiClient();
      let replyText = "";

      if (ai) {
        // Models prioritized: gemini-3.6-flash for fast and reliable Arabic pedagogical reasoning, followed by 3.8-flash and 3.5-flash
        const modelsToTry = [
          { name: "gemini-3.6-flash", timeout: 12000 },
          { name: "gemini-3.8-flash", timeout: 10000 },
          { name: "gemini-3.5-flash", timeout: 8000 },
          { name: "gemini-flash-latest", timeout: 6000 },
        ];

        let recordedUsage = false;
        let lastQuotaErr: any = null;

        for (const { name: model, timeout } of modelsToTry) {
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), timeout)
            );
            const response = (await Promise.race([
              ai.models.generateContent({
                model,
                contents: prompt,
              }),
              timeoutPromise,
            ])) as any;

            if (response?.text && response.text.trim()) {
              replyText = response.text.trim();
              const usageMeta = response?.usageMetadata;
              recordAiUsage("tutor", usageMeta, model);
              recordedUsage = true;
              break;
            }
          } catch (mErr: any) {
            console.warn(`Model ${model} unavailable or timed out:`, mErr?.status || mErr?.message || mErr);
            if (mErr?.status === 429 || mErr?.message?.includes("429") || mErr?.message?.includes("quota")) {
              lastQuotaErr = mErr;
            }
          }
        }

        if (lastQuotaErr && !recordedUsage) {
          const retryMatch = lastQuotaErr?.message?.match(/retry in\s+([0-9.]+s)/i) || lastQuotaErr?.message?.match(/retryDelay":"([^"]+)"/i);
          const retryDelayStr = retryMatch ? retryMatch[1] : "25s";
          recordQuotaWarning("tutor", retryDelayStr, "بلغ استهلاك المعلم الذكي حد الحصة اليومي المجاني من جيمناي (20 استفساراً/يوم)");
        }
      }

      // If AI model is temporarily busy or unavailable, use rich curriculum fallback
      if (!replyText) {
        replyText = generateSmartArabicTutorFallback(cleanQuestion, lessonDataSummary, {
          lessonTitle,
          vocabulary,
          grammarLessons,
        });
        recordAiUsage("tutor", {
          promptTokenCount: Math.round(cleanQuestion.length * 1.5 + 350),
          candidatesTokenCount: Math.round(replyText.length * 1.2),
          totalTokenCount: Math.round(cleanQuestion.length * 1.5 + 350 + replyText.length * 1.2),
        }, "gemini-3.8-flash");
      }

      return res.json({
        reply: replyText,
        answer: replyText,
        usage: getAiUsageStats(),
      });
    } catch (err: any) {
      console.error("Error in /api/tutor:", err);
      const fallbackReply = generateSmartArabicTutorFallback(
        req.body?.question || "",
        req.body?.lessonContext || "",
        {
          lessonTitle: req.body?.lessonTitle,
          vocabulary: req.body?.vocabulary,
          grammarLessons: req.body?.grammarLessons,
        }
      );
      recordAiUsage("tutor", {
        promptTokenCount: Math.round((req.body?.question?.length || 20) * 1.5 + 350),
        candidatesTokenCount: Math.round(fallbackReply.length * 1.2),
        totalTokenCount: Math.round((req.body?.question?.length || 20) * 1.5 + 350 + fallbackReply.length * 1.2),
      }, "gemini-3.8-flash");
      return res.json({
        reply: fallbackReply,
        answer: fallbackReply,
        usage: getAiUsageStats(),
      });
    }
  });

  async function startServer() {
    const PORT = Number(process.env.PORT) || 3000;

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    // Only start HTTP listener if not executed within a serverless runtime
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }
  }

  startServer();

  export default app;
