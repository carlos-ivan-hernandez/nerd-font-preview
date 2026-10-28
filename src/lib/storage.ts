import {useEffect, useState} from 'react';

// useState that remembers its value in localStorage. Storage can be unavailable (private windows, blocked
// site data), in which case it behaves like plain useState.
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`nerd-font-preview:${key}`);
      return stored === null ? initial : (JSON.parse(stored) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`nerd-font-preview:${key}`, JSON.stringify(value));
    } catch {
      // Not saved; the setting still works for this visit.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
