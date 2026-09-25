import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { audioService, AudioPlaybackState, SpeakOptions } from '../utils/audioPlayer.ts';
import { parseTextCharactersAndSegments, TextCharacter, TextSegment } from '../utils/characterParser.ts';
import { allUnits } from '../data/index.ts';
import { QuotaExceededModal, QuotaExceededDetails } from '../components/QuotaExceededModal.tsx';

interface AudioContextType {
  playbackState: AudioPlaybackState;
  playLesson: (text: string, lessonTitle: string, lessonId: string, voiceOverride?: string) => Promise<void>;
  regenerateAudio: (textOverride?: string, titleOverride?: string, idOverride?: string) => Promise<void>;
  pauseAudio: () => void;
  resumeAudio: () => void;
  stopAudio: () => void;
  seekAudio: (seconds: number) => void;
  downloadAudio: (text: string, lessonTitle: string, lessonId: string, voice?: string) => Promise<{ success: boolean; message: string }>;
  isAudioBarPinned: boolean;
  setIsAudioBarPinned: (pinned: boolean) => void;
  isPlayerClosed: boolean;
  isPlayerMinimized: boolean;
  minimizeAudioPlayer: () => void;
  expandAudioPlayer: () => void;
  closeAudioPlayer: () => void;
  openAudioPlayer: () => void;
  activeLessonTitle: string;
  currentLessonText: string;
  currentLessonId: string;
  // Voice Settings & Multi-speaker
  preferredVoice: string;
  setPreferredVoice: (voice: string) => void;
  speechSpeed: number;
  setSpeechSpeed: (speed: number) => void;
  isMultiSpeaker: boolean;
  setIsMultiSpeaker: (enabled: boolean) => void;
  speaker1Voice: string;
  setSpeaker1Voice: (voice: string) => void;
  speaker2Voice: string;
  setSpeaker2Voice: (voice: string) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isRegenerating: boolean;
  // Text Characters & Segments Voice Customization
  textCharacters: TextCharacter[];
  textSegments: TextSegment[];
  isCharactersModalOpen: boolean;
  setIsCharactersModalOpen: (open: boolean) => void;
  updateCharacterVoice: (characterId: string, voiceName: string) => void;
  updateSegmentCharacter: (segmentId: string, characterId: string) => void;
  updateSegmentVoice: (segmentId: string, voiceName: string) => void;
  applyCharacterVoicesAndPlay: () => Promise<void>;
  resetCharacterDetection: () => void;
  syncCurrentLesson: (lesson: { id: string; title: string; text: string }) => void;
}

const AudioPlayerContext = createContext<AudioContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(audioService.getState());
  const [isAudioBarPinned, setIsAudioBarPinned] = useState<boolean>(() => {
    const saved = localStorage.getItem('selah_audio_bar_pinned');
    return saved !== null ? saved === 'true' : true;
  });
  // المشغل الصوتي يبدأ مخفياً تماماً عند الدخول للمتصفح وتحديث الصفحة، ويظهر فقط عند قراءة النصوص
  const [isPlayerClosed, setIsPlayerClosed] = useState<boolean>(true);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState<boolean>(false);

  const initialLesson = (() => {
    const savedId = localStorage.getItem('selah_active_lesson_id');
    if (savedId) {
      const found = allUnits.flatMap((u) => u.lessons).find((l) => l.id === savedId);
      if (found) return found;
    }
    return allUnits[1]?.lessons[0];
  })();

  const [activeLessonTitle, setActiveLessonTitle] = useState<string>(() => initialLesson?.title || '');
  const [currentLessonText, setCurrentLessonText] = useState<string>(() => initialLesson?.readingText || '');
  const [currentLessonId, setCurrentLessonId] = useState<string>(() => initialLesson?.id || 'u1-l1');

  // Audio Voice & Playback Preferences
  const [preferredVoice, setPreferredVoiceState] = useState<string>(() => {
    return localStorage.getItem('selah_preferred_voice') || 'Zephyr';
  });
  const [speechSpeed, setSpeechSpeedState] = useState<number>(() => {
    const saved = localStorage.getItem('selah_speech_speed');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [isMultiSpeaker, setIsMultiSpeakerState] = useState<boolean>(() => {
    return localStorage.getItem('selah_multispeaker') === 'true';
  });
  const [speaker1Voice, setSpeaker1VoiceState] = useState<string>(() => {
    return localStorage.getItem('selah_speaker1_voice') || 'Charon';
  });
  const [speaker2Voice, setSpeaker2VoiceState] = useState<string>(() => {
    return localStorage.getItem('selah_speaker2_voice') || 'Puck';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Characters and Segments state initialized with initialLesson
  const [textCharacters, setTextCharacters] = useState<TextCharacter[]>(() => {
    if (initialLesson) {
      return parseTextCharactersAndSegments(initialLesson.readingText, initialLesson.title).characters;
    }
    return [];
  });
  const [textSegments, setTextSegments] = useState<TextSegment[]>(() => {
    if (initialLesson) {
      return parseTextCharactersAndSegments(initialLesson.readingText, initialLesson.title).segments;
    }
    return [];
  });
  const [isCharactersModalOpen, setIsCharactersModalOpen] = useState<boolean>(false);

  // حالة نافذة التنبيه بانتهاء حصة الذكاء الاصطناعي لتوليد الأصوات
  const [quotaModalState, setQuotaModalState] = useState<{
    isOpen: boolean;
    details: QuotaExceededDetails | null;
    resolvePromise: ((proceed: boolean) => void) | null;
  }>({
    isOpen: false,
    details: null,
    resolvePromise: null,
  });

  useEffect(() => {
    // تسجيل معالج انتهاء حصة الذكاء الاصطناعي لإخبار المستخدم قبل توليد النص بقارئ المتصفح
    audioService.setQuotaExceededHandler(async (details) => {
      const autoProceed = sessionStorage.getItem('selah_auto_browser_tts') === 'true';
      if (autoProceed) {
        return true;
      }

      return new Promise<boolean>((resolve) => {
        setQuotaModalState({
          isOpen: true,
          details,
          resolvePromise: resolve,
        });
      });
    });

    return () => {
      audioService.setQuotaExceededHandler(null);
    };
  }, []);

  const handleConfirmQuotaModal = (rememberChoice: boolean) => {
    if (rememberChoice) {
      sessionStorage.setItem('selah_auto_browser_tts', 'true');
    }
    if (quotaModalState.resolvePromise) {
      quotaModalState.resolvePromise(true);
    }
    setQuotaModalState({
      isOpen: false,
      details: null,
      resolvePromise: null,
    });
  };

  const handleCancelQuotaModal = () => {
    if (quotaModalState.resolvePromise) {
      quotaModalState.resolvePromise(false);
    }
    setQuotaModalState({
      isOpen: false,
      details: null,
      resolvePromise: null,
    });
  };

  const setPreferredVoice = (voice: string) => {
    setPreferredVoiceState(voice);
    localStorage.setItem('selah_preferred_voice', voice);
  };

  const setSpeechSpeed = (speed: number) => {
    setSpeechSpeedState(speed);
    localStorage.setItem('selah_speech_speed', String(speed));
    audioService.setRate(speed);
  };

  const setIsMultiSpeaker = (enabled: boolean) => {
    setIsMultiSpeakerState(enabled);
    localStorage.setItem('selah_multispeaker', String(enabled));
  };

  const setSpeaker1Voice = (voice: string) => {
    setSpeaker1VoiceState(voice);
    localStorage.setItem('selah_speaker1_voice', voice);
  };

  const setSpeaker2Voice = (voice: string) => {
    setSpeaker2VoiceState(voice);
    localStorage.setItem('selah_speaker2_voice', voice);
  };

  // Ref tracking currently synced lesson ID to prevent redundant state updates
  const currentSyncedLessonIdRef = useRef<string>(initialLesson?.id || 'u1-l1');

  // Synchronize context whenever current lesson changes in UI
  const syncCurrentLesson = useCallback((lesson: { id: string; title: string; text: string }) => {
    if (!lesson || !lesson.id) return;
    if (currentSyncedLessonIdRef.current === lesson.id) return;
    currentSyncedLessonIdRef.current = lesson.id;

    if (audioService.isPlaying()) {
      audioService.stop();
    }

    setCurrentLessonId(lesson.id);
    setActiveLessonTitle(lesson.title);
    setCurrentLessonText(lesson.text);

    // Immediately parse & update characters for this specific lesson
    const { characters, segments } = parseTextCharactersAndSegments(lesson.text, lesson.title);
    setTextCharacters(characters);
    setTextSegments(segments);
  }, []);

  // Re-detect characters when lesson text changes if empty
  const resetCharacterDetection = () => {
    if (!currentLessonText) return;
    const { characters, segments } = parseTextCharactersAndSegments(currentLessonText, activeLessonTitle);
    setTextCharacters(characters);
    setTextSegments(segments);
  };

  const updateCharacterVoice = (characterId: string, voiceName: string) => {
    setTextCharacters((prev) =>
      prev.map((c) => (c.id === characterId ? { ...c, voice: voiceName } : c))
    );
    // Also update all segments currently assigned to this character
    setTextSegments((prev) =>
      prev.map((s) => (s.characterId === characterId ? { ...s, voice: voiceName } : s))
    );
  };

  const updateSegmentCharacter = (segmentId: string, characterId: string) => {
    const targetChar = textCharacters.find((c) => c.id === characterId);
    if (!targetChar) return;

    setTextSegments((prev) =>
      prev.map((s) =>
        s.id === segmentId
          ? {
              ...s,
              characterId: targetChar.id,
              characterName: targetChar.name,
              voice: targetChar.voice,
            }
          : s
      )
    );
  };

  const updateSegmentVoice = (segmentId: string, voiceName: string) => {
    setTextSegments((prev) =>
      prev.map((s) => (s.id === segmentId ? { ...s, voice: voiceName } : s))
    );
  };

  const applyCharacterVoicesAndPlay = async () => {
    if (!currentLessonText) return;

    setIsRegenerating(true);
    setIsMultiSpeaker(true);

    const customSegments = textSegments.map((s) => ({
      id: s.id,
      text: s.text,
      speaker: s.characterName,
      voice: s.voice,
    }));

    const characterVoiceMap: Record<string, string> = {};
    textCharacters.forEach((c) => {
      characterVoiceMap[c.name] = c.voice;
    });

    try {
      await audioService.speakText(currentLessonText, {
        voice: preferredVoice,
        lessonId: currentLessonId || 'general',
        lessonTitle: activeLessonTitle,
        rate: speechSpeed,
        forceRegenerate: true,
        multiSpeaker: true,
        customSegments,
        characterVoiceMap,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('selah_audio_bar_pinned', String(isAudioBarPinned));
  }, [isAudioBarPinned]);

  useEffect(() => {
    localStorage.setItem('selah_audio_minimized', String(isPlayerMinimized));
  }, [isPlayerMinimized]);

  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      // If the audio is for a discrete vocabulary/dictionary word:
      // DO NOT trigger or open the audio player!
      // DO NOT alter isPlayerClosed or overwrite the global player track!
      if (state.isVocabulary) {
        return;
      }

      setPlaybackState(state);
      if (state.lessonTitle) {
        setActiveLessonTitle(state.lessonTitle);
      }

      // إظهار المشغل الصوتي فور بدء قراءة أو تحميل أي نص تعليمي
      if (state.isPlaying || state.isLoading) {
        setIsPlayerClosed(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const playLesson = async (
    text: string,
    lessonTitle: string,
    lessonId: string,
    voiceOverride?: string
  ) => {
    setIsPlayerClosed(false);
    setActiveLessonTitle(lessonTitle);
    setCurrentLessonText(text);
    setCurrentLessonId(lessonId);

    // Parse and update characters & segments for this text
    const { characters, segments } = parseTextCharactersAndSegments(text, lessonTitle);
    setTextCharacters(characters);
    setTextSegments(segments);

    const chosenVoice = voiceOverride || preferredVoice;

    const customSegments = isMultiSpeaker
      ? segments.map((s) => ({
          id: s.id,
          text: s.text,
          speaker: s.characterName,
          voice: s.voice,
        }))
      : undefined;

    const characterVoiceMap: Record<string, string> = {};
    characters.forEach((c) => {
      characterVoiceMap[c.name] = c.voice;
    });

    await audioService.speakText(text, {
      voice: chosenVoice,
      lessonId,
      lessonTitle,
      rate: speechSpeed,
      multiSpeaker: isMultiSpeaker,
      speaker1Voice,
      speaker2Voice,
      customSegments,
      characterVoiceMap: isMultiSpeaker ? characterVoiceMap : undefined,
    });
  };

  // Re-generate fresh audio bypassing caches with the latest settings
  const regenerateAudio = async (textOverride?: string, titleOverride?: string, idOverride?: string) => {
    const textToUse = textOverride || currentLessonText;
    const titleToUse = titleOverride || activeLessonTitle;
    const idToUse = idOverride || currentLessonId;
    if (!textToUse) return;

    if (textOverride) setCurrentLessonText(textOverride);
    if (titleOverride) setActiveLessonTitle(titleOverride);
    if (idOverride) setCurrentLessonId(idOverride);

    setIsRegenerating(true);

    const customSegments =
      isMultiSpeaker && textSegments.length > 0
        ? textSegments.map((s) => ({
            id: s.id,
            text: s.text,
            speaker: s.characterName,
            voice: s.voice,
          }))
        : undefined;

    const characterVoiceMap: Record<string, string> = {};
    textCharacters.forEach((c) => {
      characterVoiceMap[c.name] = c.voice;
    });

    try {
      await audioService.speakText(textToUse, {
        voice: preferredVoice,
        lessonId: idToUse,
        lessonTitle: titleToUse,
        rate: speechSpeed,
        forceRegenerate: true,
        multiSpeaker: isMultiSpeaker,
        speaker1Voice,
        speaker2Voice,
        customSegments,
        characterVoiceMap: isMultiSpeaker ? characterVoiceMap : undefined,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const pauseAudio = () => {
    audioService.pause();
  };

  const resumeAudio = () => {
    setIsPlayerClosed(false);
    audioService.resume();
  };

  const stopAudio = () => {
    audioService.stop();
  };

  const minimizeAudioPlayer = () => {
    // Keep audio playing in the background smoothly
    setIsPlayerMinimized(true);
  };

  const expandAudioPlayer = () => {
    setIsPlayerMinimized(false);
    setIsPlayerClosed(false);
  };

  const closeAudioPlayer = () => {
    audioService.stop();
    setIsPlayerClosed(true);
    setIsPlayerMinimized(false);
  };

  const openAudioPlayer = () => {
    setIsPlayerClosed(false);
    setIsPlayerMinimized(false);
  };

  const seekAudio = (seconds: number) => {
    audioService.seek(seconds);
  };

  const downloadAudio = async (text: string, lessonTitle: string, lessonId: string, voiceOverride?: string) => {
    return audioService.downloadLessonAudio(text, lessonTitle, lessonId, voiceOverride || preferredVoice);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        playbackState,
        playLesson,
        regenerateAudio,
        pauseAudio,
        resumeAudio,
        stopAudio,
        seekAudio,
        downloadAudio,
        isAudioBarPinned,
        setIsAudioBarPinned,
        isPlayerClosed,
        isPlayerMinimized,
        minimizeAudioPlayer,
        expandAudioPlayer,
        closeAudioPlayer,
        openAudioPlayer,
        activeLessonTitle,
        currentLessonText,
        currentLessonId,
        preferredVoice,
        setPreferredVoice,
        speechSpeed,
        setSpeechSpeed,
        isMultiSpeaker,
        setIsMultiSpeaker,
        speaker1Voice,
        setSpeaker1Voice,
        speaker2Voice,
        setSpeaker2Voice,
        isSettingsOpen,
        setIsSettingsOpen,
        isRegenerating,
        textCharacters,
        textSegments,
        isCharactersModalOpen,
        setIsCharactersModalOpen,
        updateCharacterVoice,
        updateSegmentCharacter,
        updateSegmentVoice,
        applyCharacterVoicesAndPlay,
        resetCharacterDetection,
        syncCurrentLesson,
      }}
    >
      {children}
      <QuotaExceededModal
        isOpen={quotaModalState.isOpen}
        details={quotaModalState.details}
        onConfirm={handleConfirmQuotaModal}
        onCancel={handleCancelQuotaModal}
      />
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
