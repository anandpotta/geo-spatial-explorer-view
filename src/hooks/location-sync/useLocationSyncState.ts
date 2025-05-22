
import { useState, useRef } from 'react';

export function useLocationSyncState() {
  const [hasInitialPositioning, setHasInitialPositioning] = useState(false);
  
  // Maintain refs for tracking state and preventing stale operations
  const processedLocationRef = useRef<string | null>(null);
  const flyInProgressRef = useRef(false);
  const transitionInProgressRef = useRef(false);
  const isUnmountedRef = useRef(false);
  const initialPositioningAttemptsRef = useRef(0);
  const timeoutRefsRef = useRef<number[]>([]);
  
  const resetState = () => {
    // Clear all timeouts
    timeoutRefsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    timeoutRefsRef.current = [];
    
    // Reset operation flags
    flyInProgressRef.current = false;
    transitionInProgressRef.current = false;
  };

  return {
    // State
    hasInitialPositioning,
    setHasInitialPositioning,
    
    // Refs
    processedLocationRef,
    flyInProgressRef, 
    transitionInProgressRef,
    isUnmountedRef,
    initialPositioningAttemptsRef,
    timeoutRefsRef,
    
    // Methods
    resetState
  };
}
