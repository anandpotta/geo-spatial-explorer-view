
import { useEffect, RefObject, useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook to manage edit mode activation/deactivation
 */
export function useEditMode(editControlRef: RefObject<any>, activeTool: string | null) {
  const [isEditActive, setIsEditActive] = useState(false);
  
  // Function to ensure edit controls are always visible with correct width
  const ensureEditControlsVisibility = useCallback(() => {
    try {
      // Find the edit control container
      const editControlContainer = document.querySelector('.leaflet-draw.leaflet-control') as HTMLElement;
      if (editControlContainer) {
        // Set fixed width and ensure visibility
        editControlContainer.style.width = '200px';
        editControlContainer.style.display = 'block';
        editControlContainer.style.visibility = 'visible';
        editControlContainer.style.opacity = '1';
        editControlContainer.style.pointerEvents = 'auto';
        
        // Make sure all buttons inside are visible and properly sized
        const buttons = editControlContainer.querySelectorAll('a');
        buttons.forEach(button => {
          button.style.display = 'inline-block';
          button.style.visibility = 'visible';
        });
        
        // Ensure the edit toolbar is visible
        const toolbar = editControlContainer.querySelector('.leaflet-draw-toolbar') as HTMLElement;
        if (toolbar) {
          toolbar.style.display = 'block';
          toolbar.style.visibility = 'visible';
        }
      }
    } catch (err) {
      console.error('Error ensuring edit controls visibility:', err);
    }
  }, []);
  
  // More reliable way to update edit mode
  const updateEditMode = useCallback(() => {
    if (!editControlRef.current) {
      // Reduce logging frequency
      return false;
    }
    
    try {
      const editControl = editControlRef.current;
      const editToolbar = editControl._toolbars?.edit;
      
      if (!editToolbar) {
        return false;
      }
      
      const editHandler = editToolbar._modes?.edit?.handler;
      const deleteHandler = editToolbar._modes?.remove?.handler;
      
      const shouldEnableEdit = activeTool === 'edit';
      
      if (shouldEnableEdit && editHandler && typeof editHandler.enable === 'function') {
        const isAlreadyEnabled = editHandler.enabled && editHandler.enabled();
        if (!isAlreadyEnabled) {
          // First ensure all layers are selected to make them eligible for editing
          if (editHandler._featureGroup) {
            editHandler._featureGroup.eachLayer((layer: any) => {
              if (typeof layer._path !== 'undefined') {
                editHandler._selectableLayers.addLayer(layer);
              }
            });
          }
          
          // Then enable edit mode
          editHandler.enable();
          
          // Update state and show notification
          setIsEditActive(true);
          
          // Ensure edit controls are visible
          ensureEditControlsVisibility();
          return true;
        }
        return isAlreadyEnabled;
      } else if (!shouldEnableEdit) {
        // Deactivate edit mode
        if (editHandler && typeof editHandler.disable === 'function' && editHandler.enabled && editHandler.enabled()) {
          editHandler.disable();
          setIsEditActive(false);
        }
        
        // Deactivate delete mode
        if (deleteHandler && typeof deleteHandler.disable === 'function' && deleteHandler.enabled && deleteHandler.enabled()) {
          deleteHandler.disable();
        }
      }
      
      // Always ensure controls are visible regardless of edit mode
      ensureEditControlsVisibility();
      
      // Always ensure image controls are visible regardless of edit mode
      setTimeout(() => {
        document.querySelectorAll('.image-controls-wrapper').forEach((el) => {
          (el as HTMLElement).style.opacity = '1';
          (el as HTMLElement).style.visibility = 'visible';
          (el as HTMLElement).style.display = 'block';
          (el as HTMLElement).style.pointerEvents = 'auto';
        });
      }, 200);
      
      return shouldEnableEdit && isEditActive;
    } catch (err) {
      console.error('Error updating edit mode:', err);
      return false;
    }
  }, [editControlRef, activeTool, isEditActive, ensureEditControlsVisibility]);

  // Retry mechanism for edit mode activation with reduced persistence
  useEffect(() => {
    // Function to activate or deactivate edit mode with retries
    const attemptUpdateEditMode = (retry = 0, maxRetries = 2) => { // Reduced max retries
      if (!editControlRef.current && retry < maxRetries) {
        // Retry with increasing delay
        const delay = Math.min(Math.pow(2, retry) * 200, 2000);
        setTimeout(() => attemptUpdateEditMode(retry + 1, maxRetries), delay);
        return;
      }
      
      updateEditMode();
    };

    // Initial update with retry logic
    attemptUpdateEditMode();
    
    // Always ensure controls are visible on mount
    ensureEditControlsVisibility();
    
    // Set up a timer that periodically ensures edit controls are visible
    const controlsVisibilityId = setInterval(ensureEditControlsVisibility, 2000); // Check every 2 seconds
    
    // Set up a timer that periodically ensures image controls are visible, but less frequently
    const visibilityCheckId = setInterval(() => {
      document.querySelectorAll('.image-controls-wrapper').forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.display = 'block';
        (el as HTMLElement).style.pointerEvents = 'auto';
      });
    }, 5000); // Increased to 5 seconds
    
    // Also set up a less frequent check for edit mode status
    const editCheckId = setInterval(() => {
      const shouldBeActive = activeTool === 'edit';
      if (shouldBeActive !== isEditActive) {
        updateEditMode();
      }
    }, 10000); // Increased to 10 seconds
    
    return () => {
      clearInterval(controlsVisibilityId);
      clearInterval(visibilityCheckId);
      clearInterval(editCheckId);
    };
  }, [editControlRef, activeTool, updateEditMode, isEditActive, ensureEditControlsVisibility]);
  
  // Add a special effect to handle DOM changes with reduced sensitivity
  useEffect(() => {
    // Monitor for DOM changes that might remove our controls
    const observer = new MutationObserver((mutations) => {
      let needsCheck = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          // Check if any of the removed nodes are image controls or edit controls
          mutation.removedNodes.forEach(node => {
            if (node instanceof Element && 
                (node.classList.contains('image-controls-wrapper') || 
                 node.classList.contains('image-controls-container') ||
                 node.classList.contains('leaflet-draw') ||
                 node.classList.contains('leaflet-control'))) {
              needsCheck = true;
            }
          });
        }
        
        // Also check for attribute changes on controls
        if (mutation.type === 'attributes' && 
            mutation.target instanceof Element && (
            mutation.target.classList.contains('image-controls-wrapper') || 
            mutation.target.classList.contains('image-controls-container') ||
            mutation.target.classList.contains('leaflet-draw') ||
            mutation.target.classList.contains('leaflet-control'))) {
          needsCheck = true;
        }
      });
      
      if (needsCheck) {
        // Re-show any controls that might have been hidden, with a debounce
        clearTimeout((window as any)._controlsVisibilityTimeout);
        (window as any)._controlsVisibilityTimeout = setTimeout(() => {
          ensureEditControlsVisibility();
          document.querySelectorAll('.image-controls-wrapper').forEach((el) => {
            (el as HTMLElement).style.opacity = '1';
            (el as HTMLElement).style.visibility = 'visible';
            (el as HTMLElement).style.display = 'block';
            (el as HTMLElement).style.pointerEvents = 'auto';
          });
        }, 100);
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
  }, [ensureEditControlsVisibility]);
  
  return isEditActive;
}
