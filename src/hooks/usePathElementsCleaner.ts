
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
      if (typeof window !== 'undefined' && window.featureGroup && (window.featureGroup as any)._map) {
        console.log('Found map reference, clearing SVG paths from DOM');
        clearAllMapSvgElements((window.featureGroup as any)._map);
        
        // Force redraw of the map after cleaning up
        setTimeout(() => {
          const map = (window.featureGroup as any)._map;
          if (map) {
            try {
              // Force map refresh
              map.invalidateSize();
            } catch (e) {
              console.error('Error refreshing map after path cleanup:', e);
            }
          }
        }, 100);
      }
    };
    
    // We'll remove this handler to prevent duplicate confirmation dialogs
    // The clear button handling is now fully managed by useClearAllOperation.ts
    
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
            // First try to parse as JSON (new format)
            let pathObj;
            try {
              pathObj = JSON.parse(pathData);
            } catch (jsonError) {
              // If JSON parsing fails, it might be a raw SVG path string (old format)
              if (typeof pathData === 'string' && pathData.startsWith('M')) {
                console.log('Found raw SVG path data, creating minimal path object');
                pathObj = {
                  id: `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  d: pathData,
                  stroke: '#3388ff',
                  strokeWidth: '3',
                  fill: '#3388ff',
                  fillOpacity: '0.2'
                };
              } else {
                console.error('Failed to parse path data - not JSON and not SVG path:', pathData);
                return;
              }
            }
            
            if (pathObj && (pathObj.id || pathObj.d)) {
              // Create a drawing created event to restore this path
              window.dispatchEvent(new CustomEvent('restoreDrawing', {
                detail: pathObj
              }));
            }
          } catch (err) {
            console.error('Failed to process saved path data:', err);
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
