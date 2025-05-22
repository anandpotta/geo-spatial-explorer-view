
import { useRef, useCallback } from 'react';

/**
 * Hook for managing flight state
 */
export function useFlightState(externalFlyingRef?: React.MutableRefObject<boolean>) {
  // Internal ref for tracking flight state if no external ref is provided
  const internalFlyingRef = useRef<boolean>(false);
  // Use either the provided external ref or the internal one
  const isFlyingRef = externalFlyingRef || internalFlyingRef;
  // Reference to store completion callbacks
  const completedCallbackRef = useRef<(() => void) | undefined>(undefined);

  // Set the flying state to true and store the completion callback
  const startFlying = useCallback((onComplete?: () => void) => {
    isFlyingRef.current = true;
    completedCallbackRef.current = onComplete;
  }, [isFlyingRef]);

  // Reset the flying state and clear the completion callback
  const stopFlying = useCallback(() => {
    isFlyingRef.current = false;
    completedCallbackRef.current = undefined;
  }, [isFlyingRef]);

  return {
    isFlyingRef,
    completedCallbackRef,
    startFlying,
    stopFlying
  };
}
