
import { useEffect } from 'react';
import { getCurrentUser } from '@/services/auth-service';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';

/**
 * Hook to clean up path elements when user logs out or changes
 */
export function usePathElementsCleaner(clearPathElements: () => void) {
  // Clear path elements when user logs out or changes
  useEffect(() => {
    const handleUserLogout = () => {
      console.log('User logged out, clearing path elements');
      clearPathElements();
    };
    
    const handleUserChange = () => {
      console.log('User changed, clearing path elements');
      clearPathElements();
      
      // Give time for new user data to load
      setTimeout(() => {
        console.log('Triggering path restore after user change');
        window.dispatchEvent(new Event('drawingsUpdated'));
      }, 100);
    };

    // Handle direct clear all SVG paths event
    const handleClearAllSvgPaths = () => {
      console.log('Clearing all SVG paths');
      clearPathElements();
      
      // Try to access map instance through window featureGroup
      if (window.featureGroup && (window.featureGroup as any)._map) {
        clearAllMapSvgElements((window.featureGroup as any)._map);
      }
    };

    // We've removed the duplicate handler for leaflet-draw-edit-remove here
    // Clear button handling is now fully centralized in useClearAllOperation.ts
    
    window.addEventListener('userLoggedOut', handleUserLogout);
    window.addEventListener('userChanged', handleUserChange);
    window.addEventListener('clearAllSvgPaths', handleClearAllSvgPaths);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleUserLogout);
      window.removeEventListener('userChanged', handleUserChange);
      window.removeEventListener('clearAllSvgPaths', handleClearAllSvgPaths);
    };
  }, [clearPathElements]);
  
  // Listen for restoreSavedPaths event
  useEffect(() => {
    const handleRestorePaths = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && Array.isArray(customEvent.detail.paths)) {
        console.log('Received restore paths event with', customEvent.detail.paths.length, 'paths');
        
        // Dispatch event to restore each saved path
        customEvent.detail.paths.forEach((pathData: string) => {
          try {
            const pathObj = JSON.parse(pathData);
            if (pathObj && pathObj.id) {
              // Create a drawing created event to restore this path
              window.dispatchEvent(new CustomEvent('restoreDrawing', {
                detail: pathObj
              }));
            }
          } catch (err) {
            console.error('Failed to parse saved path data:', err);
          }
        });
      }
    };
    
    window.addEventListener('restoreSavedPaths', handleRestorePaths);
    
    return () => {
      window.removeEventListener('restoreSavedPaths', handleRestorePaths);
    };
  }, []);
}
