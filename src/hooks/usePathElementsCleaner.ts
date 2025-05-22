
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

    // Handle Leaflet Draw specific clear all action
    const handleLeafletClearAction = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if the clicked element is the "Clear all layers" button in Leaflet draw
      if (target && 
          target.tagName === 'A' && 
          target.parentElement?.parentElement?.classList.contains('leaflet-draw-actions') &&
          target.textContent?.includes('Clear all')) {
        
        console.log('Leaflet draw clear all layers button clicked');
        e.preventDefault();
        e.stopPropagation();
        
        // Dispatch a custom event to show the confirmation dialog
        window.dispatchEvent(new CustomEvent('leafletClearAllRequest'));
      }
    };
    
    window.addEventListener('userLoggedOut', handleUserLogout);
    window.addEventListener('userChanged', handleUserChange);
    window.addEventListener('clearAllSvgPaths', handleClearAllSvgPaths);
    // Capture all click events to detect Leaflet clear action
    document.addEventListener('click', handleLeafletClearAction, true);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleUserLogout);
      window.removeEventListener('userChanged', handleUserChange);
      window.removeEventListener('clearAllSvgPaths', handleClearAllSvgPaths);
      document.removeEventListener('click', handleLeafletClearAction, true);
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
