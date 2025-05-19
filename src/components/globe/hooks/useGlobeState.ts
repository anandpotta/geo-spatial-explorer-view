
import { useState, useRef } from 'react';

/**
 * Hook to manage internal state for the ThreeGlobe component
 */
export function useGlobeState() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<'loading' | 'partial' | 'complete'>('loading');
  
  // References for tracking state
  const lastFlyLocationRef = useRef<string | null>(null);
  const initializationAttemptedRef = useRef(false);
  const readyCallbackFiredRef = useRef(false);
  const globeInitializedRef = useRef(false);
  const flyCompletedCallbackRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef<boolean>(true);
  const failsafeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  return {
    // State
    isInitialized,
    setIsInitialized,
    isFlying,
    setIsFlying,
    loadingStatus,
    setLoadingStatus,
    
    // Refs
    lastFlyLocationRef,
    initializationAttemptedRef,
    readyCallbackFiredRef,
    globeInitializedRef,
    flyCompletedCallbackRef,
    mountedRef,
    failsafeTimerRef,
  };
}
