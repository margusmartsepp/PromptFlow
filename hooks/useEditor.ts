import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Subject, from, of, merge } from 'rxjs';
import { debounceTime, switchMap, tap, map, catchError, filter, distinctUntilChanged } from 'rxjs/operators';
import { getSuggestions } from '../lib/ai';
import { updatePrompt, createPrompt, getPrompt, saveVersion } from '../lib/db';
import { Prompt, AIResponse, EditorStatus, AIStatus, PromptVersion } from '../types';

interface UseEditorProps {
  initialPromptId?: string | null;
  onNavigate: (id: string) => void;
}

export const useEditor = ({ initialPromptId, onNavigate }: UseEditorProps) => {
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [content, setContent] = useState<string>('');
  const [status, setStatus] = useState<EditorStatus>('idle');
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
  const [suggestions, setSuggestions] = useState<AIResponse>({ continuations: [], enhancements: [], typos: [] });

  // RxJS Subjects
  const input$ = useRef(new Subject<string>());
  
  // Ref for activePrompt ID to avoid strict dependency in useEffect
  const activePromptIdRef = useRef<string | null>(null);
  useEffect(() => {
    activePromptIdRef.current = activePrompt?.id || null;
  }, [activePrompt]);

  // Load Prompt
  useEffect(() => {
    const load = async () => {
      if (!initialPromptId) {
        return;
      }
      const p = await getPrompt(initialPromptId);
      if (p) {
        setActivePrompt(p);
        setContent(p.content);
        setStatus('saved');
        setSuggestions({ continuations: [], enhancements: [], typos: [] });
      } else {
        onNavigate('/');
      }
    };
    load();
  }, [initialPromptId, onNavigate]);

  // Setup Streams
  useEffect(() => {
    const textStream = input$.current;
    
    // 1. Auto-save Stream (2000ms debounce)
    const saveSubscription = textStream.pipe(
      tap(() => setStatus('typing')),
      debounceTime(2000),
      filter(() => !!activePromptIdRef.current),
      tap(() => setStatus('saving')),
      switchMap(text => {
        const id = activePromptIdRef.current;
        if (!id) return of(null);
        // Map result back to text so next tap has it
        return from(updatePrompt(id, { content: text })).pipe(
          map(() => text)
        );
      }),
      tap((savedText) => {
        if (typeof savedText === 'string') {
          setStatus('saved');
          // Update activePrompt state with the text we actually saved
          setActivePrompt(prev => prev ? { ...prev, content: savedText, updatedAt: Date.now() } : null);
        }
      })
    ).subscribe();

    // 2. AI Suggestion Stream (1500ms debounce - wait for pause)
    const aiSubscription = textStream.pipe(
      debounceTime(1500),
      distinctUntilChanged(), 
      filter(text => text.length > 20),
      tap(() => setAiStatus('thinking')),
      switchMap(text => from(getSuggestions(text)).pipe(
        catchError(err => {
          console.error(err);
          return of({ continuations: [], enhancements: [], typos: [] } as AIResponse);
        })
      )),
      tap((results) => {
        setSuggestions(results);
        setAiStatus('ready');
      })
    ).subscribe();

    return () => {
      saveSubscription.unsubscribe();
      aiSubscription.unsubscribe();
    };
  }, [activePrompt?.id]); // Only recreate streams if ID changes (navigation), not on every save

  const handleInput = useCallback((newContent: string) => {
    setContent(newContent);
    input$.current.next(newContent);
  }, []);

  const handleApplySuggestion = async (text: string, type: 'continuation' | 'enhancement') => {
    if (!activePrompt) return;

    let newContent = content;
    if (type === 'continuation') {
      newContent = content.trimEnd() + ' ' + text;
    } else {
      await saveVersion(activePrompt.id, content, 'Pre-enhancement backup');
      newContent = text;
    }

    handleInput(newContent);
    // Force immediate save
    await updatePrompt(activePrompt.id, { content: newContent });
    setStatus('saved');
  };

  const handleRestoreVersion = async (version: PromptVersion) => {
    if (!activePrompt) return;
    
    // Save current as a version before restoring, to avoid data loss
    if (content.trim() !== '') {
        await saveVersion(activePrompt.id, content, 'Auto-backup before restore');
    }

    const newContent = version.content;
    handleInput(newContent);
    
    // Force update in DB immediately
    await updatePrompt(activePrompt.id, { content: newContent });
    setStatus('saved');
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save: Ctrl/Cmd + S
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (activePrompt) {
        setStatus('saving');
        await updatePrompt(activePrompt.id, { content });
        setStatus('saved');
      }
      return;
    }

    // Accept Suggestion: Tab
    if (e.key === 'Tab') {
      if (suggestions.continuations.length > 0) {
        e.preventDefault();
        handleApplySuggestion(suggestions.continuations[0], 'continuation');
      }
    }
  };

  const createNewPrompt = async () => {
    const p = await createPrompt('');
    onNavigate(p.id);
  };

  return {
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
  };
};