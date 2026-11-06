import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>, string | null] {
  const [stored, setStored] = useState(() => readStored(key, initialValue, isValid));

  useEffect(() => {
    if (stored.key !== key) {
      setStored(readStored(key, initialValue, isValid));
      return;
    }
    if (!stored.shouldPersist) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(stored.value));
      if (stored.error) setStored((current) => ({ ...current, error: null }));
    } catch (cause) {
      console.error(`Unable to save "${key}" to browser storage.`, cause);
      const message = 'Your changes are only available in this browser session and could not be saved.';
      if (stored.error !== message) setStored((current) => ({ ...current, error: message }));
    }
  }, [initialValue, isValid, key, stored]);

  const setValue: Dispatch<SetStateAction<T>> = (action) => {
    setStored((current) => ({
      ...current,
      key,
      value: typeof action === 'function'
        ? (action as (previous: T) => T)(current.value)
        : action,
      shouldPersist: true,
    }));
  };

  return [stored.value, setValue, stored.error];
}

function readStored<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
): { key: string; value: T; error: string | null; shouldPersist: boolean } {
  try {
    const saved = window.localStorage.getItem(key);
    if (saved === null) return { key, value: initialValue, error: null, shouldPersist: true };
    const parsed: unknown = JSON.parse(saved);
    if (!isValid(parsed)) throw new Error(`Saved data for "${key}" has an invalid shape.`);
    return { key, value: parsed, error: null, shouldPersist: true };
  } catch (cause) {
    console.error(`Unable to load "${key}" from browser storage.`, cause);
    return { key, value: initialValue, error: 'Saved browser data could not be loaded. Make a change to replace it with a fresh list.', shouldPersist: false };
  }
}
