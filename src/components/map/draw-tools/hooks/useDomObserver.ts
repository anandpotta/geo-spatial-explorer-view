
import { useEffect } from 'react';
import { ensureEditControlsVisibility, ensureImageControlsVisibility } from './utils/editControlsVisibility';

/**
 * Hook to monitor DOM for changes that might affect control visibility
 */
export function useDomObserver() {
  useEffect(() => {
    // Monitor for DOM changes that might remove our controls
    const observer = new MutationObserver((mutations) => {
      let needsCheck = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          needsCheck = true;
        }
        
        // Also check for attribute changes on controls
        if (mutation.type === 'attributes' && 
            mutation.target instanceof Element) {
          needsCheck = true;
        }
      });
      
      if (needsCheck) {
        // Re-show any controls that might have been hidden, with a debounce
        clearTimeout((window as any)._controlsVisibilityTimeout);
        (window as any)._controlsVisibilityTimeout = setTimeout(() => {
          ensureEditControlsVisibility();
          ensureImageControlsVisibility();
        }, 50); // Faster response
      }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);
}
