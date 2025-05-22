
import { useRef, useCallback } from 'react';

/**
 * Hook for managing timeouts used during flight animations
 */
export function useFlightTimeouts() {
  const callbackTimeoutRef = useRef<number | null>(null);
  const stabilizationTimeoutRef = useRef<number | null>(null);

  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    if (callbackTimeoutRef.current !== null) {
      window.clearTimeout(callbackTimeoutRef.current);
      callbackTimeoutRef.current = null;
    }
    
    if (stabilizationTimeoutRef.current !== null) {
      window.clearTimeout(stabilizationTimeoutRef.current);
      stabilizationTimeoutRef.current = null;
    }
  }, []);

  // Set timeout for callback execution
  const setCallbackTimeout = useCallback((callback: () => void, delay: number = 250) => {
    // Clear any existing timeout
    if (callbackTimeoutRef.current !== null) {
      window.clearTimeout(callbackTimeoutRef.current);
    }
    
    callbackTimeoutRef.current = window.setTimeout(() => {
      callbackTimeoutRef.current = null;
      callback();
    }, delay);
  }, []);

  // Set timeout for stabilization
  const setStabilizationTimeout = useCallback((callback: () => void, delay: number = 300) => {
    // Clear any existing timeout
    if (stabilizationTimeoutRef.current !== null) {
      window.clearTimeout(stabilizationTimeoutRef.current);
    }
    
    stabilizationTimeoutRef.current = window.setTimeout(() => {
      stabilizationTimeoutRef.current = null;
      callback();
    }, delay);
  }, []);

  return {
    callbackTimeoutRef,
    stabilizationTimeoutRef,
    clearAllTimeouts,
    setCallbackTimeout,
    setStabilizationTimeout
  };
}
