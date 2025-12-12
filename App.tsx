import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { SuggestionsPanel } from './components/SuggestionsPanel';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { useEditor } from './hooks/useEditor';
import { useTheme } from './hooks/useTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Loader2, Sparkles } from 'lucide-react';

// Simple Hash Router Implementation
const getHashId = () => window.location.hash.replace('#/prompt/', '') || null;

export default function App() {
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(getHashId());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileAiOpen, setIsMobileAiOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  const { theme, setTheme } = useTheme();
  
  // Wrap in useCallback to ensure reference stability
  const handleNavigate = useCallback((id: string) => {
    if (id === '/') {
      window.location.hash = '';
      setCurrentPromptId(null);
    } else {
      window.location.hash = `/prompt/${id}`;
      setCurrentPromptId(id);
    }
    // Close mobile panels on nav
    setIsMobileAiOpen(false);
  }, []);

  useEffect(() => {
    const onHashChange = () => setCurrentPromptId(getHashId());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const {
    activePrompt,
    content,
    status,
    aiStatus,
    suggestions,
    handleInput,
    handleUpdateTags,
    handleApplySuggestion,
    handleRestoreVersion,
    handleKeyDown,
    createNewPrompt
  } = useEditor({ 
    initialPromptId: currentPromptId, 
    onNavigate: handleNavigate 
  });

  const wordCount = content ? content.trim().split(/\s+/).length : 0;
  
  useEffect(() => {
    if (status === 'saved') setRefreshTrigger(prev => prev + 1);
  }, [status]);

  // --- Keyboard Shortcuts ---
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlOrMeta: true,
      handler: () => createNewPrompt()
    },
    {
      key: 'h',
      ctrlOrMeta: true,
      handler: () => setIsHistoryOpen(prev => !prev)
    },
    {
      key: '/',
      ctrlOrMeta: true,
      handler: () => setIsMobileAiOpen(prev => !prev) // On desktop this could focus panel, simpler for now
    },
    {
      key: ',',
      ctrlOrMeta: true,
      handler: () => setIsSettingsOpen(true)
    }
  ]);

  // --- Render Loading State ---
  if (currentPromptId && !activePrompt) {
     return (
       <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 items-center justify-center font-sans text-slate-400">
         <div className="flex flex-col items-center gap-4">
           <Loader2 className="animate-spin" size={32} />
           <p className="text-sm font-medium">Loading prompt...</p>
         </div>
       </div>
     );
  }

  // --- Render Landing State ---
  if (!currentPromptId && !activePrompt) {
    return (
      <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <Sidebar 
          currentPromptId={null} 
          onNavigate={handleNavigate} 
          onNew={createNewPrompt}
          onOpenSettings={() => setIsSettingsOpen(true)}
          refreshTrigger={refreshTrigger}
        />
        <div className="flex-1 flex items-center justify-center p-8 ml-0 lg:ml-72 transition-all">
          <div className="max-w-md text-center space-y-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                PromptFlow AI
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                A production-grade environment for crafting better prompts. 
                Features local persistence, real-time AI suggestions, and version control.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-left text-sm text-slate-500 max-w-xs mx-auto mb-6">
                <div className="flex items-center gap-2"><span className="p-1 bg-slate-200 dark:bg-slate-800 rounded">Cmd+N</span> New</div>
                <div className="flex items-center gap-2"><span className="p-1 bg-slate-200 dark:bg-slate-800 rounded">Cmd+H</span> History</div>
            </div>
            <button 
              onClick={createNewPrompt}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
            >
              Create New Prompt
            </button>
          </div>
        </div>
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          setTheme={setTheme}
          onDataChanged={() => setRefreshTrigger(prev => prev + 1)}
        />
      </div>
    );
  }

  // --- Main Editor State ---
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Sidebar 
        currentPromptId={currentPromptId} 
        onNavigate={handleNavigate} 
        onNew={createNewPrompt}
        onOpenSettings={() => setIsSettingsOpen(true)}
        refreshTrigger={refreshTrigger}
      />
      
      <main className="flex-1 flex flex-col ml-0 lg:ml-72 h-full transition-all relative">
        <div className="flex-1 flex overflow-hidden">
          <Editor 
            content={content} 
            onInput={handleInput} 
            status={status}
            wordCount={wordCount}
            onKeyDown={handleKeyDown}
            onOpenHistory={() => setIsHistoryOpen(true)}
            tags={activePrompt?.tags}
            onUpdateTags={handleUpdateTags}
            ghostText={suggestions.continuations[0]} 
          />
          <SuggestionsPanel 
            suggestions={suggestions} 
            status={aiStatus}
            onApply={handleApplySuggestion}
            isOpenMobile={isMobileAiOpen}
            onCloseMobile={() => setIsMobileAiOpen(false)}
          />
        </div>

        {/* Mobile AI Toggle Button (FAB) */}
        <button
          onClick={() => setIsMobileAiOpen(true)}
          className="xl:hidden fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-500/40 flex items-center justify-center z-30 hover:scale-105 transition-transform"
        >
          <Sparkles size={24} />
          {aiStatus === 'thinking' && (
             <span className="absolute top-0 right-0 h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900"></span>
             </span>
          )}
        </button>
      </main>

      <VersionHistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        promptId={activePrompt?.id || ''}
        currentContent={content}
        onRestore={handleRestoreVersion}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        onDataChanged={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  );
}