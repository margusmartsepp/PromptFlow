import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { SuggestionsPanel } from './components/SuggestionsPanel';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { useEditor } from './hooks/useEditor';
import { useTheme } from './hooks/useTheme';

// Simple Hash Router Implementation
const getHashId = () => window.location.hash.replace('#/prompt/', '') || null;

export default function App() {
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(getHashId());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger sidebar refresh

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
    handleApplySuggestion,
    handleRestoreVersion,
    handleKeyDown,
    createNewPrompt
  } = useEditor({ 
    initialPromptId: currentPromptId, 
    onNavigate: handleNavigate 
  });

  const wordCount = content ? content.trim().split(/\s+/).length : 0;
  // Trigger update when prompt saves to ensure list has latest time
  useEffect(() => {
    if (status === 'saved') setRefreshTrigger(prev => prev + 1);
  }, [status]);

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Sidebar 
        currentPromptId={currentPromptId} 
        onNavigate={handleNavigate} 
        onNew={createNewPrompt}
        onOpenSettings={() => setIsSettingsOpen(true)}
        refreshTrigger={refreshTrigger}
      />
      
      <main className="flex-1 flex flex-col ml-0 lg:ml-72 h-full transition-all">
        <div className="flex-1 flex overflow-hidden">
          <Editor 
            content={content} 
            onInput={handleInput} 
            status={status}
            wordCount={wordCount}
            onKeyDown={handleKeyDown}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
          <SuggestionsPanel 
            suggestions={suggestions} 
            status={aiStatus}
            onApply={handleApplySuggestion}
          />
        </div>
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