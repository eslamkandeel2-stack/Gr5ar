import React from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  User, 
  Loader2, 
  Volume2, 
  Lightbulb,
  BookOpen,
  PenTool,
  ShieldAlert,
  GraduationCap,
  Copy,
  Check,
  FileText,
  Bookmark
} from 'lucide-react';
import { Lesson } from '../types.ts';
import { audioService } from '../utils/audioPlayer.ts';
import { aiUsageService } from '../utils/aiUsageService.ts';
import { answerArabicTutorDirectly } from '../utils/arabicPedagogyEngine.ts';
import { AiUsageBar } from './AiUsageBar.tsx';
import { AiUsageModal } from './AiUsageModal.tsx';

interface AiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLesson: Lesson;
  voice: string;
}

interface Message {
  role: 'assistant' | 'user';
  text: string;
  isFiltered?: boolean;
}

type CategoryTab = 'all' | 'comprehension' | 'vocabulary' | 'grammar' | 'writing';

// Client-side guardrail check to prevent non-Arabic & non-educational queries
function isNonArabicOrOutOfScope(question: string): { isOutOfScope: boolean; reason?: string } {
  const q = (question || "").trim().toLowerCase();

  // Gaming
  const gameKeywords = [
    "ماينكرافت", "minecraft", "ببجي", "pubg", "فورتنايت", "fortnite", "روبلوكس", "roblox",
    "بلايستيشن", "playstation", "اكس بوكس", "xbox", "gta", "فيفا", "fifa", "العاب فيديو",
    "تهكير", "شفرات", "شدات", "free fire", "فري فاير", "لعبه حرب", "لعبة حرب"
  ];
  if (gameKeywords.some(kw => q.includes(kw))) {
    return { isOutOfScope: true, reason: "games" };
  }

  // Coding & Tech unrelated to Arabic
  const codeKeywords = [
    "python", "بايثون", "javascript", "جافاسكريبت", "html", "css", "c++", "كود برمجي", 
    "برمجة", "هاكر", "sql", "react", "node.js"
  ];
  if (codeKeywords.some(kw => q.includes(kw))) {
    return { isOutOfScope: true, reason: "coding" };
  }

  // Sports gossip, pop culture
  const popKeywords = [
    "ميسي", "رونالدو", "هالاند", "نادي الهلال", "نادي النصر", "مباراة اليوم",
    "دوري ابطال", "فيلم رعب", "نتفلكس", "netflix", "اغاني راب", "هوليوود", "مسلسل تركي"
  ];
  if (popKeywords.some(kw => q.includes(kw))) {
    return { isOutOfScope: true, reason: "sports_pop" };
  }

  // Pure math calculation or foreign languages
  if (/^[0-9+\-*/=^() ]{4,}$/.test(q)) {
    return { isOutOfScope: true, reason: "pure_math" };
  }
  const foreignLang = ["english grammar", "translate to french", "ترجم للانجليزي", "ترجم للفرنسي"];
  if (foreignLang.some(kw => q.includes(kw))) {
    return { isOutOfScope: true, reason: "foreign_language" };
  }

  // Crypto, Politics
  const otherUnrelated = ["بيتكوين", "bitcoin", "سعر الدولار اليوم", "بورصة", "اسلحة", "سياسة"];
  if (otherUnrelated.some(kw => q.includes(kw))) {
    return { isOutOfScope: true, reason: "unrelated" };
  }

  return { isOutOfScope: false };
}

const OUT_OF_SCOPE_REFUSAL = `عذرًا يا بطل! أنا «مُعَلِّمُ لُغَتِي الذَّكِيُّ»، ومهمتي التربوية مخصصة حصريًا لمادة اللغة العربية وقواعدها النحوية والإملائية وبلاغتها ومعاجمها الأدبية وشرح دروس منهج «سلاح التلميذ». 🌟

يرجى توجيه سؤالك حول لغتنا العربية الجميلة، مثل:
• **أسئلة وفهم المنهج**: استخراج الفكر، الدروس المستفادة، ومظاهر الجمال من دروس القراءة والأناشيد.
• **المعاجم والمفردات**: معاني الكلمات، والمضاد، والمفرد، والجمع، والجذر اللغوي، وخريطة الكلمة.
• **القواعد النحوية والإعراب**: إعراب الفاعل، المفعول به، المبتدأ والخبر، وعلامات الإعراب الأصلية والفرعية.
• **كتابة نماذج التعبير المقررة**: كتابة رسالة رسمية، سيرة ذاتية، قصة قصيرة، استقصاء، وصف شخصية، أو مناقشة فكرة.

أنا بانتظار سؤالك اللغوي المفيد لنتعلم معًا ونتميز! 📖✨`;

function getInstantTutorGuidance(question: string, lesson: Lesson): string {
  const q = question.toLowerCase().trim();

  // 1. Guardrail for out of scope
  if (isNonArabicOrOutOfScope(q).isOutOfScope) {
    return OUT_OF_SCOPE_REFUSAL;
  }

  // Direct pedagogical answer
  return answerArabicTutorDirectly(question, {
    lessonTitle: lesson.title,
    vocabulary: lesson.vocabulary,
    grammarLessons: lesson.grammarLessons,
    readingText: lesson.readingText,
  });
}

function _legacyGuidance(question: string, lesson: Lesson): string {
  const q = question.toLowerCase().trim();
  // 2. Writing Models (كتابة نماذج التعبير المقرر بالمنهج)
  if (q.includes("رسالة") || (q.includes("تعبير") && q.includes("رسمي")) || (q.includes("اكتب") && q.includes("رسالة"))) {
    return `أهلاً بك يا كاتب المستقبل المبدع! ✍️✨
إليك النموذج التطبيقي المعتمد لـ **«كتابة الرسالة الرسمية»** المقررة بالصف الخامس:

### أولاً: العناصر المنهجية الستة:
1. **المرسل إليه**: السيد الفاضل / مدير المدرسة المحترم.
2. **التحية الرسمية**: تحية طيبة، وبعد..
3. **سبب الرسالة**: طلب الموافقة على نشاط بيئي أو توعوي.
4. **الموضوع والعرض**: شرح المقترحات والفوائد المتوقعة.
5. **الخاتمة وعبارة الشكر**: رجاء القبول وفائق الاحترام.
6. **التوقيع والتاريخ**: اسم التلميذ وتاريخ الإرسال.

---

### ثانياً: النموذج التطبيقي:
السَّيِّدُ الفَاضِلُ / مُدِيرُ مَدْرَسَةِ النِّيلِ الِابْتِدَائِيَّةِ المُحْتَرَمُ.
تَحِيَّةٌ طَيِّبَةٌ، وَبَعْدُ..

فَإِنِّي أَرْفَعُ إِلَى سِيَادَتِكُمْ هَذِهِ الرِّسَالَةَ؛ لِطَلَبِ المُوافَقَةِ الكَرِيمَةِ عَلَى إِطْلَاقِ حَمْلَةٍ تَوْعَوِيَّةٍ بِالمَدْرَسَةِ بِعُنْوَانِ: «قَطْرَةُ مَاءٍ تُسَاوِي حَيَاةً» خِلَالَ الأُسْبُوعِ القَادِمِ.
تَتَضَمَّنُ الحَمْلَةُ تَقْدِيمَ إِذَاعَةٍ مَدْرَسِيَّةٍ صَبَاحِيَّةٍ، وَتَعْلِيقَ لَافِتَاتٍ إِرْشَادِيَّةٍ، وَإِقَامَةَ مَسْرَحِيَّةٍ قَصِيرَةٍ تُوَضِّحُ دَوْرَ كُلِّ تِلْمِيذٍ فِي تَرْشِيدِ المِيَاهِ وَحِمَايَةِ نَهْرِ النِّيلِ.
نَرْجُو مِنْ سِيَادَتِكُمْ قَبُولَ طَلَبِنَا، وَتَفَضَّلُوا بِقَبُولِ فَائِقِ التَّقْدِيرِ وَالاحْتِرَامِ.

مُمَثِّلُ أُسْرَةِ التَّرْبِيَةِ البِيئِيَّةِ: الطَّالِبُ / عُمَر مَحْمُود
تَارِيخُ الإِرْسَالِ: ١٠ أُكْتُوبَر ٢٠٢٦م

💡 **نصيحة ذهبية**: استخدم صيغة الجمع للاحترام («سيادتكم»، «نرجو»)، ولا تنسَ وضع النقطتين بعد التحية والنقطة في نهاية كل فقرة!`;
  }

  if (q.includes("سيرة") || (q.includes("اكتب") && q.includes("سيرة"))) {
    return `مرحبًا بك يا بطل! 🌟
إليك نموذجًا متكاملًا لـ **«كتابة السيرة الذاتية»** المقررة بالصف الخامس:

### العناصر المنهجية الأربعة:
1. **من أنا؟**: (الاسم، الميلاد، الأسرة).
2. **رحلتي الدراسية**: (المدرسة، المواد المحببة، الهوايات).
3. **يوم لا يُنسى**: (موقف صعب وتغلب عليه، أو نجاح وتفوق).
4. **حلمي للمستقبل**: (المهنة وخدمة الوطن).

---

### النموذج التطبيقي:
**«حُلْمِي يَبْدَأُ مِنْ هُنَا»**
أَنَا سَيْفُ الدِّينِ، وُلِدْتُ فِي القَاهِرَةِ عَامَ ٢٠١٥م، وَنَشَأْتُ فِي أُسْرَةٍ مُحِبَّةٍ لِلْعِلْمِ تُشَجِّعُنِي دَائِمًا عَلَى القِرَاءَةِ.
الْتَحَقْتُ بِمَدْرَسَةِ النَّهْضَةِ الِابْتِدَائِيَّةِ، وَأَنَا الآنَ فِي الصَّفِّ الخَامِسِ. مَادَّتِي المُفَضَّلَةُ هِيَ اللُّغَةُ العَرَبِيَّةُ، وَأَهْوَى قِرَاءَةَ القِصَصِ وَالشَّطْرَنْجِ.
مِنَ المَوَاقِفِ الَّتِي لَا أَنْسَاهَا يَوْمَ اشْتَرَكْتُ فِي مُسَابَقَةِ الإِلْقَاءِ الشِّعْرِيِّ؛ شَعَرْتُ بِالخَوْفِ فِي البِدَايَةِ، وَلَكِنَّ تَشْجِيعَ مُعَلِّمِي مَنَحَنِي الشَّجَاعَةَ فَأَلْقَيْتُ النَّشِيدَ وَفُزْتُ بِالمَرْكَزِ الأَوَّلِ.
حُلْمِي فِي المُسْتَقْبَلِ أَنْ أُصْبِحَ طَبِيبًا بَارِعًا أُعَالِجُ المَرْضَى وَأَرْفَعَ اسْمَ وَطَنِي مِصْرَ عَالِيًا.

💡 **نصيحة ذهبية**: اكتب بضمير المتكلم دائمًا (أنا، التحقتُ، حلمي) ورتّب الأحداث زمنياً بدقة!`;
  }

  // 3. Priority check from system lesson vocabulary
  if (lesson.vocabulary && lesson.vocabulary.length > 0) {
    const matched = lesson.vocabulary.find(v => q.includes(v.word.toLowerCase()));
    if (matched) {
      return `أهلاً بك يا باحث المعجم الذكي! 📖
بناءً على جدول مفردات درسك **«${lesson.title}»** في منصة سلاح التلميذ:

• **الكلمة**: «${matched.word}»
• **المعنى / المرادف**: ${matched.meaning}
${matched.opposite ? `• **المضاد**: ${matched.opposite}\n` : ''}${matched.plural ? `• **الجمع**: ${matched.plural}\n` : ''}${matched.singular ? `• **المفرد**: ${matched.singular}\n` : ''}${matched.contextSentence ? `• **في جملة سياقية من النص**: «${matched.contextSentence}»\n` : ''}
• **خريطة الكلمة**:
  - النوع: اسم / فعل
  - المعنى: ${matched.meaning}
  - المضاد: ${matched.opposite || "غير متاح"}
  - الجملة: «${matched.contextSentence || matched.word}»

💡 **فائدة معجمية**: سياق الجملة في النص القرائي هو الذي يحدد المعنى بدقة. يمكنك مراجعة جدول المفردات بالكامل في تبويب «المفردات والمعجم»! ✨`;
    }
  }

  // 4. Grammar & I'rab
  if (q.includes("إعراب") || q.includes("أعرب") || q.includes("مفعول") || q.includes("فاعل") || q.includes("مبتدأ") || q.includes("خبر") || q.includes("علامة") || q.includes("نحو")) {
    return `أهلاً بك يا بطل النحو والإعراب! 🌟
إليك خلاصة القواعد النحوية المعتمدة للصف الخامس الابتدائي بسلاح التلميذ:

1. **أركان الجملة الفعلية**:
   • **الفعل**: يدل على حدث وقع في زمن معين (ماضٍ، مضارع، أمر).
   • **الفاعل**: اسم مرفوع دائمًا يدل على من قام بالفعل (علامات رفعه: **الضمة** للمفرد وجمع التكسير والمؤنث السالم، **الألف** للمثنى، **الواو** لجمع المذكر السالم).
   • **المفعول به**: اسم منصوب يدل على من وقع عليه فعل الفاعل (علامات نصبه: **الفتحة** للمفرد وجمع التكسير، **الياء** للمثنى وجمع المذكر السالم، **الكسرة** لجمع المؤنث السالم نيابة عن الفتحة).

2. **الجملة الاسمية**: تتكون من **المبتدأ** و**الخبر**، وكلاهما مرفوع دائمًا (الضمة، الألف، الواو).

💡 **السر الذهبي للإعراب**:
• اسأل: «**مَن** فعل؟» ⬅️ الجواب هو **الفاعل**.
• اسأل: «**ماذا** فعل؟» ⬅️ الجواب هو **المفعول به**.
راجع تبويب «القواعد النحوية» في درس «${lesson.title}» للاطلاع على الشرح والتدريبات!`;
  }

  // 5. Lexicon and Vocab general
  if (q.includes("معنى") || q.includes("مفرد") || q.includes("مرادف") || q.includes("مضاد") || q.includes("جمع") || q.includes("كلمة") || q.includes("معجم") || q.includes("جذر")) {
    return `أهلاً بك يا باحث المعرفة والمعجم! 📖
في درسك **«${lesson.title}»**:
• تفضل بزيارة تبويب **«المفردات والمعجم»**؛ حيث تجد جدولاً كاملاً لجميع الكلمات مع معانيها ومضادها ومفردها وجمعها المشتق من كتاب سلاح التلميذ.
• يمكنك كتابة أي كلمة ترغب في معرفة معناها وجذرها اللغوي الثلاثي وسأفصلها لك خطوة بخطوة! ✨`;
  }

  // 6. Poetry & Rhetoric
  if (q.includes("شعر") || q.includes("نشيد") || q.includes("بيت") || q.includes("جمال") || q.includes("مجاز") || q.includes("حقيقي")) {
    return `مرحبًا بك يا فنان التذوق البلاغي! 🎨
في التذوق الأدبي للصف الخامس:
• **التعبير الحقيقي**: هو استخدام الألفاظ في معناها الواقعي (مثل: «الشمس تشرق صباحًا»).
• **التعبير المجازي**: هو استخدام الألفاظ في غير معناها الحقيقي لإضفاء جمال وخيال (مثل: «الشمس تبتسم للكون»، شبّه الشمس بإنسان يبتسم).
${lesson.type === 'poetry' ? `في أبيات نشيد «${lesson.title}»، تأمل كيف وظّف الشاعر الكلمات ليعبر عن مشاعره الصادقة!` : ''}`;
  }

  return `أهلاً بك يا بطل! سؤالك رائع ومهم: «${question}».
في درس «${lesson.title}»، نوصيك دائمًا بالجمع بين القراءة المتأنية وفهم معاني المفردات وتطبيق القواعد النحوية والإملائية والتعبير الكتابي.
تفضل بسؤالي عن أي إعراب أو معنى أو قاعدة أو اطلب كتابة أي نموذج تعبير مقرر بالمنهج وسأشرحها لك كمعلمك الخبير! 🎓✨`;
}

export const AiTutorModal: React.FC<AiTutorModalProps> = ({
  isOpen,
  onClose,
  currentLesson,
  voice,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryTab>('all');
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      text: `مرحبًا بك يا بطل! أنا «مُعَلِّمُ لُغَتِي الذَّكِيُّ»، معلمك الخبير المعتمد في مادة اللغة العربية وقواعدها وبلاغتها ومنهج سلاح التلميذ. 🌟

يسعدني أن أجيبك عن:
• **جميع أسئلة المنهج والفهم القرائي** لدرس **«${currentLesson.title}»**.
• **معاني المفردات والمضاد والجموع والجذور اللغوية**.
• **القواعد النحوية والإعراب التفصيلي الكامل خطوة بخطوة**.
• **كتابة نماذج التعبير المقررة بالمنهج** (رسالة رسمية، سيرة ذاتية، استقصاء، قصة قصيرة، وصف شخصية، مناقشة فكرة).

تفضل باختيار قسم من الأقسام أدناه أو اطرح سؤالك مباشرة!`
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Update initial message when lesson changes
  React.useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: `مرحبًا بك يا بطل! أنا «مُعَلِّمُ لُغَتِي الذَّكِيُّ»، معلمك الخبير المعتمد في مادة اللغة العربية وقواعدها وبلاغتها ومنهج سلاح التلميذ. 🌟

يسعدني أن أجيبك عن:
• **جميع أسئلة المنهج والفهم القرائي** لدرس **«${currentLesson.title}»**.
• **معاني المفردات والمضاد والجموع والجذور اللغوية**.
• **القواعد النحوية والإعراب التفصيلي الكامل خطوة بخطوة**.
• **كتابة نماذج التعبير المقررة بالمنهج** (رسالة رسمية، سيرة ذاتية، استقصاء، قصة قصيرة، وصف شخصية، مناقشة فكرة).

تفضل باختيار قسم من الأقسام أدناه أو اطرح سؤالك مباشرة!`
      }
    ]);
  }, [currentLesson.id]);

  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (userQuestion?: string) => {
    const textToSend = userQuestion || input;
    if (!textToSend.trim() || isLoading) return;

    const trimmedText = textToSend.trim();
    const newMessages: Message[] = [...messages, { role: 'user', text: trimmedText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Client-side quick filter check
    const scopeCheck = isNonArabicOrOutOfScope(trimmedText);
    if (scopeCheck.isOutOfScope) {
      setTimeout(() => {
        setMessages([...newMessages, { role: 'assistant', text: OUT_OF_SCOPE_REFUSAL, isFiltered: true }]);
        setIsLoading(false);
      }, 350);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          question: trimmedText,
          lessonTitle: currentLesson.title,
          lessonType: currentLesson.type,
          readingText: currentLesson.readingText,
          vocabulary: currentLesson.vocabulary,
          grammarLessons: currentLesson.grammarLessons,
          discussionPoints: currentLesson.discussionPoints,
          writingTopic: currentLesson.writingTopic,
          lessonContext: `الدرس الحالي: ${currentLesson.title} (${currentLesson.type}). محتوى الدرس: ${currentLesson.readingText.slice(0, 1500)}`
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      const data = await response.json().catch(() => null);
      if (data?.usage) {
        aiUsageService.updateFromServerPayload(data.usage);
      } else {
        aiUsageService.recordUsage('tutor');
      }
      const replyText = data?.reply || data?.answer || data?.text;

      if (replyText) {
        setMessages([...newMessages, { role: 'assistant', text: replyText, isFiltered: data?.filtered }]);
      } else {
        const guidance = getInstantTutorGuidance(trimmedText, currentLesson);
        setMessages([...newMessages, { role: 'assistant', text: guidance }]);
      }
    } catch {
      // In case of network timeout or disconnection, provide instant curriculum guidance
      const guidance = getInstantTutorGuidance(trimmedText, currentLesson);
      setMessages([...newMessages, { role: 'assistant', text: guidance }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakReply = (text: string) => {
    audioService.speakWord(text, { 
      voice,
      word: 'ai_tutor_reply'
    });
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  // The 4 Core Curriculum Domains for Quick Questions
  const questionsByCategory: Record<CategoryTab, string[]> = {
    all: [
      'ما الفكرة الرئيسة لهذا الدرس وأهم أسئلته؟',
      'استخرج أهم مفردات الدرس مع معانيها ومضادها',
      'أعرب الجملة: كافأ المعلم التلميذين المجتهدين',
      'اكتب لي نموذج رسالة رسمية لمدير المدرسة',
      'اكتب لي سيرة ذاتية لتلميذ في الصف الخامس'
    ],
    comprehension: [
      'لخص لي الفكرة الرئيسة وأحداث هذا الدرس في نقاط موجزة',
      'ما هي الدروس المستفادة والرسالة التي يوجهها النص؟',
      currentLesson.type === 'poetry' 
        ? 'ما الفرق بين التعبير الحقيقي والمجازي في أبيات هذا النشيد؟'
        : 'أهم 3 أسئلة فهم ومناقشة حول هذا الدرس مع إجاباتها النموذجية',
      'استخرج أهم الأساليب ومظاهر الجمال الواردة في النص'
    ],
    vocabulary: [
      'استخرج جميع مفردات درس اليوم مع معانيها ومضادها وجمعها',
      'اعمل لي خريطة كلمة وشبكة مفردات لإحدى كلمات الدرس',
      'ما هو الجذر اللغوي وعائلة الكلمة وكيف أستخرجهما؟',
      'ما معنى ومرادف ومضاد ومفرد أهم كلمات الدرس؟'
    ],
    grammar: [
      'أعرب الجملة بالتفصيل: كافأ المعلم التلميذين المجتهدين',
      'ما هي علامات رفع المبتدأ والخبر والفاعل بالتفصيل مع الأمثلة؟',
      'ما هي علامات نصب المفعول به ومتى يُنصب بالكسرة أو الياء؟',
      'كيف أفرّق بين همزة القطع وألف الوصل بسهولة وبطريقة سحرية؟',
      'ما هي أنواع شبه الجملة وكيف أعرب الاسم المجرور والظرف؟'
    ],
    writing: [
      'اكتب لي نموذج رسالة رسمية لمدير المدرسة لطلب تنظيم نشاط مدرسي',
      'اكتب لي نموذج سيرة ذاتية لتلميذ في الصف الخامس الابتدائي',
      'اكتب لي نموذج قصة قصيرة عن الأمانة والتعاون مستوفية العناصر',
      'اكتب لي نموذج وصف شخصية (المعلم المخلص أو الأب القدير)',
      'اكتب لي نموذج مناقشة فكرة (مميزات وعيوب استخدام الهاتف المحمول)',
      'اكتب لي نموذج استقصاء لجمع آراء التلاميذ حول مكتبة المدرسة'
    ]
  };

  const activeQuickQuestions = questionsByCategory[selectedCategory] || questionsByCategory.all;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-emerald-700 via-teal-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg">مُعَلِّمُ لُغَتِي الذَّكِيُّ</h3>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black shadow-xs">
                  معلم خبير معتمد
                </span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  سلاح التلميذ
                </span>
              </div>
              <p className="text-xs text-emerald-100 truncate mt-0.5">
                المرجع الشامل لأسئلة المنهج، المفردات، القواعد النحوية، ونماذج التعبير لدرس: <strong className="text-white">{currentLesson.title}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Consumption Bar & Renewal Countdown */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-200">
          <AiUsageBar variant="compact" onOpenDetails={() => setIsUsageModalOpen(true)} />
        </div>

        {/* 4 Core Pillars Tabs */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>الكل</span>
          </button>

          <button
            onClick={() => setSelectedCategory('comprehension')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'comprehension'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>أسئلة وفهم الدرس</span>
          </button>

          <button
            onClick={() => setSelectedCategory('vocabulary')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'vocabulary'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>معاني المفردات والمعجم</span>
          </button>

          <button
            onClick={() => setSelectedCategory('grammar')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'grammar'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>القواعد النحوية والإعراب</span>
          </button>

          <button
            onClick={() => setSelectedCategory('writing')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'writing'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>نماذج التعبير المقرر</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : msg.isFiltered
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : msg.isFiltered ? (
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                )}
              </div>

              <div
                className={`max-w-[88%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white font-medium rounded-tl-xs'
                    : msg.isFiltered
                    ? 'bg-amber-50/90 text-slate-800 border border-amber-200 rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tr-xs'
                }`}
              >
                <div className="font-['Amiri',serif] text-sm sm:text-base whitespace-pre-wrap leading-loose">
                  {msg.text}
                </div>
                {msg.role === 'assistant' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <Sparkles className="w-3 h-3" />
                      إجابة تربوية معتمدة
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyText(msg.text, i)}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-700 p-1 px-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="نسخ الإجابة"
                      >
                        {copiedIndex === i ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSpeakReply(msg.text)}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-700 p-1 px-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="استمع للإجابة بصوت فصيح"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>استماع</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-slate-600 text-xs bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span className="font-bold">المعلم الخبير يبحث في المنهج ويصيغ الإجابة النموذجية الفصيحة...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto flex items-center gap-2 scrollbar-none min-w-0">
          <span className="text-[11px] font-black text-emerald-900 shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            اقتراحات:
          </span>
          {activeQuickQuestions.map((q, qIdx) => (
            <button
              key={qIdx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-[11px] bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-200 hover:border-emerald-300 shrink-0 font-bold cursor-pointer active:scale-95 shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="اسأل المعلم الخبير عن أي إعراب، معنى، سؤال بالمنهج، أو اطلب كتابة نموذج تعبير..."
            disabled={isLoading}
            className="min-w-0 flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className={`shrink-0 p-2.5 sm:px-4 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              input.trim() && !isLoading
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            aria-label="إرسال"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-black">إرسال</span>
          </button>
        </div>
      </div>

      <AiUsageModal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
      />
    </div>
  );
};
