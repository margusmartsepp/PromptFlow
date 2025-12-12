import React from 'react';
import { AIResponse, AIStatus } from '../types';
import { Sparkles, ArrowRight, Wand2, SpellCheck, X } from 'lucide-react';
import clsx from 'clsx';

interface SuggestionsPanelProps {
  suggestions: AIResponse;
  status: AIStatus;
  onApply: (text: string, type: 'continuation' | 'enhancement') => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ 
  suggestions, 
  status, 
  onApply,
  isOpenMobile,
  onCloseMobile 
}) => {
  const hasContent = suggestions.continuations.length > 0 || suggestions.enhancements.length > 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 xl:hidden" 
          onClick={onCloseMobile}
        />
      )}

      {/* Panel */}
      <div className={clsx(
        "fixed xl:relative inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-transform duration-300 z-50",
        isOpenMobile ? "translate-x-0" : "translate-x-full xl:translate-x-0"
      )}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">AI Assistance</h2>
          </div>
          <div className="flex items-center gap-2">
            {status === 'thinking' && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
            )}
            {/* Mobile Close Button */}
            <button 
              onClick={onCloseMobile}
              className="xl:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Empty State */}
          {!hasContent && status !== 'thinking' && (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Sparkles size={20} />
              </div>
              <p className="text-sm text-slate-500">
                Start typing to receive real-time continuations and enhancements.
              </p>
            </div>
          )}

          {/* Continuations */}
          {suggestions.continuations.length > 0 && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <ArrowRight size={12} />
                Continuations
              </div>
              {suggestions.continuations.map((text, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onApply(text, 'continuation');
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm bg-slate-50 dark:bg-slate-800/50 transition-all group"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    "...{text}"
                  </p>
                  <div className="mt-2 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 font-medium flex items-center gap-1">
                    Click to append <ArrowRight size={10} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Enhancements */}
          {suggestions.enhancements.length > 0 && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Wand2 size={12} />
                Enhancements
              </div>
              {suggestions.enhancements.map((text, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-900/10"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    {text}
                  </p>
                  <button
                    onClick={() => {
                      onApply(text, 'enhancement');
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="mt-3 w-full py-1.5 px-3 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    Replace Content
                  </button>
                </div>
              ))}
            </div>
          )}

           {/* Typos */}
           {suggestions.typos.length > 0 && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <SpellCheck size={12} />
                Fixes
              </div>
              {suggestions.typos.map((typo, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 text-sm"
                >
                  <div>
                    <span className="line-through text-slate-400 decoration-red-400 mr-2">{typo.original}</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">{typo.suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};