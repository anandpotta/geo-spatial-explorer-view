
import { useRef } from 'react';

export function useTimers() {
  const timeoutRefsRef = useRef<number[]>([]);
  const isUnmountedRef = useRef(false);
  
  // Add a safe setTimeout function that tracks timeouts for cleanup
  const safeSetTimeout = (callback: () => void, delay: number): number => {
    const timeoutId = window.setTimeout(() => {
      if (!isUnmountedRef.current) {
        callback();
      }
    }, delay);
    timeoutRefsRef.current.push(timeoutId);
    return timeoutId;
  };
  
  // Clean up any registered timeouts
  const clearAllTimeouts = () => {
    timeoutRefsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    timeoutRefsRef.current = [];
  };

  return {
    safeSetTimeout,
    clearAllTimeouts,
    timeoutRefsRef,
    isUnmountedRef
  };
}
