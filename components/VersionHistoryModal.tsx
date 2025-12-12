import React, { useEffect, useState } from 'react';
import { PromptVersion } from '../types';
import { getVersions } from '../lib/db';
import { X, Clock, RotateCcw, GitCommit, Split } from 'lucide-react';
import { DiffViewer } from './DiffViewer';
import clsx from 'clsx';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: string;
  currentContent: string;
  onRestore: (version: PromptVersion) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  promptId, 
  currentContent, 
  onRestore 
}) => {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    if (isOpen && promptId) {
      getVersions(promptId).then(setVersions);
    }
  }, [isOpen, promptId]);

  useEffect(() => {
    // Select the most recent version by default if available
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0]);
    }
  }, [versions]);

  // Reset diff toggle when reopening
  useEffect(() => {
    if (isOpen) setShowDiff(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Sidebar: List of Versions */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock size={18} className="text-slate-500" />
              History
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {versions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No history available for this prompt yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {/* Current State Indicator */}
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-transparent">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                    Current Editing
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {currentContent.slice(0, 40) || '(Empty)'}...
                  </div>
                </div>

                {versions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVersion(v)}
                    className={clsx(
                      "w-full text-left p-4 transition-all duration-200",
                      selectedVersion?.id === v.id 
                        ? "bg-white dark:bg-slate-800 border-l-4 border-indigo-500 shadow-sm" 
                        : "border-l-4 border-transparent hover:bg-white dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-mono text-slate-400">
                        {formatDate(v.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      {v.changeDescription || 'Auto-save'}
                    </p>
                    <p className="text-xs text-slate-500 truncate font-mono opacity-70">
                      {v.content.slice(0, 30)}...
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Area: Preview */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 min-w-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-sm text-slate-500">
                <GitCommit size={16} />
                <span className="hidden sm:inline">Selected Version Preview</span>
              </div>
              
              {selectedVersion && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                    <button 
                      onClick={() => setShowDiff(false)}
                      className={clsx(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                        !showDiff ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      View
                    </button>
                    <button 
                      onClick={() => setShowDiff(true)}
                      className={clsx(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                        showDiff ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      <Split size={12} />
                      Compare with Current
                    </button>
                </div>
              )}
            </div>

            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-8 bg-slate-50/50 dark:bg-slate-950">
            {selectedVersion ? (
              showDiff ? (
                <div className="animate-in fade-in duration-200">
                   <div className="mb-4 text-xs text-slate-400 flex items-center gap-4">
                      <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-200 rounded-full"></div>Removed from current</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-200 rounded-full"></div>Added from version</span>
                   </div>
                   <DiffViewer oldText={currentContent} newText={selectedVersion.content} />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-base text-slate-800 dark:text-slate-200 leading-relaxed max-w-none animate-in fade-in duration-200">
                  {selectedVersion.content}
                </pre>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Select a version from the history sidebar
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 z-10">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={!selectedVersion}
              onClick={() => {
                if (selectedVersion) {
                  onRestore(selectedVersion);
                  onClose();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={16} />
              Restore this Version
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};