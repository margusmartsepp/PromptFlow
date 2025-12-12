import React, { useRef, useState } from 'react';
import { X, Moon, Sun, Monitor, Download, Upload, Trash2, AlertTriangle, Check } from 'lucide-react';
import { listPrompts, importPrompts, clearAllData } from '../lib/db';
import clsx from 'clsx';
import { Prompt } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  onDataChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme, setTheme, onDataChanged }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleExport = async () => {
    const prompts = await listPrompts();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `promptflow_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as Prompt[];
        if (Array.isArray(json)) {
          await importPrompts(json);
          setImportStatus('success');
          onDataChanged();
          setTimeout(() => setImportStatus('idle'), 3000);
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = async () => {
    if (confirm("DANGER: This will permanently delete ALL your prompts and history. This cannot be undone. Are you sure?")) {
      await clearAllData();
      onDataChanged();
      onClose();
      window.location.hash = ''; // Reset route
      window.location.reload(); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Settings</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Theme Section */}
          <section>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Appearance</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'system', icon: Monitor, label: 'System' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTheme(item.id as any)}
                  className={clsx(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                    theme === item.id 
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <item.icon size={20} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Data Section */}
          <section>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Data Management</h3>
            <div className="space-y-3">
              <button 
                onClick={handleExport}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-md">
                    <Download size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">Export All Prompts</div>
                    <div className="text-xs text-slate-500">Save as JSON backup</div>
                  </div>
                </div>
              </button>

              <div className="relative">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".json" 
                  onChange={handleImport}
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-md">
                      <Upload size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">Import Prompts</div>
                      <div className="text-xs text-slate-500">Restore from JSON backup</div>
                    </div>
                  </div>
                  {importStatus === 'success' && <Check size={18} className="text-green-500" />}
                  {importStatus === 'error' && <AlertTriangle size={18} className="text-red-500" />}
                </button>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={handleClearAll}
                  className="w-full flex items-center justify-center gap-2 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-sm transition-colors"
                >
                  <Trash2 size={16} />
                  Clear All Data
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};