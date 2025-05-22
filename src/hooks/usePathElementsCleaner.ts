
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

    // Enhanced detection for Leaflet Draw clear all action with improved selector targeting
    const handleClick = (e: MouseEvent) => {
      if (!e.target) return;

      const target = e.target as HTMLElement;
      console.log('Click detected on:', target.tagName, target.textContent?.trim());
      
      // Special handling for leaflet-draw-actions clear all button
      if (target.closest('.leaflet-draw-actions')) {
        const actionItem = target.closest('li');
        if (actionItem) {
          const actionLink = actionItem.querySelector('a');
          if (actionLink && (
              actionLink.textContent?.includes('Clear all') || 
              actionLink.title?.includes('Clear all') ||
              actionLink.getAttribute('class')?.includes('clear')
          )) {
            console.log('CLEAR ALL ACTION BUTTON CLICKED!');
            e.preventDefault();
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('leafletClearAllRequest'));
            return;
          }
        }
      }
      
      // Detect clicks on the clear all layers button with expanded detection
      if (target.tagName === 'A' || target.parentElement?.tagName === 'A') {
        const linkElement = target.tagName === 'A' ? target : target.parentElement;
        if (linkElement?.textContent?.includes('Clear all layers') || 
            linkElement?.title?.includes('Clear all layers') ||
            linkElement?.title?.includes('Delete all layers')) {
          console.log('CLEAR ALL LAYERS LINK CLICKED!');
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('leafletClearAllRequest'));
          return;
        }
      }

      // Check parent elements up to 3 levels for "Clear all layers" text
      let currentEl: HTMLElement | null = target;
      for (let i = 0; i < 3 && currentEl; i++) {
        if (currentEl.textContent?.includes('Clear all layers') || 
            currentEl.title?.includes('Clear all layers') ||
            currentEl.getAttribute('class')?.includes('leaflet-draw-edit-remove')) {
          console.log('CLEAR ALL LAYERS PARENT ELEMENT CLICKED!');
          
          // Check if we're in the edit-remove control's action menu
          const actionsContainer = currentEl.closest('.leaflet-draw-actions');
          if (actionsContainer) {
            const actionLinks = actionsContainer.querySelectorAll('a');
            actionLinks.forEach(link => {
              if (link.textContent?.includes('Clear all') || 
                  link.title?.includes('Clear all') ||
                  link.title?.includes('Delete all')) {
                console.log('Found clear all action link in menu');
                e.preventDefault();
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('leafletClearAllRequest'));
                return;
              }
            });
          }
          
          // Still dispatch the event if we can't find the specific link
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('leafletClearAllRequest'));
          return;
        }
        currentEl = currentEl.parentElement;
      }

      // Check if clicked element is within the edit-remove control
      const editRemove = target.closest('.leaflet-draw-edit-remove');
      if (editRemove) {
        console.log('Click within leaflet-draw-edit-remove detected');
        
        // Check for click on the icon itself or button
        if (target.tagName === 'SPAN' || 
            target.tagName === 'I' || 
            target.classList.contains('leaflet-draw-edit-remove')) {
          // This is a click on the edit-remove button itself, which should open the menu
          // We don't want to interfere with this behavior
          return;
        }
        
        // For clicks within the edit-remove dropdown menu
        const clearAllButton = editRemove.querySelector('a[title*="Clear all"], a[title*="clear all"], a.leaflet-draw-edit-remove, .leaflet-draw-actions a');
        if (clearAllButton && (target === clearAllButton || clearAllButton.contains(target))) {
          console.log('CLEAR ALL BUTTON DETECTED WITHIN DRAW-EDIT-REMOVE!');
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('leafletClearAllRequest'));
        }
      }
    };
    
    // Track clicks on the document body for maximum detection coverage
    window.addEventListener('userLoggedOut', handleUserLogout);
    window.addEventListener('userChanged', handleUserChange);
    window.addEventListener('clearAllSvgPaths', handleClearAllSvgPaths);
    
    // Use both capture and bubbling phase to ensure we catch the event
    document.addEventListener('click', handleClick, true);
    document.addEventListener('click', handleClick, false);
    
    // Additional handler for leaflet-specific elements that might be added dynamically
    const handleMutations = (mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if leaflet actions menu was added
          const actionsMenu = document.querySelector('.leaflet-draw-actions');
          if (actionsMenu) {
            const clearAllLinks = actionsMenu.querySelectorAll('a');
            clearAllLinks.forEach(link => {
              if (link.textContent?.includes('Clear all') || 
                  link.title?.includes('Clear all') ||
                  link.title?.includes('Delete all')) {
                console.log('Found dynamically added Clear All action link');
                link.addEventListener('click', (e) => {
                  console.log('Clear All action link clicked directly!');
                  e.preventDefault();
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('leafletClearAllRequest'));
                }, true);
              }
            });
          }
        }
      }
    };
    
    // Set up mutation observer to watch for dynamically added elements
    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      window.removeEventListener('userLoggedOut', handleUserLogout);
      window.removeEventListener('userChanged', handleUserChange);
      window.removeEventListener('clearAllSvgPaths', handleClearAllSvgPaths);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('click', handleClick, false);
      observer.disconnect();
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
