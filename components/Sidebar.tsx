import React, { useEffect, useState } from 'react';
import { Prompt } from '../types';
import { listPrompts, deletePrompt } from '../lib/db';
import { Plus, Search, FileText, Trash2, Settings, Menu } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  currentPromptId?: string | null;
  onNavigate: (id: string) => void;
  onNew: () => void;
  onOpenSettings: () => void;
  className?: string;
  refreshTrigger: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPromptId, 
  onNavigate, 
  onNew, 
  onOpenSettings,
  className, 
  refreshTrigger 
}) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    listPrompts().then(list => {
      setPrompts(list.sort((a, b) => b.updatedAt - a.updatedAt));
    });
  }, [currentPromptId, refreshTrigger]);

  const filtered = prompts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this prompt?')) {
      await deletePrompt(id);
      const list = await listPrompts();
      setPrompts(list.sort((a, b) => b.updatedAt - a.updatedAt));
      if (currentPromptId === id) {
        onNavigate('/');
      }
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={20} />
      </button>

      <div className={clsx(
        "fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 z-40",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100">PromptFlow</h1>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">v0.1</span>
          </div>
          <button 
            onClick={() => { onNew(); setIsOpen(false); }}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={18} /> New Prompt
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search prompts..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-indigo-500 rounded-md text-sm outline-none transition-all text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No prompts found.
            </div>
          ) : (
            filtered.map(p => (
              <div 
                key={p.id}
                onClick={() => { onNavigate(p.id); setIsOpen(false); }}
                className={clsx(
                  "group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border border-transparent",
                  currentPromptId === p.id 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-500/30" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <FileText size={16} className={clsx(
                  "mt-0.5 flex-shrink-0",
                  currentPromptId === p.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                )} />
                <div className="flex-1 min-w-0">
                  <h3 className={clsx(
                    "text-sm font-medium truncate",
                    currentPromptId === p.id ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-300"
                  )}>
                    {p.title || 'Untitled'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 truncate">
                    <span>{formatDate(p.updatedAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="truncate max-w-[80px]">{p.content.slice(0, 15)}...</span>
                  </p>
                </div>
                <button 
                  onClick={(e) => handleDelete(e, p.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};