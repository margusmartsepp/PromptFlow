import React, { useState, useRef, useEffect } from 'react';
import { EditorStatus } from '../types';
import clsx from 'clsx';
import { CheckCircle, Cloud, Loader2, AlertCircle, History, Copy, Download, Check, Tag, Plus, X, Command } from 'lucide-react';

interface EditorProps {
  content: string;
  onInput: (value: string) => void;
  status: EditorStatus;
  wordCount: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onOpenHistory: () => void;
  tags?: string[];
  onUpdateTags?: (tags: string[]) => void;
  ghostText?: string;
}

export const Editor: React.FC<EditorProps> = ({ 
  content, 
  onInput, 
  status, 
  wordCount,
  onKeyDown,
  onOpenHistory,
  tags = [],
  onUpdateTags,
  ghostText
}) => {
  const [copied, setCopied] = useState(false);
  const [isTagInputVisible, setIsTagInputVisible] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and backdrop
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

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

  const handleAddTag = () => {
    if (tagInput.trim() && onUpdateTags) {
      if (!tags.includes(tagInput.trim())) {
        onUpdateTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
      setIsTagInputVisible(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (onUpdateTags) {
      onUpdateTags(tags.filter(t => t !== tagToRemove));
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsTagInputVisible(false);
    }
  };

  // Common font styles to ensure perfect alignment
  const fontStyles = "font-sans text-lg leading-relaxed";

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative">
      {/* Top Bar */}
      <div className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2">
           <button 
             onClick={onOpenHistory}
             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
             title="View Version History (Cmd+H)"
           >
             <History size={14} />
             <span className="hidden sm:inline">History</span>
           </button>
           <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
           <button 
             onClick={handleCopy}
             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
             title="Copy to Clipboard"
           >
             {copied ? <Check size={14} /> : <Copy size={14} />}
             <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
           </button>
           <button 
             onClick={handleDownload}
             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
             title="Download as .txt"
           >
             <Download size={14} />
           </button>

           {/* Tags Section */}
           <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
           <div className="flex items-center gap-2 max-w-[200px] overflow-hidden">
             {tags.map(tag => (
               <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/30 whitespace-nowrap">
                 {tag}
                 <button onClick={() => handleRemoveTag(tag)} className="hover:text-indigo-900 dark:hover:text-indigo-100">
                   <X size={10} />
                 </button>
               </span>
             ))}
             
             {isTagInputVisible ? (
               <div className="relative flex items-center">
                 <input
                   ref={tagInputRef}
                   type="text"
                   value={tagInput}
                   onChange={(e) => setTagInput(e.target.value)}
                   onKeyDown={handleTagInputKeyDown}
                   onBlur={() => {
                       setTimeout(() => {
                           if(tagInput.trim() === '') setIsTagInputVisible(false);
                       }, 200);
                   }}
                   autoFocus
                   placeholder="Tag..."
                   className="w-20 px-2 py-0.5 text-xs border border-indigo-200 dark:border-indigo-700 rounded-md outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                 />
                 <button onMouseDown={handleAddTag} className="absolute right-1 text-indigo-500 hover:text-indigo-700">
                   <Check size={10} />
                 </button>
               </div>
             ) : (
                <button 
                  onClick={() => setIsTagInputVisible(true)}
                  className="p-1 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex-shrink-0"
                  title="Add Tag"
                >
                  <Plus size={14} />
                </button>
             )}
           </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5 transition-colors duration-300">
            {status === 'saving' && (
              <>
                <Loader2 size={14} className="animate-spin text-slate-400" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            )}
            {status === 'saved' && (
              <>
                <CheckCircle size={14} className="text-green-500" />
                <span className="hidden sm:inline text-green-600 dark:text-green-400">Saved</span>
              </>
            )}
            {status === 'error' && (
              <>
                <AlertCircle size={14} className="text-red-500" />
                <span className="hidden sm:inline text-red-500">Error saving</span>
              </>
            )}
            {status === 'typing' && (
               <>
               <Cloud size={14} />
               <span className="hidden sm:inline">Unsaved changes</span>
             </>
            )}
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <div>
            {wordCount} words
          </div>
        </div>
      </div>

      {/* Editor Container with Ghost Text Overlay */}
      <div className="flex-1 relative overflow-hidden">
        <div className="max-w-3xl mx-auto h-full px-8 py-10 relative">
          
          {/* 1. Ghost Text Backdrop (Rendered behind) */}
          <div 
            ref={backdropRef}
            aria-hidden="true"
            className={clsx(
              "absolute inset-0 px-8 py-10 pointer-events-none z-0 whitespace-pre-wrap break-words overflow-auto scrollbar-hide",
              fontStyles
            )}
          >
            {/* Render invisible content to push ghost text to correct position */}
            <span className="text-transparent selection:bg-indigo-200 dark:selection:bg-indigo-900">
              {content}
            </span>
            {/* Render ghost text if available */}
            {ghostText && (
              <span className="text-slate-400 dark:text-slate-500 opacity-60 transition-opacity duration-300">
                {ghostText}
              </span>
            )}
             {/* Extra space at bottom to match textarea behavior */}
             <br /><br /><br />
          </div>

          {/* 2. Actual Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={handleScroll}
            placeholder="Start writing your prompt here..."
            className={clsx(
              "w-full h-full resize-none outline-none bg-transparent relative z-10",
              "text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-700",
              fontStyles
            )}
            spellCheck={false}
          />
          
          {/* Floating 'Tab' hint if ghost text is present */}
          {ghostText && (
            <div className="absolute bottom-6 right-8 pointer-events-none z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-500 dark:text-slate-400 shadow-sm">
                Press <span className="px-1 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 text-xs font-mono text-slate-700 dark:text-slate-200">Tab</span> to accept
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};