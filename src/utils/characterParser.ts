import { PRESET_VOICES, VoiceOption } from './audioPlayer.ts';

export interface TextCharacter {
  id: string;
  name: string;
  role: string;
  badge: string;
  color: string;
  bgLight: string;
  borderLight: string;
  voice: string; // VoiceOption id: 'Zephyr' (سلمى), 'Puck' (بلال), 'Charon' (فاروق), 'Aoede' (مريم), 'Kore' (فاطمة), 'Fenrir' (حمزة)
  quoteCount: number;
  sampleQuote: string;
}

export interface TextSegment {
  id: string;
  index: number;
  characterId: string;
  characterName: string;
  text: string;
  voice: string;
}

// Known character archetypes and their default voice pairing
const KNOWN_ARCHETYPES: Record<
  string,
  { role: string; badge: string; color: string; bgLight: string; borderLight: string; defaultVoice: string }
> = {
  narrator: {
    role: 'الراوي (السرد الفصيح والوصف)',
    badge: 'سلمى • فصيحة وهادئة',
    color: 'text-emerald-400',
    bgLight: 'bg-emerald-500/10',
    borderLight: 'border-emerald-500/30',
    defaultVoice: 'Zephyr',
  },
  pharaoh: {
    role: 'المصري القديم (صاحب الاعترافات الخالدة)',
    badge: 'فاروق • وقور وتاريخي',
    color: 'text-amber-400',
    bgLight: 'bg-amber-500/10',
    borderLight: 'border-amber-500/30',
    defaultVoice: 'Charon',
  },
  nile: {
    role: 'صوت نهر النيل (النداء الرمزي)',
    badge: 'حمزة • مهيب ومؤثر',
    color: 'text-cyan-400',
    bgLight: 'bg-cyan-500/10',
    borderLight: 'border-cyan-500/30',
    defaultVoice: 'Fenrir',
  },
  hero: {
    role: 'التلميذ البطل المفكر',
    badge: 'بلال • حيوي ومشوق',
    color: 'text-sky-400',
    bgLight: 'bg-sky-500/10',
    borderLight: 'border-sky-500/30',
    defaultVoice: 'Puck',
  },
  coach: {
    role: 'المرشد والمدرب الذكي',
    badge: 'فاروق • حكيم وموجه',
    color: 'text-indigo-400',
    bgLight: 'bg-indigo-500/10',
    borderLight: 'border-indigo-500/30',
    defaultVoice: 'Charon',
  },
  thinker: {
    role: 'المحاور والمفكر التفاعلي',
    badge: 'فاطمة • ذكية ومحاورة',
    color: 'text-purple-400',
    bgLight: 'bg-purple-500/10',
    borderLight: 'border-purple-500/30',
    defaultVoice: 'Kore',
  },
  father: {
    role: 'الأب / الوالد',
    badge: 'فاروق • وقور ورصين',
    color: 'text-amber-400',
    bgLight: 'bg-amber-500/10',
    borderLight: 'border-amber-500/30',
    defaultVoice: 'Charon',
  },
  mother: {
    role: 'الأم / المعلمة',
    badge: 'سلمى • حنان وتوجيه',
    color: 'text-rose-400',
    bgLight: 'bg-rose-500/10',
    borderLight: 'border-rose-500/30',
    defaultVoice: 'Zephyr',
  },
  child_girl: {
    role: 'التلميذة (هناء / مريم / منى)',
    badge: 'فاطمة • ذكية ومعبرة',
    color: 'text-pink-400',
    bgLight: 'bg-pink-500/10',
    borderLight: 'border-pink-500/30',
    defaultVoice: 'Kore',
  },
  child_boy: {
    role: 'التلميذ (طارق / آدم / باسم)',
    badge: 'بلال • حيوي ومشوق',
    color: 'text-sky-400',
    bgLight: 'bg-sky-500/10',
    borderLight: 'border-sky-500/30',
    defaultVoice: 'Puck',
  },
  ancestors: {
    role: 'حكماء ومؤرخو مصر القديمة',
    badge: 'فاروق • شجي وتراثي',
    color: 'text-teal-400',
    bgLight: 'bg-teal-500/10',
    borderLight: 'border-teal-500/30',
    defaultVoice: 'Charon',
  },
  dialogue_generic: {
    role: 'الشخصية الحوارية المتكلمة',
    badge: 'بلال • تفاعل درامي',
    color: 'text-emerald-400',
    bgLight: 'bg-emerald-500/10',
    borderLight: 'border-emerald-500/30',
    defaultVoice: 'Puck',
  },
};

/**
 * Intelligent parser that inspects Arabic text and lesson title to extract:
 * 1. The list of characters tailored to the specific lesson.
 * 2. Distinct dialogue turns and expressive narrative segments mapped to each character.
 */
export function parseTextCharactersAndSegments(
  rawText: string,
  lessonTitle: string = ''
): { characters: TextCharacter[]; segments: TextSegment[] } {
  if (!rawText || !rawText.trim()) {
    const defaultNarrator: TextCharacter = {
      id: 'char-narrator',
      name: 'الراوي الفصيح (سلمى)',
      role: KNOWN_ARCHETYPES.narrator.role,
      badge: KNOWN_ARCHETYPES.narrator.badge,
      color: KNOWN_ARCHETYPES.narrator.color,
      bgLight: KNOWN_ARCHETYPES.narrator.bgLight,
      borderLight: KNOWN_ARCHETYPES.narrator.borderLight,
      voice: 'Zephyr',
      quoteCount: 1,
      sampleQuote: 'نص القراءة الفصيح',
    };
    return {
      characters: [defaultNarrator],
      segments: [
        {
          id: 'seg-1',
          index: 1,
          characterId: 'char-narrator',
          characterName: defaultNarrator.name,
          text: rawText || '',
          voice: 'Zephyr',
        },
      ],
    };
  }

  const charactersMap = new Map<string, TextCharacter>();

  const getOrCreateChar = (
    id: string,
    name: string,
    archetypeKey: keyof typeof KNOWN_ARCHETYPES,
    preferredVoice?: string
  ): TextCharacter => {
    if (charactersMap.has(id)) {
      return charactersMap.get(id)!;
    }
    const arc = KNOWN_ARCHETYPES[archetypeKey] || KNOWN_ARCHETYPES.dialogue_generic;
    const newChar: TextCharacter = {
      id,
      name,
      role: arc.role,
      badge: arc.badge,
      color: arc.color,
      bgLight: arc.bgLight,
      borderLight: arc.borderLight,
      voice: preferredVoice || arc.defaultVoice,
      quoteCount: 0,
      sampleQuote: '',
    };
    charactersMap.set(id, newChar);
    return newChar;
  };

  // Base Narrator always present
  const narratorChar = getOrCreateChar(
    'char-narrator',
    'الراوي الفصيح (سلمى)',
    'narrator',
    'Zephyr'
  );

  // 1. Check for Lesson 1: سر الحياة (Nile Call & Ecological Awareness)
  const isLesson1 = /سِرُّ الحَياةِ|سِرُّ الحَيَاةِ/i.test(lessonTitle) || /كَانَ نَهْرُ النِّيلِ سِرًّا/i.test(rawText);
  if (isLesson1) {
    getOrCreateChar('char-nile', 'صوت نهر النيل (حمزة)', 'nile', 'Fenrir');
    getOrCreateChar('char-hero', 'المحاور التوعوي (بلال)', 'hero', 'Puck');
  }

  // 2. Check for Lesson 2: لم ألوث ماء النهر (Ancient Egyptian Confessions & Ancestors)
  const isLesson2 = /لَمْ أُلَوِّثْ|اعْتِرَافَاتِ المِصْرِيِّ/i.test(lessonTitle) || /لَمْ أُلَوِّثْ مَاءَ النَّهْرِ/i.test(rawText);
  if (isLesson2) {
    getOrCreateChar('char-pharaoh', 'المصري القديم (فاروق)', 'pharaoh', 'Charon');
    getOrCreateChar('char-ancestors', 'حكماء مصر القديمة (فاروق)', 'ancestors', 'Charon');
    getOrCreateChar('char-hero', 'صوت الوعي والامتنان (بلال)', 'hero', 'Puck');
  }

  // 3. Check for Lesson 3: بطل حل المشكلات (Smart Problem Solving Coach & Student Hero)
  const isLesson3 = /بَطَلُ حَلِّ|حَلِّ المُشْكِلَاتِ/i.test(lessonTitle) || /تَحْدِيدُ أَسْبَابِ المُشْكِلَةِ/i.test(rawText);
  if (isLesson3) {
    getOrCreateChar('char-coach', 'المرشد والمدرب الذكي (فاروق)', 'coach', 'Charon');
    getOrCreateChar('char-hero', 'التلميذ البطل المفكر (بلال)', 'hero', 'Puck');
  }

  // 4. Check for Unit 2: جسر التواصل / الشفرة النوبية / الأخوة الإنسانية
  const isBridgeLesson = /جِسْرُ التَّواصُلِ|فَنُّ التَّواصُلِ/i.test(lessonTitle) || /جَزِيرَةٍ مُنْفَرِدًا/i.test(rawText);
  if (isBridgeLesson) {
    getOrCreateChar('char-thinker', 'المحاور والمفكر (فاطمة)', 'thinker', 'Kore');
    getOrCreateChar('char-hero', 'صوت التواصل الحديث (بلال)', 'hero', 'Puck');
  }

  // 5. Contextual entity matching across any text
  if (/الأَب|وَالِد|أَبِي/i.test(rawText)) {
    getOrCreateChar('char-father', 'الأب (فاروق)', 'father', 'Charon');
  }
  if (/الأُم|الجَدَّة|المُعَلِّمَة/i.test(rawText)) {
    getOrCreateChar('char-mother', 'الأم / المعلمة (سلمى)', 'mother', 'Zephyr');
  }
  if (/طَارِق|آدَم|بَاسِم/i.test(rawText)) {
    const boyName = /طَارِق/i.test(rawText) ? 'طارق' : /آدَم/i.test(rawText) ? 'آدم' : 'باسم';
    getOrCreateChar('char-boy', `${boyName} (بلال)`, 'child_boy', 'Puck');
  }
  if (/هَنَاء|مَرْيَم|مُنَى/i.test(rawText)) {
    const girlName = /هَنَاء/i.test(rawText) ? 'هناء' : /مَرْيَم/i.test(rawText) ? 'مريم' : 'منى';
    getOrCreateChar('char-girl', `${girlName} (فاطمة)`, 'child_girl', 'Kore');
  }

  // Build segments dynamically
  const segments: TextSegment[] = [];
  const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  let segmentCounter = 1;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();

    // Check for quotes «...»
    if (trimmedPara.includes('«') && trimmedPara.includes('»')) {
      const parts = trimmedPara.split(/(«[^»]+»)/g);
      for (const part of parts) {
        const p = part.trim();
        if (!p) continue;

        if (p.startsWith('«') && p.endsWith('»')) {
          const cleanQuote = p.replace(/[«»]/g, '').trim();

          // Intelligent quote attribution
          let matchedChar = narratorChar;

          if (cleanQuote.includes('مِيَاهِي') || /لِلنِّيلِ صَوْتٌ/i.test(trimmedPara) || cleanQuote.includes('لَا تُلَوِّثُونِي')) {
            matchedChar = charactersMap.get('char-nile') || getOrCreateChar('char-nile', 'صوت نهر النيل (حمزة)', 'nile', 'Fenrir');
          } else if (cleanQuote.includes('لَمْ أُلَوِّثْ') || cleanQuote.includes('لَمْ أَمْنَعِ') || cleanQuote.includes('أَعْطَيْتُ الخُبْزَ')) {
            matchedChar = charactersMap.get('char-pharaoh') || getOrCreateChar('char-pharaoh', 'المصري القديم (فاروق)', 'pharaoh', 'Charon');
          } else if (cleanQuote.includes('الذَّهَبِ وَالفِضَّةِ') || cleanQuote.includes('الجَوَاهِرِ')) {
            matchedChar = charactersMap.get('char-ancestors') || getOrCreateChar('char-ancestors', 'حكماء مصر القديمة (مريم)', 'ancestors', 'Aoede');
          } else if (/الأَب|وَالِد/i.test(trimmedPara) && charactersMap.has('char-father')) {
            matchedChar = charactersMap.get('char-father')!;
          } else if (/الجَدَّة|الأُم/i.test(trimmedPara) && charactersMap.has('char-mother')) {
            matchedChar = charactersMap.get('char-mother')!;
          } else if (charactersMap.has('char-hero')) {
            matchedChar = charactersMap.get('char-hero')!;
          } else if (charactersMap.has('char-boy')) {
            matchedChar = charactersMap.get('char-boy')!;
          } else {
            matchedChar = getOrCreateChar('char-dialogue', 'الشخصية المتكلمة (بلال)', 'dialogue_generic', 'Puck');
          }

          matchedChar.quoteCount++;
          if (!matchedChar.sampleQuote) matchedChar.sampleQuote = cleanQuote.slice(0, 60);

          segments.push({
            id: `seg-${segmentCounter++}`,
            index: segments.length + 1,
            characterId: matchedChar.id,
            characterName: matchedChar.name,
            text: cleanQuote,
            voice: matchedChar.voice,
          });
        } else {
          // Narrative part
          let narChar = narratorChar;
          if (trimmedPara.includes('شُكْرًا لَكُمْ') && charactersMap.has('char-hero')) {
            narChar = charactersMap.get('char-hero')!;
          }
          narChar.quoteCount++;
          if (!narChar.sampleQuote) narChar.sampleQuote = p.slice(0, 60);
          segments.push({
            id: `seg-${segmentCounter++}`,
            index: segments.length + 1,
            characterId: narChar.id,
            characterName: narChar.name,
            text: p,
            voice: narChar.voice,
          });
        }
      }
    } else {
      // Paragraph without explicit «...» quotes
      // Check for numbered steps, e.g. "١. تَحْدِيدُ أَسْبَابِ المُشْكِلَةِ:"
      if (/^[١٢٣٤٥\d]\s*[\.\-]/i.test(trimmedPara)) {
        const stepChar = charactersMap.get('char-coach') || getOrCreateChar('char-coach', 'المرشد والمدرب الذكي (فاروق)', 'coach', 'Charon');
        stepChar.quoteCount++;
        if (!stepChar.sampleQuote) stepChar.sampleQuote = trimmedPara.slice(0, 60);

        segments.push({
          id: `seg-${segmentCounter++}`,
          index: segments.length + 1,
          characterId: stepChar.id,
          characterName: stepChar.name,
          text: trimmedPara,
          voice: stepChar.voice,
        });
      } else if (trimmedPara.startsWith('هَلْ تَعْلَمُونَ') || trimmedPara.startsWith('تَخَيَّلُوا') || trimmedPara.startsWith('تَذَكَّرُوا')) {
        const guideChar = charactersMap.get('char-hero') || charactersMap.get('char-thinker') || narratorChar;
        guideChar.quoteCount++;
        if (!guideChar.sampleQuote) guideChar.sampleQuote = trimmedPara.slice(0, 60);

        segments.push({
          id: `seg-${segmentCounter++}`,
          index: segments.length + 1,
          characterId: guideChar.id,
          characterName: guideChar.name,
          text: trimmedPara,
          voice: guideChar.voice,
        });
      } else if (trimmedPara.startsWith('شُكْرًا لَكُمْ')) {
        const thankChar = charactersMap.get('char-hero') || narratorChar;
        thankChar.quoteCount++;
        if (!thankChar.sampleQuote) thankChar.sampleQuote = trimmedPara.slice(0, 60);

        segments.push({
          id: `seg-${segmentCounter++}`,
          index: segments.length + 1,
          characterId: thankChar.id,
          characterName: thankChar.name,
          text: trimmedPara,
          voice: thankChar.voice,
        });
      } else {
        // Standard narrative passage
        narratorChar.quoteCount++;
        if (!narratorChar.sampleQuote) narratorChar.sampleQuote = trimmedPara.slice(0, 60);

        segments.push({
          id: `seg-${segmentCounter++}`,
          index: segments.length + 1,
          characterId: narratorChar.id,
          characterName: narratorChar.name,
          text: trimmedPara,
          voice: narratorChar.voice,
        });
      }
    }
  }

  // Ensure at least 2 characters exist for every lesson so multi-speaker mode is always available & expressive
  if (charactersMap.size === 1) {
    const companion = getOrCreateChar(
      'char-companion',
      'المحاور التفاعلي (بلال)',
      'child_boy',
      'Puck'
    );
    if (segments.length > 1) {
      segments.forEach((seg, idx) => {
        if (idx % 2 === 1) {
          seg.characterId = companion.id;
          seg.characterName = companion.name;
          seg.voice = companion.voice;
          companion.quoteCount++;
          if (!companion.sampleQuote) companion.sampleQuote = seg.text.slice(0, 60);
        }
      });
    }
  }

  return {
    characters: Array.from(charactersMap.values()),
    segments,
  };
}
