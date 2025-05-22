
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

    // Handle Leaflet Draw specific clear all action with improved detection
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      console.log('Click detected on:', target?.tagName, target?.textContent);
      
      // Check if it's a direct click on the "Clear all layers" text
      if (target && target.textContent?.trim() === 'Clear all layers') {
        console.log('Clear all layers text clicked directly!');
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('leafletClearAllRequest'));
        return;
      }
      
      // Check if it's a click on the parent <a> element
      if (target && target.tagName === 'A' && target.textContent?.trim() === 'Clear all layers') {
        console.log('Clear all layers link clicked directly!');
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('leafletClearAllRequest'));
        return;
      }
      
      // Check if it's a click within the parent li that contains the clear all text
      const parentLi = target?.closest('li');
      if (parentLi && parentLi.querySelector('a')?.textContent?.trim() === 'Clear all layers') {
        console.log('Clear all layers parent li clicked!');
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('leafletClearAllRequest'));
        return;
      }
      
      // Check for any click within the remove control that might contain "Clear all layers"
      const removeControl = target?.closest('.leaflet-draw-edit-remove');
      if (removeControl && removeControl.textContent?.includes('Clear all layers')) {
        const clearAllLink = removeControl.querySelector('a[title="Clear all layers"]') || 
                            removeControl.querySelector('a:contains("Clear all layers")');
        if (clearAllLink) {
          console.log('Clear all layers found in remove control!');
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('leafletClearAllRequest'));
          return;
        }
      }
    };
    
    window.addEventListener('userLoggedOut', handleUserLogout);
    window.addEventListener('userChanged', handleUserChange);
    window.addEventListener('clearAllSvgPaths', handleClearAllSvgPaths);
    
    // Use capture phase to catch the event before other handlers
    document.addEventListener('click', handleClick, true);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleUserLogout);
      window.removeEventListener('userChanged', handleUserChange);
      window.removeEventListener('clearAllSvgPaths', handleClearAllSvgPaths);
      document.removeEventListener('click', handleClick, true);
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
