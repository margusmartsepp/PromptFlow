import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlOrMeta?: boolean;
  handler: (e: KeyboardEvent) => void;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow shortcuts to trigger even if focused on inputs for global commands (like Cmd+S, Cmd+N)
      // but prevent default browser behaviors
      
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      for (const s of shortcuts) {
        if (s.key.toLowerCase() === e.key.toLowerCase()) {
          if (s.ctrlOrMeta && !isCtrlOrMeta) continue;
          if (!s.ctrlOrMeta && isCtrlOrMeta) continue;

          e.preventDefault();
          s.handler(e);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};