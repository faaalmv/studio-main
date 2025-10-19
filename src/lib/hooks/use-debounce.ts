import { useRef, useCallback } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, wait = 300) {
  const timer = useRef<number | undefined>(undefined);

  return useCallback((...args: Parameters<T>) => {
    if (timer.current) {
      globalThis.clearTimeout(timer.current);
    }
    // @ts-ignore setTimeout returns number in browsers
    timer.current = globalThis.setTimeout(() => fn(...args), wait) as unknown as number;
  }, [fn, wait]);
}
