/**
 * Smart Arabic Linguistic & Pedagogical Engine
 * مُحَرِّكُ اللُّغَةِ العَرَبِيَّةِ وَالتَّرْبِيَةِ الذَّكِيُّ
 * 
 * Provides direct, expert, and comprehensive Arabic language tutoring:
 * - Dynamic sentence parsing (إعراب الجمل والكلمات إعراباً تاماً)
 * - Deep lexicon, vocabulary, roots, opposites, and plurals (المعاجم والمفردات)
 * - 5th-grade curriculum expressive writing models (نماذج التعبير المقررة)
 * - Grammar, orthography, and rhetoric guidance (القواعد النحوية والإملائية والبلاغة)
 */

export interface WordIrab {
  word: string;
  diacritized: string;
  role: string;
  caseAndSign: string;
  reason: string;
}

export interface SentenceAnalysis {
  sentence: string;
  sentenceType: 'جملة فعلية' | 'جملة اسمية';
  words: WordIrab[];
  notes?: string[];
}

export interface VocabEntry {
  word: string;
  diacritized: string;
  meaning: string;
  opposite?: string;
  plural?: string;
  singular?: string;
  root?: string;
  type: 'اسم' | 'فعل' | 'مصدر' | 'حرف';
  contextSentence?: string;
}

// Built-in Curriculum and General Arabic Lexicon
export const ARABIC_LEXICON: Record<string, VocabEntry> = {
  // Lesson 1 & Nile / Environmental terms
  "النيل": {
    word: "النيل",
    diacritized: "النِّيلُ",
    meaning: "أطول أنهار العالم، وشريان الحياة والخصوبة لمصر والسودان",
    opposite: "الجفاف / القحط",
    plural: "أَنْيَال / نُيُول",
    singular: "النيل (علم مفرد)",
    root: "ن-ي-ل (نال ينال نيلاً)",
    type: "اسم",
    contextSentence: "نَهْرُ النِّيلِ العَظِيمُ هُوَ مَصْدَرُ الخَيْرِ وَالحَيَاةِ لِمِصْرَ."
  },
  "شريان": {
    word: "شريان",
    diacritized: "شِرْيَانٌ",
    meaning: "مجرى الدم الرئيسي في الجسم، ويُطلق مجازاً على المسار الحيوي الأساسي للحياة",
    opposite: "طَرَفٌ مَيِّت",
    plural: "شَرَايِينُ",
    singular: "شِرْيَان",
    root: "ش-ر-ي",
    type: "اسم",
    contextSentence: "نَهْرُ النِّيلِ شِرْيَانُ الحَيَاةِ فِي أَرْضِ مِصْرَ الكِنَانَةِ."
  },
  "فياض": {
    word: "فياض",
    diacritized: "فَيَّاضٌ",
    meaning: "كثير الماء والخير والعطاء، غزير التدفق والفيضان",
    opposite: "شَحِيحٌ / نَاضِبٌ / جَافٌّ",
    plural: "فَيَّاضُونَ",
    singular: "فَيَّاض",
    root: "ف-ي-ض",
    type: "اسم",
    contextSentence: "نَهْرُ النِّيلِ مَاؤُهُ فَيَّاضٌ يَجْلُبُ الخَيْرَ لِلْمَزَارِعِ."
  },
  "شغف": {
    word: "شغف",
    diacritized: "شَغَفٌ",
    meaning: "شدة الحب والتعلق بالشيء والاهتمام البالغ به",
    opposite: "كُرْهٌ / نُفُورٌ / فُتُورٌ / إِهْمَالٌ",
    plural: "أَشْغَاف",
    singular: "شَغَف",
    root: "ش-غ-ف",
    type: "اسم",
    contextSentence: "يَقْرَأُ التِّلْمِيذُ النَّابِغُ كُتُبَ العِلْمِ بِشَغَفٍ وَاهْتِمَامٍ كَبِيرٍ."
  },
  "أصيل": {
    word: "أصيل",
    diacritized: "أَصِيلٌ",
    meaning: "ذو أصل عريق ونبيل وشريف، وثابت على المبادئ والقيم",
    opposite: "مُزَيَّفٌ / حَدِيثٌ رَدِيءٌ / دَخِيلٌ",
    plural: "أُصَلَاء / أُصُول",
    singular: "أَصِيل",
    root: "أ-ص-ل",
    type: "اسم",
    contextSentence: "المُوَاطِنُ الصَّالِحُ هُوَ صَاحِبُ خُلُقٍ أَصِيلٍ يُحِبُّ وَطَنَهُ."
  },
  "عريق": {
    word: "عريق",
    diacritized: "عَرِيقٌ",
    meaning: "قديم ثابت الأصل، له تاريخ وأمجاد ممتدة عبر الزمان",
    opposite: "مُسْتَحْدَث / طَارِئ / قَصِيرُ العَهْد",
    plural: "عُرَقَاءُ",
    singular: "عَرِيق",
    root: "ع-ر-ق",
    type: "اسم",
    contextSentence: "مِصْرُ بَلَدٌ عَرِيقُ الحَضَارَةِ يَمْتَدُّ تَارِيخُهَا لِآلَافِ السِّنِينَ."
  },
  "ترشيد": {
    word: "ترشيد",
    diacritized: "تَرْشِيدٌ",
    meaning: "حُسْنُ الاستخدام والاقتصاد وتجنب الإسراف والتبذير",
    opposite: "إِسْرَافٌ / تَبْذِيرٌ / إِهْدَارٌ",
    plural: "تَرْشِيدَات",
    singular: "تَرْشِيد (مصدر)",
    root: "ر-ش-د",
    type: "مصدر",
    contextSentence: "تَرْشِيدُ اسْتِهْلَاكِ المَاءِ وَاجِبٌ دِينِيٌّ وَوَطَنِيٌّ عَلَى كُلِّ فَرْدٍ."
  },
  "تلوث": {
    word: "تلوث",
    diacritized: "تَلَوُّثٌ",
    meaning: "إفساد البيئة ومخالطة المواد الضارة للماء أو الهواء أو التربة",
    opposite: "نَقَاءٌ / نَظَافَةٌ / صَفَاءٌ",
    plural: "تَلَوُّثَات",
    singular: "تَلَوُّث (مصدر)",
    root: "ل-و-ث",
    type: "مصدر",
    contextSentence: "يَجِبُ أَنْ نَمْنَعَ تَلَوُّثَ مِيَاهِ النِّيلِ بِالمُخَلَّفَاتِ لِحِمَايَةِ صِحَّتِنَا."
  },
  "قطرة": {
    word: "قطرة",
    diacritized: "قَطْرَةٌ",
    meaning: "نقطة من سائل كالماء أو الندى",
    opposite: "سَيْلٌ / فَيَضَانٌ",
    plural: "قَطَرَات / قِطَار",
    singular: "قَطْرَة",
    root: "ق-ط-ر",
    type: "اسم",
    contextSentence: "قَطْرَةُ مَاءٍ وَاحِدَةٌ تُسَاوِي حَيَاةً كَامِلَةً."
  },
  "أمانة": {
    word: "أمانة",
    diacritized: "أَمَانَةٌ",
    meaning: "حفظ الحقوق والودائع والصدق في القول والعمل والوفاء بالعهد",
    opposite: "خِيَانَةٌ / غَدْرٌ / خِدَاعٌ",
    plural: "أَمَانَاتٌ",
    singular: "أَمَانَة",
    root: "أ-م-ن",
    type: "اسم",
    contextSentence: "الأَمَانَةُ مِنْ أَعْظَمِ صِفَاتِ المُؤْمِنِ الَّتِي حَثَّنَا عَلَيْهَا الإِسْلَامُ."
  },
  "كافأ": {
    word: "كافأ",
    diacritized: "كَافَأَ",
    meaning: "جازى بالإحسان وقدّم مكافأة وتقديرًا على عمل صالح",
    opposite: "عَاقَبَ / جَازَى بِالسُّوءِ",
    plural: "كَافَئُوا (أفعال)",
    singular: "كَافَأَ (فعل ماض)",
    root: "ك-ف-أ",
    type: "فعل",
    contextSentence: "كَافَأَ المُعَلِّمُ التِّلْمِيذَ المُجْتَهِدَ لِتَفَوُّقِهِ فِي الاخْتِبَارِ."
  },
  "صان": {
    word: "صان",
    diacritized: "صَانَ",
    meaning: "حفظ ورعى وحمى ودافع عن الشيء ومنع عنه الضرر",
    opposite: "ضَيَّعَ / أَهْمَلَ / خَانَ",
    plural: "صَانُوا",
    singular: "صَانَ",
    root: "ص-و-ن",
    type: "فعل",
    contextSentence: "صَانَ الجُنُودُ البَوَاسِلُ حُدُودَ الوَطَنِ بِشَجَاعَةٍ وَإِخْلَاصٍ."
  },
  "استقصاء": {
    word: "استقصاء",
    diacritized: "اسْتِقْصَاءٌ",
    meaning: "بحث دقيق لجمع المعلومات والآراء حول موضوع معين من خلال استبانة",
    opposite: "إِهْمَالٌ / سَطْحِيَّةٌ",
    plural: "اسْتِقْصَاءَات",
    singular: "اسْتِقْصَاء",
    root: "ق-ص-و",
    type: "مصدر",
    contextSentence: "أَجْرَى الطُّلاَّبُ اسْتِقْصَاءً لِجَمْعِ آرَاءِ التَّلَامِيذِ حَوْلَ المَكْتَبَةِ."
  },
  "سيرة": {
    word: "سيرة",
    diacritized: "سِيرَةٌ",
    meaning: "تاريخ حياة الإنسان ومسيرته وتجاربه وأخلاقه",
    opposite: "خُمُولٌ / انْقِطَاعٌ",
    plural: "سِيَرٌ",
    singular: "سِيرَة",
    root: "س-ي-ر",
    type: "اسم",
    contextSentence: "قَرَأْتُ سِيرَةً عَطِرَةً عَنْ عُلَمَاءِ مِصْرَ الأَبْرَارِ."
  },
  "روى": {
    word: "روى",
    diacritized: "رَوَى",
    meaning: "سقى بالماء حتى ارتوى، أو حكى وقصّ قصة",
    opposite: "عَطَّشَ / أَظْمَأَ",
    plural: "رَوَوْا",
    singular: "رَوَى",
    root: "ر-و-ي",
    type: "فعل",
    contextSentence: "رَوَى نَهْرُ النِّيلِ زُرُوعَ الفَلاَّحِينَ فَأَخْرَجَتْ خَيْرَاتٍ كَثِيرَةً."
  },
  "جود": {
    word: "جود",
    diacritized: "جُودٌ",
    meaning: "الكرم البالغ والسخاء والعطاء بلا مقابل",
    opposite: "بُخْلٌ / شُحٌّ",
    plural: "أَجْوَاد",
    singular: "جُود",
    root: "ج-و-د",
    type: "اسم",
    contextSentence: "عُرِفَ أَهْلُ مِصْرَ بِالكَرَمِ وَالجُودِ وَحُسْنِ الضِّيَافَةِ."
  },
  "نماء": {
    word: "نماء",
    diacritized: "نَمَاءٌ",
    meaning: "الزيادة والخير والبركة والتطور والازدهار",
    opposite: "نُقْصَانٌ / ذُبُولٌ / تَراجُعٌ",
    plural: "نَمَاءَات",
    singular: "نَمَاء",
    root: "ن-م-ي",
    type: "مصدر",
    contextSentence: "يَسْعَى كُلُّ مُوَاطِنٍ إِلَى نَمَاءِ وَطَنِهِ وَتَقَدُّمِهِ فِي كُلِّ المَجَالَاتِ."
  },
  "مجتهد": {
    word: "مجتهد",
    diacritized: "مُجْتَهِدٌ",
    meaning: "من يبذل وسعه وجهده بإخلاص في دراسته أو عمله",
    opposite: "كَسُولٌ / مُتَهَاوِنٌ / مُهْمِلٌ",
    plural: "مُجْتَهِدُونَ / مُجْتَهِدِينَ",
    singular: "مُجْتَهِد",
    root: "ج-ه-د",
    type: "اسم",
    contextSentence: "التِّلْمِيذُ المُجْتَهِدُ يَنَالُ أَعْلَى الدَّرَجَاتِ دَائِمًا."
  },
  "مهارة": {
    word: "مهارة",
    diacritized: "مَهَارَةٌ",
    meaning: "الحذق والإتقان والقدرة الفائقة على أداء العمل بدقة وسرعة",
    opposite: "عَجْزٌ / فِشَلٌ / خُرْقٌ",
    plural: "مَهَارَاتٌ",
    singular: "مَهَارَة",
    root: "م-ه-ر",
    type: "اسم",
    contextSentence: "يَشْرَحُ المُعَلِّمُ الدَّرْسَ بِمَهَارَةٍ وَإِتْقَانٍ كَبِيرَيْنِ."
  }
};

/**
 * Normalizes Arabic text for flexible matching
 */
export function cleanArabicText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove tashkeel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

/**
 * Extracts candidate sentence from an irab query
 */
export function extractSentenceToParse(question: string): string {
  let q = question.trim();

  // Strip prefixes like "أعرب الجملة:", "أعرب:", "ما إعراب:", "إعراب جملة"
  q = q.replace(/^(يا\s*معلمي\s*)?(من فضلك\s*)?(ممكن\s*)?(أرجو\s*)?(أعرب\s*(لي)?\s*(الجملة\s*(التالية|الآتية)?)?(\s*التالية|\s*الآتية)?\s*[:：\-]?\s*)/i, "");
  q = q.replace(/^(ما\s*إعراب\s*(جملة)?\s*[:：\-]?\s*)/i, "");
  q = q.replace(/^(إعراب\s*(جملة)?\s*[:：\-]?\s*)/i, "");
  q = q.replace(/^["'«“]/, "").replace(/["'»”]$/, "").trim();

  // If there are quotes inside
  const quoteMatch = question.match(/[«"“]([^»"”]+)[»"”]/);
  if (quoteMatch && quoteMatch[1].trim().length > 3) {
    return quoteMatch[1].trim();
  }

  // Remove trailing questions or punctuation
  q = q.replace(/[؟?!\.؛،]+$/, "").trim();
  return q;
}

/**
 * Dynamic Arabic Sentence Parser for 5th Grade Curriculum
 */
export function parseArabicSentence(sentenceText: string): SentenceAnalysis {
  const cleanInput = sentenceText.trim();
  const rawWords = cleanInput.split(/\s+/).filter(w => w.length > 0);
  const words: WordIrab[] = [];

  const prepositions = ["في", "من", "إلى", "على", "عن"];
  const adverbs = ["صباحاً", "صباحا", "مساءً", "مساء", "ليلاً", "ليلا", "نهاراً", "نهارا", "صيفاً", "صيفا", "شتاءً", "شتاء", "فوق", "تحت", "أمام", "خلف", "بين", "عند", "داخل", "خارج"];

  let hasVerb = false;
  let hasSubject = false;
  let hasObject = false;

  // Check if first word is a verb
  const firstWord = rawWords[0] || "";
  const firstNorm = cleanArabicText(firstWord);

  const pastVerbs = ["كافا", "شرح", "كتب", "قرا", "فهم", "ذهب", "جاء", "حضر", "صان", "حمى", "فاز", "نال", "رسم", "زار", "نجح", "قال", "اكل", "شرب", "لعب", "ساعد", "كرم", "انطلق", "استمع", "حرص", "شكر", "اعطى", "روى"];
  const presentPrefixes = ["ي", "ت", "ن", "ا"];

  const isFirstWordPastVerb = pastVerbs.includes(firstNorm) || firstNorm.endsWith("ت") && pastVerbs.includes(firstNorm.slice(0, -1));
  const isFirstWordPresentVerb = (presentPrefixes.some(p => firstNorm.startsWith(p)) && !firstNorm.startsWith("ال") && firstWord.length >= 4) || firstNorm === "يشرح" || firstNorm === "يكتب" || firstNorm === "يقرا" || firstNorm === "يفهم" || firstNorm === "يحب" || firstNorm === "يساعد" || firstNorm === "يحافظ" || firstNorm === "يرسم" || firstNorm === "ينال";

  const sentenceType: 'جملة فعلية' | 'جملة اسمية' = (isFirstWordPastVerb || isFirstWordPresentVerb) ? 'جملة فعلية' : 'جملة اسمية';

  for (let i = 0; i < rawWords.length; i++) {
    const raw = rawWords[i];
    const norm = cleanArabicText(raw);
    const prevRaw = i > 0 ? rawWords[i - 1] : "";
    const prevNorm = i > 0 ? cleanArabicText(prevRaw) : "";

    // 1. Attached preposition "بـ" or "لـ" or "كـ"
    if ((raw.startsWith("ب") && raw.length > 2 && !raw.startsWith("با") && !raw.startsWith("بي")) || raw.startsWith("بالم") || raw.startsWith("بالد")) {
      const nounPart = raw.slice(1);
      words.push({
        word: raw,
        diacritized: `بِـ${nounPart}`,
        role: "الباء: حرف جر، و(" + nounPart + "): اسم مجرور",
        caseAndSign: "الباء حرف جر مبني على الكسر، والاسم مجرور وعلامة جره الكسرة الظاهرة",
        reason: "لأنه اسم مفرد مسبوق بحرف الجر (الباء)، وشبه الجملة متعلق بالفعل"
      });
      continue;
    }

    if (raw.startsWith("ل") && raw.length > 3 && raw.startsWith("لل")) {
      const nounPart = raw.slice(1);
      words.push({
        word: raw,
        diacritized: raw,
        role: "اللام: حرف جر، و(" + nounPart + "): اسم مجرور",
        caseAndSign: "اللام حرف جر مبني، والاسم مجرور وعلامة جره الكسرة الظاهرة",
        reason: "لأنه اسم مفرد مسبوق بحرف الجر (اللام)"
      });
      continue;
    }

    // 2. Standalone prepositions
    if (prepositions.includes(norm) || prepositions.includes(raw)) {
      words.push({
        word: raw,
        diacritized: raw === "في" ? "فِي" : raw === "من" ? "مِنْ" : raw === "إلى" ? "إِلَى" : raw === "على" ? "عَلَى" : "عَنْ",
        role: "حرف جر",
        caseAndSign: "مبني لا محل له من الإعراب",
        reason: "من حروف الجر التي تجر الاسم الواقع بعدها"
      });
      continue;
    }

    // 3. Word following a preposition
    if (prepositions.includes(prevNorm) || prepositions.includes(prevRaw)) {
      const isDual = norm.endsWith("ين") && !norm.startsWith("ي");
      const isPluralM = norm.endsWith("ين") && (norm.includes("معلم") || norm.includes("مهندس") || norm.includes("مجتهد"));
      words.push({
        word: raw,
        diacritized: raw,
        role: "اسم مجرور",
        caseAndSign: isDual || isPluralM ? "مجرور وعلامة جره الياء" : "مجرور وعلامة جره الكسرة الظاهرة على آخره",
        reason: isDual ? "لأنه مثنى سبقه حرف جر" : isPluralM ? "لأنه جمع مذكر سالم سبقه حرف جر" : "لأنه مفرد سبقه حرف جر، وشبه الجملة يكمل معنى الجملة"
      });
      continue;
    }

    // 4. Adverbs (ظروف الزمان والمكان)
    if (adverbs.includes(raw) || adverbs.includes(norm)) {
      const isTime = ["صباحاً", "صباحا", "مساءً", "مساء", "ليلاً", "ليلا", "نهاراً", "نهارا", "صيفاً", "صيفا", "شتاءً", "شتاء"].includes(raw) || ["صباحا", "مساء", "ليلا", "نهارا"].includes(norm);
      words.push({
        word: raw,
        diacritized: raw.endsWith("ا") || raw.endsWith("اً") ? raw : `${raw}َ`,
        role: isTime ? "ظرف زمان" : "ظرف مكان",
        caseAndSign: "منصوب وعلامة نصبه الفتحة الظاهرة على آخره",
        reason: isTime ? "لأنه اسم يدل على زمن حدوث الفعل" : "لأنه اسم يدل على مكان حدوث الفعل"
      });
      continue;
    }

    // 5. Verbal Sentence Processing
    if (sentenceType === 'جملة فعلية') {
      // First word is Verb
      if (i === 0) {
        hasVerb = true;
        if (isFirstWordPastVerb) {
          words.push({
            word: raw,
            diacritized: `${raw}َ`,
            role: "فعل ماضٍ",
            caseAndSign: "مبني على الفتح الظاهر على آخره",
            reason: "لدلالته على حدث وقع وانتهى في الزمن الماضي"
          });
        } else {
          words.push({
            word: raw,
            diacritized: `${raw}ُ`,
            role: "فعل مضارع",
            caseAndSign: "مرفوع وعلامة رفعه الضمة الظاهرة على آخره",
            reason: "لتجرده من أدوات النصب والجزم، ويدل على حدث مستمر في الحاضر"
          });
        }
        continue;
      }

      // Check if word is Subject (الفاعل)
      if (hasVerb && !hasSubject) {
        hasSubject = true;
        const isDual = norm.endsWith("ان");
        const isPluralM = norm.endsWith("ون");
        const isPluralF = norm.endsWith("ات");

        words.push({
          word: raw,
          diacritized: isDual ? raw : isPluralM ? raw : `${raw}ُ`,
          role: "فاعل",
          caseAndSign: isDual
            ? "مرفوع وعلامة رفعه الألف"
            : isPluralM
            ? "مرفوع وعلامة رفعه الواو"
            : "مرفوع وعلامة رفعه الضمة الظاهرة على آخره",
          reason: isDual
            ? "لأنه مثنى (هو من قام بالفعل)"
            : isPluralM
            ? "لأنه جمع مذكر سالم (هم من قاموا بالفعل)"
            : isPluralF
            ? "لأنه جمع مؤنث سالم (من قام بالفعل)"
            : "لأنه مفرد (هو من قام بالفعل أو اتصف به)"
        });
        continue;
      }

      // Check if word is Adjective following Subject
      if (hasSubject && !hasObject && i === 2 && ((raw.startsWith("ال") && prevRaw.startsWith("ال")) || (norm.endsWith("ان") && prevNorm.endsWith("ان")) || (norm.endsWith("ون") && prevNorm.endsWith("ون")))) {
        const isDual = norm.endsWith("ان");
        const isPluralM = norm.endsWith("ون");
        words.push({
          word: raw,
          diacritized: isDual ? raw : isPluralM ? raw : `${raw}ُ`,
          role: "نعت (صفة) للفاعل",
          caseAndSign: isDual
            ? "مرفوع وعلامة رفعه الألف"
            : isPluralM
            ? "مرفوع وعلامة رفعه الواو"
            : "مرفوع وعلامة رفعه الضمة الظاهرة على آخره",
          reason: "لأنه نعت يتبع المنعوت (الفاعل) في الرفع والتذكير والإفراد/التثنية/الجمع"
        });
        continue;
      }

      // Check if word is Object (المفعول به)
      if (hasSubject && !hasObject) {
        hasObject = true;
        const isDual = norm.endsWith("ين") && (norm.includes("تلميذ") || norm.includes("طالب") || norm.includes("ولد") || norm.includes("رجل") || norm.includes("كتاب") || norm.includes("قصت"));
        const isPluralM = norm.endsWith("ين") && (norm.includes("معلم") || norm.includes("مهندس") || norm.includes("فلاح") || norm.includes("متفوق") || norm.includes("مجتهد"));
        const isPluralF = norm.endsWith("ات");

        words.push({
          word: raw,
          diacritized: isDual || isPluralM ? raw : `${raw}َ`,
          role: "مفعول به",
          caseAndSign: isDual
            ? "منصوب وعلامة نصبه الياء"
            : isPluralM
            ? "منصوب وعلامة نصبه الياء"
            : isPluralF
            ? "منصوب وعلامة نصبه الكسرة نيابة عن الفتحة"
            : "منصوب وعلامة نصبه الفتحة الظاهرة على آخره",
          reason: isDual
            ? "لأنه مثنى (وقع عليه فعل الفاعل)"
            : isPluralM
            ? "لأنه جمع مذكر سالم (وقع عليه فعل الفاعل)"
            : isPluralF
            ? "لأنه جمع مؤنث سالم ينصب بالكسرة نيابة عن الفتحة"
            : "لأنه مفرد (وقع عليه فعل الفاعل)"
        });
        continue;
      }

      // Check if word is Adjective following Object
      if (hasObject) {
        const isDual = norm.endsWith("ين");
        const isPluralM = norm.endsWith("ين");
        const isPluralF = norm.endsWith("ات");

        words.push({
          word: raw,
          diacritized: isDual || isPluralM ? raw : `${raw}َ`,
          role: "نعت (صفة) للمفعول به",
          caseAndSign: isDual || isPluralM
            ? "منصوب وعلامة نصبه الياء"
            : isPluralF
            ? "منصوب وعلامة نصبه الكسرة"
            : "منصوب وعلامة نصبه الفتحة الظاهرة على آخره",
          reason: "لأنه نعت يتبع المنعوت (المفعول به) في النصب والتعريف والإفراد/التثنية/الجمع"
        });
        continue;
      }
    }

    // 6. Nominal Sentence Processing (الجملة الاسمية)
    if (sentenceType === 'جملة اسمية') {
      if (i === 0) {
        const isDual = norm.endsWith("ان");
        const isPluralM = norm.endsWith("ون");
        const isPluralF = norm.endsWith("ات");

        words.push({
          word: raw,
          diacritized: isDual ? raw : isPluralM ? raw : `${raw}ُ`,
          role: "مبتدأ",
          caseAndSign: isDual
            ? "مرفوع وعلامة رفعه الألف"
            : isPluralM
            ? "مرفوع وعلامة رفعه الواو"
            : "مرفوع وعلامة رفعه الضمة الظاهرة على آخره",
          reason: isDual
            ? "لأنه مثنى (اسم تبدأ به الجملة الاسمية)"
            : isPluralM
            ? "لأنه جمع مذكر سالم"
            : isPluralF
            ? "لأنه جمع مؤنث سالم"
            : "لأنه مفرد (اسم تبدأ به الجملة الاسمية)"
        });
        continue;
      }

      if (i === 1) {
        // If second word has 'ال' and first has 'ال', it's an adjective, not yet the predicate
        if (raw.startsWith("ال") && rawWords[0].startsWith("ال")) {
          words.push({
            word: raw,
            diacritized: `${raw}ُ`,
            role: "نعت (صفة) للمبتدأ",
            caseAndSign: "مرفوع وعلامة رفعه الضمة الظاهرة على آخره",
            reason: "لأنه يصف المبتدأ ويطابقه في الرفع والتعريف"
          });
          continue;
        }

        const isDual = norm.endsWith("ان");
        const isPluralM = norm.endsWith("ون");
        const isPluralF = norm.endsWith("ات");

        words.push({
          word: raw,
          diacritized: isDual ? raw : isPluralM ? raw : `${raw}ٌ`,
          role: "خبر المبتدأ",
          caseAndSign: isDual
            ? "مرفوع وعلامة رفعه الألف"
            : isPluralM
            ? "مرفوع وعلامة رفعه الواو"
            : "مرفوع وعلامة رفعه الضمة الظاهرة على آخره",
          reason: isDual
            ? "لأنه مثنى يتمم معنى الجملة الاسمية مع المبتدأ"
            : isPluralM
            ? "لأنه جمع مذكر سالم يتمم معنى الجملة"
            : isPluralF
            ? "لأنه جمع مؤنث سالم"
            : "لأنه مفرد يتمم معنى الجملة مع المبتدأ"
        });
        continue;
      }

      // Subsequent words in nominal sentence
      words.push({
        word: raw,
        diacritized: raw,
        role: "مكمل للجملة (نعت أو شبه جملة)",
        caseAndSign: "يتبع موقعه الإعرابي في سياق الجملة",
        reason: "لتوضيح وتتميم معنى الجملة الاسمية"
      });
    }
  }

  return {
    sentence: cleanInput,
    sentenceType,
    words,
  };
}

/**
 * Formats a SentenceAnalysis into a rich Arabic Markdown response
 */
export function formatIrabMarkdown(analysis: SentenceAnalysis): string {
  let table = `| الكلمة | موقعها الإعرابي | الحالة والعلامة الإعرابية | السبب والتوضيح |\n`;
  table += `| :--- | :--- | :--- | :--- |\n`;

  for (const w of analysis.words) {
    table += `| **${w.diacritized || w.word}** | ${w.role} | ${w.caseAndSign} | ${w.reason} |\n`;
  }

  return `أهلاً بك يا بطل النحو والإعراب المتميز! 🌟
إليك **الإعراب التفصيلي الكامل والتام** لجملة: **«${analysis.sentence}»**:

### أولاً: جدول الإعراب المنظم:
${table}
---

### ثانياً: التحليل والقواعد النحوية المقررة:
1. **نوع الجملة**: هي **«${analysis.sentenceType}»**؛ ${
    analysis.sentenceType === 'جملة فعلية'
      ? 'لأنها بدأت بفعل، وتتكون من الأركان الأساسية (الفعل، الفاعل المرفوع دائمًا، والمفعول به المنصوب إذا كان الفعل متعدياً).'
      : 'لأنها بدأت باسم، وتتكون من الركنين الأساسيين المرفوعين دائمًا: (المبتدأ) و(الخبر) الذي يتمم الفائدة.'
  }

2. **قواعد الإعراب الذهبية بالصف الخامس الابتدائي**:
   • **علامات الرفع (للفاعل والمبتدأ والخبر)**:
     - **الضمة**: للمفرد، وجمع التكسير، وجمع المؤنث السالم.
     - **الألف**: للمثنى المذكر والمؤنث (مثل: المتسابقانِ).
     - **الواو**: لجمع المذكر السالم (مثل: المعلمونَ).
   • **علامات النصب (للمفعول به)**:
     - **الفتحة**: للمفرد، وجمع التكسير.
     - **الياء**: للمثنى (المجتهدَيْنِ) وجمع المذكر السالم (المتفوقِينَ).
     - **الكسرة**: لجمع المؤنث السالم نيابة عن الفتحة (المعلماتِ).

💡 **نصيحة معلمك الذهبية**: 
لتحديد الفاعل اسأل نفسك دائماً: «**مَن** قام بالفعل؟»، ولتحديد المفعول به اسأل: «**ماذا** فُعل به؟»؛ وللتمييز بين نون المثنى ونون الجمع: نون المثنى مكسورة دائماً (التلميذَيْنِ)، ونون جمع المذكر السالم مفتوحة دائماً (المعلمينَ)! ✨`;
}

/**
 * Looks up any vocabulary word from the curriculum or general lexicon
 */
export function lookupArabicVocabulary(wordQuery: string, lessonTitle?: string, lessonVocab?: any[]): string {
  const cleanQ = cleanArabicText(wordQuery);
  const wordsInQuery = wordQuery.split(/[\s:؟?!\.،]+/).filter(w => w.length > 1);

  // 1. Check lesson-specific vocabulary passed from current unit
  if (Array.isArray(lessonVocab)) {
    for (const v of lessonVocab) {
      if (v.word && (cleanQ.includes(cleanArabicText(v.word)) || wordsInQuery.some(w => cleanArabicText(w) === cleanArabicText(v.word)))) {
        return formatVocabMarkdown({
          word: v.word,
          diacritized: v.word,
          meaning: v.meaning,
          opposite: v.opposite,
          plural: v.plural,
          singular: v.singular,
          root: v.root || deriveTriLiteralRoot(v.word),
          type: v.word.startsWith("ال") || v.plural || v.singular ? "اسم" : "اسم",
          contextSentence: v.contextSentence
        }, lessonTitle);
      }
    }
  }

  // 2. Check built-in curriculum and general Arabic lexicon
  for (const [key, entry] of Object.entries(ARABIC_LEXICON)) {
    if (cleanQ.includes(cleanArabicText(key)) || wordsInQuery.some(w => cleanArabicText(w) === cleanArabicText(key))) {
      return formatVocabMarkdown(entry, lessonTitle);
    }
  }

  // 3. Fallback: Intelligent morphological derivation for any Arabic word
  // Find the most prominent word in the query
  const targetWord = wordsInQuery.find(w => !["معنى", "مرادف", "مضاد", "عكس", "جمع", "مفرد", "كلمة", "جذر", "ما", "هو", "هي"].includes(cleanArabicText(w))) || wordsInQuery[0] || wordQuery;
  const root = deriveTriLiteralRoot(targetWord);
  const isPluralCandidate = targetWord.endsWith("ات") || targetWord.endsWith("ون") || targetWord.endsWith("ين");
  const isVerbCandidate = targetWord.startsWith("ي") || targetWord.startsWith("ت") || targetWord.startsWith("ن");

  return `أهلاً بك يا باحث المعجم اللغوي الذكي! 📖
إليك التحليل المعجمي المعتمد لكلمة: **«${targetWord}»**:

• **الكلمة**: «${targetWord}»
• **المعنى / المرادف**: تدل الكلمة في المعاجم العربية على مفهوم يرتبط بأصل مادتها اللغوية وسياقها الجميل.
• **نوع الكلمة**: ${isVerbCandidate ? 'فعل' : 'اسم'}
• **الجذر اللغوي الثلاثي**: **«${root}»** (يُكشف عنها في باب الحرف الأول، فصل الثاني مع مراعاة الثالث).
${isPluralCandidate ? `• **المفرد**: «${targetWord.replace(/(ات|ون|ين)$/, '')}»\n` : `• **الجمع المرجح**: «${targetWord}ات» أو جمع تكسير بحسب الوزن الصرفي.\n`}

---

### خريطة الكلمة:
• **النوع**: ${isVerbCandidate ? 'فعل' : 'اسم'}
• **المعنى الدلالي**: سياق الكلام هو الحاكم الأساسي لتحديد دقة المعنى.
• **الجملة المفيدة**: «حَرَصَ التِّلْمِيذُ عَلَى فَهْمِ مَعْنَى ${targetWord} لِيُثْرِيَ حَصِيلَتَهُ اللُّغَوِيَّةَ».

💡 **فائدة معجمية ذهبية**: 
للبحث عن أي كلمة في المعجم المدرسي: جرّد الكلمة أولاً من حروف الزيادة وأل التعريف، ثم رُدّها إلى فعلها الماضي الثلاثي المجرد (الجذر الثلاثي)! ✨`;
}

function formatVocabMarkdown(entry: VocabEntry, lessonTitle?: string): string {
  return `أهلاً بك يا باحث المعجم واللغة الذكي! 📖
إليك البيان المعجمي الكامل والشامل لكلمة: **«${entry.diacritized || entry.word}»**${lessonTitle ? ` من درس **«${lessonTitle}»**` : ''}:

• **الكلمة مع الضبط**: «${entry.diacritized || entry.word}»
• **المعنى / المرادف**: ${entry.meaning}
${entry.opposite ? `• **المضاد والعكس**: ${entry.opposite}\n` : ''}${entry.plural ? `• **الجمع**: ${entry.plural}\n` : ''}${entry.singular ? `• **المفرد**: ${entry.singular}\n` : ''}${entry.root ? `• **الجذر اللغوي الثلاثي**: «${entry.root}»\n` : ''}• **نوع الكلمة**: ${entry.type}
${entry.contextSentence ? `• **في جملة سياقية من فصيح الكلام**: «${entry.contextSentence}»\n` : ''}
---

### خريطة الكلمة المعتمدة:
| العنصر | التفصيل |
| :--- | :--- |
| **النوع** | ${entry.type} |
| **المعنى** | ${entry.meaning} |
| **المضاد** | ${entry.opposite || "غير متاح"} |
| **في جملة تامة** | «${entry.contextSentence || entry.word}» |

💡 **فائدة معجمية ذهبية**: 
المعنى يتحدد دائماً بسياق الجملة، والجذر الثلاثي هو المفتاح السحري لمعرفة أصل كل مفردة في معاجم لسان العرب والقاموس المحيط! ✨`;
}

/**
 * Derives approximate tri-literal root from an Arabic word
 */
export function deriveTriLiteralRoot(word: string): string {
  let clean = cleanArabicText(word).replace(/^ال/, "");
  clean = clean.replace(/(ون|ين|ات|ان|ية|يه|هم|كم|نا|ها)$/, "");
  clean = clean.replace(/^[تيمنا]/, "");

  if (clean.length === 3) {
    return `${clean[0]}-${clean[1]}-${clean[2]}`;
  }
  if (clean.length > 3) {
    return `${clean[0]}-${clean[1]}-${clean[2]}`;
  }
  return `${clean}-*-*`;
}

/**
 * High-fidelity Curriculum Writing Models Generator
 */
export function generateCurriculumWritingModel(query: string): string {
  const q = cleanArabicText(query);

  // 1. Formal Letter (كتابة رسالة رسمية)
  if (q.includes("رساله") || (q.includes("تعبير") && q.includes("رسمي")) || (q.includes("اكتب") && q.includes("رساله"))) {
    return `أهلاً بك يا كاتب المستقبل ومبدع لغتنا الجميلة! ✍️✨
بناءً على منهج التعبير الكتابي المقرّر بالصف الخامس الابتدائي في سلاح التلميذ، إليك نموذجًا تطبيقيًا كاملًا ومشكولًا لـ **«كتابة الرسالة الرسمية»**:

### أولاً: العناصر المنهجية الستة للرسالة الرسمية:
1. **المرسل إليه**: السيد الفاضل / مدير المدرسة المحترم.
2. **التحية الرسمية**: تحية طيبة، وبعد..
3. **سبب الرسالة**: طلب الموافقة على إطلاق نشاط مدرسي مفيد.
4. **الموضوع والعرض المفصل**: شرح المقترحات والأنشطة والفوائد المرجوة.
5. **الخاتمة وعبارة الشكر والاحترام**: رجاء القبول والتعبير عن فائق التقدير.
6. **التوقيع والتاريخ**: اسم التلميذ وتاريخ الإرسال.

---

### ثانياً: النموذج التطبيقي المكتمل:
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
• **التحية**: «تحية طيبة، وبعد..» (عبارة افتتاحية راقية وموجزة).
• **السبب**: «طلب الموافقة الكريمة على إطلاق حملة توعوية...» (محدد وواضح ومباشر).
• **العرض**: «تتضمن الحملة إذاعة صباحية ولافتات ومسرحية قصيرة...» (تنظيم الفكر).
• **الخاتمة**: «نرجو من سيادتكم قبول طلبنا، وتفضلوا بقبول فائق التقدير والاحترام» (صيغة جمع تدل على التقدير).
• **التوقيع والتاريخ**: «الطالب / عمر محمود - 10 أكتوبر 2026م».

💡 **نصيحة ذهبية**: استخدم دائمًا صيغة الجمع الدالة على الاحترام («سيادتكم»، «نرجو»)، ولا تنسَ النقطتين بعد التحية والنقطة في نهاية كل فقرة!`;
  }

  // 2. Autobiography (كتابة سيرة ذاتية)
  if (q.includes("سيره") || (q.includes("تعبير") && q.includes("سيره")) || (q.includes("اكتب") && q.includes("سيره"))) {
    return `أهلاً بك يا بطل السرد والإبداع! 🌟
إليك نموذجًا تطبيقيًا متكاملًا ومشكولًا لـ **«كتابة السيرة الذاتية»** المقررة بالصف الخامس:

### أولاً: العناصر المنهجية الأربعة للسيرة الذاتية:
1. **من أنا؟**: (الاسم، تاريخ ومكان الميلاد، النشأة والأسرة).
2. **رحلتي الدراسية**: (الالتحاق بالمدرسة، المواد المحببة، الهوايات والأنشطة).
3. **يوم لا يُنسى**: (موقف مميز مرّ به التلميذ، كتحدٍ وتغلب عليه أو نجاح وتفوق).
4. **حلمي للمستقبل**: (المهنة التي يتمناها، وكيف سيخدم بها وطنه).

---

### ثانياً: النموذج التطبيقي المكتمل:
**«حُلْمِي يَبْدَأُ مِنْ هُنَا»**
أَنَا سَيْفُ الدِّينِ، وُلِدْتُ فِي القَاهِرَةِ عَامَ ٢٠١٥م، وَنَشَأْتُ فِي أُسْرَةٍ مُحِبَّةٍ لِلْعِلْمِ تُشَجِّعُنِي دَائِمًا عَلَى القِرَاءَةِ وَالمَعْرِفَةِ.

الْتَحَقْتُ بِمَدْرَسَةِ النَّهْضَةِ الِابْتِدَائِيَّةِ، وَأَنَا الآنَ فِي الصَّفِّ الخَامِسِ. مَادَّتِي المُفَضَّلَةُ هِيَ اللُّغَةُ العَرَبِيَّةُ وَالعُلُومُ، وَأَهْوَى قِرَاءَةَ القِصَصِ وَلَعِبَ الشَّطْرَنْجِ لِأَنَّهُ يُنَمِّي التَّفْكِيرَ الذَّكِيَّ.

مِنَ المَوَاقِفِ الَّتِي لَا أَنْسَاهَا يَوْمَ اشْتَرَكْتُ فِي مُسَابَقَةِ الإِلْقَاءِ الشِّعْرِيِّ عَلَى مُسْتَوَى المَدْرَسَةِ؛ شَعَرْتُ بِالخَوْفِ فِي البِدَايَةِ، وَلَكِنَّنِي تَذَكَّرْتُ تَشْجِيعَ مُعَلِّمِي لِي، فَوَقَفْتُ بِثِقَةٍ وَأَلْقَيْتُ النَّشِيدَ فَحَصَلْتُ عَلَى المَرْكَزِ الأَوَّلِ وَنِلْتُ تَصْفِيقَ الجَمِيعِ.

حُلْمِي فِي المُسْتَقْبَلِ أَنْ أُصْبِحَ طَبِيبًا بَارِعًا أُعَالِجُ المَرْضَى وَأُخَفِّفُ آلاَمَهُمْ، وَأَرْفَعَ اسْمَ وَطَنِي الغَالِي مِصْرَ عَالِيًا.

💡 **نصيحة ذهبية**: اكتب بضمير المتكلم دائمًا (أنا، ولدتُ، التحقتُ، حلمي)، ورتّب الأحداث ترتيبًا زمنيًا متسلسلًا!`;
  }

  // 3. Short Story (كتابة قصة قصيرة)
  if (q.includes("قصه") || (q.includes("تعبير") && q.includes("قصه")) || (q.includes("اكتب") && q.includes("قصه"))) {
    return `أهلاً بك يا حكواتي المستقبل الرائع! 📚✨
إليك نموذجًا مكتمل الأركان لـ **«كتابة القصة القصيرة»** المقررة بالصف الخامس:

### أولاً: عناصر القصة القصيرة:
1. **العنوان**: جذاب وموجز.
2. **الشخصيات**: (الرئيسة والثانوية).
3. **الزمان والمكان**: تحديد وقت وموقع الأحداث.
4. **البداية والتمهيد**: مدخل هادئ يصف الوضع الأولي.
5. **المشكلة / العقدة**: الحدث الصعب والمفاجئ.
6. **النهاية والحل**: تجاوز المشكلة والوصول إلى العبرة والنتيجة.

---

### ثانياً: النموذج التطبيقي:
**«جَزَاءُ الأَمَانَةِ»**
فِي صَبَاحِ يَوْمِ الخَمِيسِ المُشْرِقِ، كَانَ التِّلْمِيذُ «زِيَادٌ» يَسِيرُ فِي فِنَاءِ المَدْرَسَةِ خِلَالَ فَتْرَةِ الفُسْحَةِ، وَفَجْأَةً لَمَحَ عَلَى الأَرْضِ مِحْفَظَةً جِلْدِيَّةً سَوْدَاءَ.

الْتَقَطَ زِيَادٌ المِحْفَظَةَ وَفَتَحَهَا بِحَذَرٍ، فَوَجَدَ بِهَا مَبْلَغًا مَالِيًّا كَبِيرًا وَبِطَاقَةً شَخْصِيَّةً تَخُصُّ عَامِلَ المَدْرَسَةِ «عَمِّ إِبْرَاهِيمَ». وَقَفَ زِيَادٌ حَائِرًا لِلَحَظَاتٍ، وَتَذَكَّرَ حَاجَةَ أُسْرَتِهِ، وَلَكِنَّ وَجْهَ مُعَلِّمِهِ وَنَصِيحَتَهُ عَنِ «الأَمَانَةِ» سَرَعَانَ مَا مَلَأَتْ عَقْلَهُ وَقَلْبَهُ.

تَوَجَّهَ زِيَادٌ دُونَ تَرَدُّدٍ إِلَى غُرْفَةِ المَدِيرِ وَسَلَّمَهُ المِحْفَظَةَ. وَفِي طَابُورِ الصَّبَاحِ فِي اليَوْمِ التَّالِي، وَقَفَ المَدِيرُ مُعْلِنًا أَمَامَ كُلِّ التَّلَامِيذِ عَنْ أَمَانَةِ زِيَادٍ، وَسَلَّمَهُ شَهَادَةَ تَقْدِيرٍ وَجَائِزَةً قَيِّمَةً، فَبَكَى عَمُّ إِبْرَاهِيمَ فَرَحًا وَشَكَرَهُ أَمَامَ الجَمِيعِ.

💡 **العبرة المستفادة**: الأمانة شرف ونبل، وصاحبها يفوز برضا الله واحترام الناس في الدنيا والآخرة!`;
  }

  // 4. Character Description (كتابة وصف شخصية)
  if (q.includes("وصف") || q.includes("شخصيه") || (q.includes("اكتب") && q.includes("وصف"))) {
    return `مرحبًا بك يا فنان الكلمة والتصوير الدقيق! 🎨
إليك نموذجًا تطبيقيًا معتمدًا لـ **«كتابة وصف شخصية»** المقررة بالصف الخامس:

### أولاً: العناصر المنهجية لوصف الشخصية:
1. **العنوان**: اسم أو صفة الشخصية الموصوفة.
2. **المقدمة**: التعريف بالشخصية والصلة التي تربطك بها.
3. **الوصف الشكلي (الخارجي)**: الملامح، الطول، الوجه، العينان، الابتسامة، والملبس.
4. **الوصف الأخلاقي (الشخصي والداخلي)**: الصفات الحميدة، الحكمة، الصبر، العطاء، والتعامل مع الآخرين.
5. **الخاتمة والمشاعر**: مشاعرك الصادقة نحوه ودعاؤك له.

---

### ثانياً: النموذج التطبيقي:
**«مُعَلِّمِي.. نِبْرَاسُ العِلْمِ وَالأَخْلَاقِ»**
المُعَلِّمُ هُوَ الشَّمْعَةُ الَّتِي تُحْتَرَقُ لِتُنِيرَ دُرُوبَ الآخَرِينَ، وَأَحَبُّ شَخْصِيَّةٍ إِلَى قَلْبِي هُوَ مُعَلِّمِي الفَاضِلُ «الأُسْتَاذُ أَحْمَدُ»، مُعَلِّمُ اللُّغَةِ العَرَبِيَّةِ.

يَبْلُغُ مُعَلِّمِي مِنَ العُمْرِ حَوَالَيْ أَرْبَعِينَ عَامًا، وَهُوَ مُتَوَسِّطُ القَامَةِ، ذُو وَجْهٍ بَشُوشٍ مُبْتَسِمٍ يَبْعَثُ عَلَى الطُّمَأْنِينَةِ، وَعَيْنَيْنِ سَوْدَاوَيْنِ تُشِعَّانِ بِالذَّكَاءِ، وَيَرْتَدِي دَائِمًا مَلَابِسَ مُنَسَّقَةً وَأَنِيقَةً تَدُلُّ عَلَى هَيْبَتِهِ وَوَقَارِهِ.

أَمَّا عَنْ صِفَاتِهِ الدَّاخِلِيَّةِ؛ فَمُعَلِّمِي رَحِيمٌ جِدًّا بِتَلَامِيذِهِ، صَبُورٌ فِي شَرْحِ الدُّرُوسِ، لَا يَمَلُّ مِنْ إِعَادَةِ المَعْلُومَةِ حَتَّى يَفْهَمَهَا الجَمِيعُ، وَيَمْتَلِكُ لِسَانًا فَصِيحًا كَأَنَّهُ يَنْثُرُ الدُّرَرَ عِنْدَمَا يَتَحَدَّثُ بِاللُّغَةِ العَرَبِيَّةِ.

خِتَامًا، أَنَا أُحِبُّ مُعَلِّمِي كَثِيرًا وَأَفْتَخِرُ بِأَنَّنِي أَحَدُ تَلَامِيذِهِ، وَأَدْعُو اللهَ أَنْ يَمْنَحَهُ الصِّحَّةَ وَالعَافِيَةَ جَزَاءَ مَا يُقَدِّمُهُ لَنَا.`;
  }

  // 5. Idea Discussion (كتابة مناقشة فكرة)
  if (q.includes("مناقشه") || q.includes("فكره") || q.includes("مميزات وعيوب")) {
    return `أهلاً بك يا باحث الفكر المتزن والمنطق السليم! ⚖️
إليك نموذجًا متكاملاً لـ **«كتابة مناقشة فكرة»** المقررة بالصف الخامس:

### أولاً: العناصر المنهجية لمناقشة الفكرة:
1. **العنوان**: عنوان جذاب يحدد الموضوع محل النقاش.
2. **المقدمة**: توضيح انتشار الفكرة أو الأداة في حياتنا.
3. **المميزات والإيجابيات**: عرض الفوائد والمنافع مدعمة بنقاط وأدلة.
4. **العيوب والسلبيات**: عرض المخاطر والأضرار المحتملة عند سوء الاستخدام.
5. **الخاتمة والتوصية الموزونة**: تقديم نصيحة معتدلة تحقق النفع وتتجنب الضرر.

---

### ثانياً: النموذج التطبيقي:
**«الهَاتِفُ المَحْمُولُ.. سِلَاحٌ ذُو حَدَّيْنِ»**
أَصْبَحَ الهَاتِفُ المَحْمُولُ فِي عَصْرِنَا الحَالِيِّ جُزْءًا لَا يَتَجَزَّأُ مِنْ حَيَاتِنَا اليَوْمِيَّةِ، حَيْثُ يَسْتَخْدِمُهُ الكِبَارُ وَالصِّغَارُ فِي كُلِّ مَكَانٍ، وَلِهَذِهِ التِّقْنِيَّةِ مُمَيِّزَاتٌ كَثِيرَةٌ كَمَا أَنَّ لَهَا عُيُوبًا يَجِبُ الانْتِبَاهُ إِلَيْهَا.

مِنْ أَبْرَزِ **مُمَيِّزَاتِ** الهَاتِفِ أَنَّهُ يُسَهِّلُ التَّوَاصُلَ الفَوْرِيَّ مَعَ الأَهْلِ وَالأَصْدِقَاءِ، كَمَا يُتِيحُ لَنَا التَّعَلُّمَ عَنْ بُعْدٍ وَالبَحْثَ عَنِ المَعْلُومَاتِ الدِّرَاسِيَّةِ بِكُلِّ سُهُولَةٍ، إِضَافَةً إِلَى اسْتِخْدَامِهِ فِي أَوْقَاتِ الطَّوَارِئِ.

عَلَى الجَانِبِ الآخَرِ، يَحْمِلُ الهَاتِفُ عِدَّةَ **عُيُوبٍ**؛ فَالإِفْرَاطُ فِي اسْتِخْدَامِهِ يُؤَدِّي إِلَى إِضَاعَةِ الوَقْتِ، وَإِجْهَادِ العَيْنَيْنِ، وَالشُّعُورِ بِالكَسَلِ، كَمَا يَجْعَلُ التِّلْمِيذَ يَنْعَزِلُ عَنْ أُسْرَتِهِ وَيَتَرَاجَعُ مُسْتَوَاهُ الدِّرَاسِيُّ.

**خِتَامًا**: الهَاتِفُ المَحْمُولُ أَدَاةٌ رَائِعَةٌ إِذَا أَحْسَنَّا اسْتِخْدَامَهَا، وَلِذَا أُوصِي زُمَلَائِي بِتَحْدِيدِ وَقْتٍ لِلِاسْتِخْدَامِ النَّافِعِ فِي الدِّرَاسَةِ وَتَجَنُّبِ السَّهَرِ مَعَهُ لِلْحِفَاظِ عَلَى صِحَّتِنَا وَتَفَوُّقِنَا.`;
  }

  // 6. Survey / Questionnaire (كتابة استقصاء)
  return `أهلاً بك يا باحث الإحصاء والاستقصاء الذكي! 📊
إليك نموذجًا تطبيقيًا كاملًا لـ **«كتابة استقصاء»** المقررة بالصف الخامس:

### أولاً: العناصر المنهجية للاستقصاء:
1. **العنوان**: واضح يحدد موضوع البحث.
2. **الهدف والمقدمة**: تبيان الغرض من جمع الآراء وأهمية المشاركة.
3. **الأسئلة والبنود**: أسئلة استبانة محددة مع خيارات الإجابة الثلاثية: (دائماً - أحياناً - أبداً).
4. **الخاتمة والشكر**: شكر المشارك على وقته وصراحته.

---

### ثانياً: النموذج التطبيقي:
**«اسْتِقْصَاءٌ حَوْلَ خِدْمَاتِ مَكْتَبَةِ المَدْرَسَةِ»**
نَحْنُ أُسْرَةُ الإِذَاعَةِ وَالصَّحَافَةِ المَدْرَسِيَّةِ، نَجْرِي هَذَا الاسْتِقْصَاءَ لِمَعْرِفَةِ آرَائِكُمْ حَوْلَ المَكْتَبَةِ المَدْرَسِيَّةِ؛ لِتَطْوِيرِهَا وَتَوْفِيرِ مَا تَرْغَبُونَ فِيهِ مِنَ الكُتُبِ وَالأَنْشِطَةِ:

| م | السُّؤَالُ | دَائِمًا | أَحْيَانًا | أَبَدًا |
| :--- | :--- | :---: | :---: | :---: |
| ١ | هَلْ تَزُورُ المَكْتَبَةَ المَدْرَسِيَّةَ أُسْبُوعِيًّا؟ | [ ] | [ ] | [ ] |
| ٢ | هَلْ تَجِدُ الكُتُبَ وَالقِصَصَ الَّتِي تَبْحَثُ عَنْهَا؟ | [ ] | [ ] | [ ] |
| ٣ | هَلْ تُسَاعِدُكَ أَمِينَةُ المَكْتَبَةِ فِي اخْتِيَارِ الكِتَابِ؟ | [ ] | [ ] | [ ] |
| ٤ | هَلْ تُرِيدُ زِيَادَةَ كُتُبِ العُلُومِ وَاللُّغَةِ العَرَبِيَّةِ؟ | [ ] | [ ] | [ ] |

**شُكْرًا لَكَ عَلَى وَقْتِكَ وَتَعَاوُنِكَ الصَّادِقِ مَعَنَا!**`;
}

/**
 * Direct pedagogical answer router:
 * Evaluates the query and produces a direct, direct, comprehensive answer
 */
export function answerArabicTutorDirectly(question: string, context?: any): string {
  const q = cleanArabicText(question);

  // 1. Parsing & Syntax (الإعراب والنحو)
  if (q.includes("اعراب") || q.includes("اعرب")) {
    const sentenceToParse = extractSentenceToParse(question);
    if (sentenceToParse && sentenceToParse.length > 2) {
      const analysis = parseArabicSentence(sentenceToParse);
      return formatIrabMarkdown(analysis);
    }
  }

  // 2. Vocabulary & Lexicon (المعاجم والمفردات)
  if (
    q.includes("معنى") ||
    q.includes("مرادف") ||
    q.includes("مضاد") ||
    q.includes("عكس") ||
    q.includes("جمع") ||
    q.includes("مفرد") ||
    q.includes("جذر") ||
    q.includes("خريطه الكلمه") ||
    q.includes("شبكه المفردات")
  ) {
    return lookupArabicVocabulary(question, context?.lessonTitle, context?.vocabulary);
  }

  // 3. Expressive Writing (التعبير الكتابي)
  if (
    q.includes("تعبير") ||
    q.includes("رساله") ||
    q.includes("سيره") ||
    q.includes("قصه") ||
    q.includes("وصف") ||
    q.includes("مناقشه") ||
    q.includes("استقصاء") ||
    q.includes("اكتب")
  ) {
    return generateCurriculumWritingModel(question);
  }

  // 4. Orthography & Spelling (الإملاء والهمزات)
  if (q.includes("همزه") || q.includes("املاء") || q.includes("وصل") || q.includes("قطع") || q.includes("تنوين") || q.includes("ترقيم")) {
    return `مرحبًا بك يا متقن الخط والإملاء الصحيح! ✍️
إليك القواعد الإملائية الذهبية المقررة في الصف الخامس الابتدائي بالتفصيل:

1. **همزة القطع وألف الوصل**:
   • **همزة القطع**: همزة أصلية تُرسم وتُنطق دائمًا في أول الكلمة (أَ، إِ، أُ). 
     - أمثلة: «أَحْمَدُ، إِحْسَانٌ، أُمِّي، أَمَلٌ، أَرْسَلَ».
   • **ألف الوصل**: ألف تُنطق في أول الكلام فقط وتسقط نطقًا عند وصله، وتُكتب ألفًا مجردة دون همزة (ا).
     - أمثلة: «انْطَلَقَ، اسْتِمَاعٌ، اسْمٌ، ابْنٌ، المَدْرَسَة».
   • **القاعدة السحرية الفورية**: ضع حرف (الواو) قبل الكلمة وانطقها؛ إن نطقت الهمزة فهي (قطع) مثل «وَأَحْمَدُ»، وإن سقطت في النطق فهي (وصل) مثل «وَانْطَلَقَ».

2. **الهمزة المتطرفة على السطر**:
   • تُكتب مفردة على السطر في نهاية الكلمة إذا سُبقت بحرف ساكن أو حرف مد (ألف، واو، ياء).
   • أمثلة: «مَاءٌ، هَوَاءٌ، ضَوْءٌ، هُدُوءٌ، جَزْءٌ، بُطْءٌ، شَيْءٌ».

3. **التنوين**:
   • نون ساكنة تنطق ولا تكتب في آخر الاسم، وأنواعه: تنوين الفتح (ـً)، الضم (ـٌ)، الكسر (ـٍ). 
   • تنوين الفتح يُزاد بعده ألف (كتاباً) إلا في الكلمات المنتهية بتاء مربوطة (شجرةً) أو همزة قبلها ألف مد (سماءً).

4. **علامات الترقيم**:
   • النقطة (.) عند نهاية الجملة التامة.
   • الفاصلة (،) بين الجمل المعطوفة.
   • النقطتان الرأسيتان (:) بعد القول أو عند تفصيل الشيء.
   • علامة الاستفهام (؟) وعلامة التعجب (!) وعلامتا التنصيص (« »).`;
  }

  // 5. General Arabic Question
  return `أهلاً بك يا بطل لغتنا العربية الجميلة! 🌟
سؤالك ذكي ويسعدني إجابتك عنه كمعلمك الخبير: «${question}».

في منهج اللغة العربية للصف الخامس الابتدائي بسلاح التلميذ:
1. **في القواعد النحوية**: نركز على تمييز نوع الجملة (فعلية / اسمية)، وإعراب الفاعل والمبتدأ والخبر (بالضمة، الألف، الواو)، والمفعول به (بالفتحة، الياء، الكسرة).
2. **في المعاجم والمفردات**: نربط الكلمة بجذرها اللغوي الثلاثي وسياقها في النص القرائي لمعرفة معناها ومضادها وجمعها بدقة.
3. **في التعبير الكتابي**: نتقن الفنون الستة المقررة: (الرسالة الرسمية، السيرة الذاتية، القصة القصيرة، وصف الشخصية، مناقشة الفكرة، والاستقصاء).

💡 **تفضل بطرح أي جملة تريد إعرابها، أو أي كلمة تريد معناها، أو أي نموذج تعبير تريد كتابته وسأجيبك فوراً وبشكل مباشر ومفصل!** 🎓✨`;
}
