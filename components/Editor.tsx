import React, { useState } from 'react';
import { EditorStatus } from '../types';
import clsx from 'clsx';
import { CheckCircle, Cloud, Loader2, AlertCircle, History, Copy, Download, Check } from 'lucide-react';

interface EditorProps {
  content: string;
  onInput: (value: string) => void;
  status: EditorStatus;
  wordCount: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onOpenHistory: () => void;
}

export const Editor: React.FC<EditorProps> = ({ 
  content, 
  onInput, 
  status, 
  wordCount,
  onKeyDown,
  onOpenHistory
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative">
      {/* Top Bar for Status */}
      <div className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
           <button 
             onClick={onOpenHistory}
             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
             title="View Version History"
           >
             <History size={14} />
             <span>History</span>
           </button>
           <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
           <button 
             onClick={handleCopy}
             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
             title="Copy to Clipboard"
           >
             {copied ? <Check size={14} /> : <Copy size={14} />}
             <span>{copied ? 'Copied' : 'Copy'}</span>
           </button>
           <button 
             onClick={handleDownload}
             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
             title="Download as .txt"
           >
             <Download size={14} />
           </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5 transition-colors duration-300">
            {status === 'saving' && (
              <>
                <Loader2 size={14} className="animate-spin text-slate-400" />
                <span>Saving...</span>
              </>
            )}
            {status === 'saved' && (
              <>
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-green-600 dark:text-green-400">Saved</span>
              </>
            )}
            {status === 'error' && (
              <>
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-red-500">Error saving</span>
              </>
            )}
            {status === 'typing' && (
               <>
               <Cloud size={14} />
               <span>Unsaved changes</span>
             </>
            )}
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <div>
            {wordCount} words
          </div>
        </div>
      </div>

      {/* Textarea Container */}
      <div className="flex-1 relative overflow-auto">
        <div className="max-w-3xl mx-auto h-full px-8 py-10">
          <textarea
            value={content}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Start writing your prompt here..."
            className="w-full h-full resize-none outline-none text-lg leading-relaxed text-slate-800 dark:text-slate-200 bg-transparent placeholder-slate-300 dark:placeholder-slate-700 font-sans"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};