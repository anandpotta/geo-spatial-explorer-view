
import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to manage globe initialization and callbacks
 */
export function useGlobeCallbacks(
  isInitialized: boolean,
  setIsInitialized: (value: boolean) => void,
  containerRef: React.RefObject<HTMLDivElement>,
  onInitialized?: () => void
) {
  // State management refs
  const isSetupCompleteRef = useRef(false);
  const initCallbackFiredRef = useRef<boolean>(false);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceInitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const texturesLoadedRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  
  // Handle textures loaded callback with delay to ensure smooth appearance
  const handleTexturesLoaded = useCallback(() => {
    // Don't re-fire if textures were already loaded or component unmounted
    if (texturesLoadedRef.current || !mountedRef.current) return;
    texturesLoadedRef.current = true;
    
    if (onInitialized && isInitialized && !initCallbackFiredRef.current && mountedRef.current) {
      console.log("Textures loaded, preparing to call onInitialized callback");
      
      // Mark that we've fired the callback to prevent double initialization
      initCallbackFiredRef.current = true;
      
      // Small delay to ensure textures are applied before showing
      setTimeout(() => {
        if (mountedRef.current) {
          console.log("Calling onInitialized callback - textures loaded and applied");
          onInitialized();
        }
      }, 150);
    }
  }, [onInitialized, isInitialized]);
  
  // Force initialization after a delay if not already initialized
  useEffect(() => {
    if (initCallbackFiredRef.current || !containerRef.current) return;
    
    // Set a forced initialization timeout as a safety measure
    forceInitTimeoutRef.current = setTimeout(() => {
      if (!isInitialized && containerRef.current && mountedRef.current) {
        console.log("Forcing initialization after timeout");
        setIsInitialized(true);
        
        // If onInitialized callback hasn't fired yet, fire it
        if (!initCallbackFiredRef.current && onInitialized && mountedRef.current) {
          console.log("Calling onInitialized callback from force init timeout");
          initCallbackFiredRef.current = true;
          onInitialized();
        }
      }
    }, 2000); // Reduced timeout for better responsiveness
    
    return () => {
      if (forceInitTimeoutRef.current) {
        clearTimeout(forceInitTimeoutRef.current);
        forceInitTimeoutRef.current = null;
      }
    };
  }, [isInitialized, setIsInitialized, onInitialized, containerRef]);
  
  // Initialize effect - improved initialization with better fallbacks
  useEffect(() => {
    if (isSetupCompleteRef.current || !containerRef.current) return;
    
    // Clear any existing timeout
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
    }
    
    // Mark as initialized after a reasonable timeout to ensure everything is ready
    initializationTimeoutRef.current = setTimeout(() => {
      if (!isInitialized && containerRef.current && !initCallbackFiredRef.current && mountedRef.current) {
        console.log("Setting isInitialized to true after timeout");
        setIsInitialized(true);
        isSetupCompleteRef.current = true;
        
        // Even if textures are still loading, we'll consider the globe ready
        // to avoid getting stuck at the loading screen
        if (onInitialized && !initCallbackFiredRef.current && mountedRef.current) {
          console.log("Calling onInitialized as fallback to prevent stuck loading");
          initCallbackFiredRef.current = true;
          onInitialized();
        }
      }
    }, 1800); // Slightly reduced timeout for better responsiveness
    
    return () => {
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }
    };
  }, [isInitialized, setIsInitialized, onInitialized, containerRef]);
  
  // Unmount cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }
      if (forceInitTimeoutRef.current) {
        clearTimeout(forceInitTimeoutRef.current);
        forceInitTimeoutRef.current = null;
      }
    };
  }, []);
  
  return {
    handleTexturesLoaded,
    initCallbackFiredRef
  };
}
