import React, { useMemo } from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
  oldText: string;
  newText: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
  const diffs = useMemo(() => Diff.diffWords(oldText, newText), [oldText, newText]);

  return (
    <div className="whitespace-pre-wrap font-sans text-base leading-relaxed break-words">
      {diffs.map((part, index) => {
        // Green for additions, Red/Strikethrough for deletions
        if (part.added) {
          return (
            <span key={index} className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 decoration-clone px-0.5 rounded-sm">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={index} className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 line-through decoration-clone px-0.5 rounded-sm opacity-70">
              {part.value}
            </span>
          );
        }
        return <span key={index} className="text-slate-800 dark:text-slate-200">{part.value}</span>;
      })}
    </div>
  );
};