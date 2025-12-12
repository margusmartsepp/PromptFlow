import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlOrMeta?: boolean;
  handler: (e: KeyboardEvent) => void;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input/textarea is focused (unless it's a command like Save)
      // But for global commands like New Prompt, we usually want them to work everywhere
      // except maybe if they conflict with typing.
      
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