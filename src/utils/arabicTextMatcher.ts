import { VocabItem } from '../types.ts';

/**
 * Normalizes Arabic text by stripping diacritics (tashkeel), tatweel, 
 * unifying alef, yaa, and taa marbuta, and removing punctuation.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove tashkeel & tatweel
    .replace(/[إأآاٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\.,،؛:\(\)«»"'\?!؟]/g, '')
    .trim();
}

/**
 * Strips common Arabic grammatical prefixes (الـ، و، فـ، بـ، كـ، لـ)
 * to find the base stem.
 */
export function stripArabicPrefixes(normWord: string): string {
  let w = normWord;
  // Strip initial 'و' or 'ف'
  if ((w.startsWith('و') || w.startsWith('ف')) && w.length > 3) {
    w = w.slice(1);
  }
  // Strip preposition 'ب' or 'ك' or 'ل' before 'ال'
  if ((w.startsWith('بال') || w.startsWith('كال') || w.startsWith('فال') || w.startsWith('وال')) && w.length > 4) {
    w = w.slice(1);
  }
  // Strip 'لل' (ل + ال)
  if (w.startsWith('لل') && w.length > 3) {
    w = 'ال' + w.slice(2);
  }
  return w;
}

export interface TextToken {
  text: string;
  isVocab: boolean;
  vocabItem?: VocabItem;
}

/**
 * Matches words in a sentence or paragraph against a vocabulary list,
 * supporting multi-word phrases and common prefixes/suffixes.
 */
export function tokenizeAndMatchVocab(
  paragraph: string,
  vocabulary: VocabItem[]
): TextToken[] {
  if (!paragraph || !vocabulary || vocabulary.length === 0) {
    return [{ text: paragraph, isVocab: false }];
  }

  // Pre-normalize all vocab items and sort by length descending to match multi-words first
  const normalizedVocabList = vocabulary
    .map((v) => {
      const norm = normalizeArabic(v.word);
      const stem = stripArabicPrefixes(norm);
      const withoutAl = norm.startsWith('ال') ? norm.slice(2) : norm;
      return {
        item: v,
        norm,
        stem,
        withoutAl,
        isMultiWord: norm.includes(' '),
      };
    })
    .sort((a, b) => b.norm.length - a.norm.length);

  // Split paragraph by words and spaces/punctuation preserving delimiters
  // Using regex capturing group to keep spaces and punctuation intact
  const tokens = paragraph.split(/(\s+|[،؛\.\:\(\)«»"'\?!؟]+)/);
  const result: TextToken[] = [];

  let i = 0;
  while (i < tokens.length) {
    const raw = tokens[i];
    if (!raw) {
      i++;
      continue;
    }

    // If whitespace or punctuation, just add as plain token
    if (/^(\s+|[،؛\.\:\(\)«»"'\?!؟]+)$/.test(raw)) {
      result.push({ text: raw, isVocab: false });
      i++;
      continue;
    }

    // Try multi-word match (check if raw + next space + next word matches a multi-word vocab)
    let matchedVocab: VocabItem | undefined;
    let tokensConsumed = 1;

    // Check multi-word (e.g. 2 words)
    if (i + 2 < tokens.length && /^\s+$/.test(tokens[i + 1])) {
      const twoWordsRaw = raw + tokens[i + 1] + tokens[i + 2];
      const twoWordsNorm = normalizeArabic(twoWordsRaw);

      const multiMatch = normalizedVocabList.find(
        (v) => v.isMultiWord && (v.norm === twoWordsNorm || twoWordsNorm.includes(v.norm))
      );

      if (multiMatch) {
        matchedVocab = multiMatch.item;
        tokensConsumed = 3;
        result.push({
          text: twoWordsRaw,
          isVocab: true,
          vocabItem: matchedVocab,
        });
        i += tokensConsumed;
        continue;
      }
    }

    // Single-word match
    const normToken = normalizeArabic(raw);
    const stemToken = stripArabicPrefixes(normToken);
    const withoutAlToken = normToken.startsWith('ال') ? normToken.slice(2) : normToken;
    const withoutAlStem = stemToken.startsWith('ال') ? stemToken.slice(2) : stemToken;

    const singleMatch = normalizedVocabList.find((v) => {
      if (v.isMultiWord) return false;
      return (
        v.norm === normToken ||
        v.stem === stemToken ||
        v.norm === stemToken ||
        v.stem === normToken ||
        v.withoutAl === withoutAlToken ||
        v.withoutAl === withoutAlStem ||
        normToken.endsWith(v.norm) ||
        (v.withoutAl.length > 3 && withoutAlToken.startsWith(v.withoutAl)) ||
        (v.withoutAl.length > 3 && withoutAlStem.startsWith(v.withoutAl))
      );
    });

    if (singleMatch) {
      result.push({
        text: raw,
        isVocab: true,
        vocabItem: singleMatch.item,
      });
    } else {
      result.push({
        text: raw,
        isVocab: false,
      });
    }

    i++;
  }

  return result;
}
