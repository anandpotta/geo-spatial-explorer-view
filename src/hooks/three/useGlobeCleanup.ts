
import { useCallback } from 'react';

/**
 * Hook to provide a comprehensive cleanup function for the globe
 */
export function useGlobeCleanup(cleanupFunctions: (() => void)[]) {
  // Master cleanup function
  const cleanupAll = useCallback(() => {
    console.log("Executing globe cleanup functions: ", cleanupFunctions.length);
    
    // Call all cleanup functions
    cleanupFunctions.forEach(cleanup => {
      if (typeof cleanup === 'function') {
        try {
          cleanup();
        } catch (error) {
          console.error("Error during cleanup:", error);
        }
      }
    });
  }, [cleanupFunctions]);
  
  return cleanupAll;
}
