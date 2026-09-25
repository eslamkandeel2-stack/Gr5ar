import React, { useMemo } from 'react';
import { VocabItem } from '../types.ts';
import { tokenizeAndMatchVocab } from '../utils/arabicTextMatcher.ts';
import { Sparkles } from 'lucide-react';

interface InteractiveTextReaderProps {
  text: string;
  vocabulary: VocabItem[];
  onWordClick: (item: VocabItem) => void;
  className?: string;
}

export const InteractiveTextReader: React.FC<InteractiveTextReaderProps> = ({
  text,
  vocabulary,
  onWordClick,
  className = '',
}) => {
  const tokens = useMemo(() => {
    return tokenizeAndMatchVocab(text, vocabulary);
  }, [text, vocabulary]);

  return (
    <span className={className}>
      {tokens.map((token, idx) => {
        if (token.isVocab && token.vocabItem) {
          const item = token.vocabItem;
          return (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onWordClick(item);
              }}
              title={`اضغط لعرض المعنى: ${item.meaning}`}
              className="inline-flex items-baseline cursor-pointer font-bold text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200 hover:text-emerald-950 border-b-2 border-emerald-500/80 border-dashed px-1 py-0.5 rounded mx-0.5 transition-all shadow-2xs group relative"
            >
              <span>{token.text}</span>
              <span className="text-[10px] text-emerald-600 font-sans mr-0.5 opacity-60 group-hover:opacity-100">
                📖
              </span>
            </span>
          );
        }
        return <span key={idx}>{token.text}</span>;
      })}
    </span>
  );
};
