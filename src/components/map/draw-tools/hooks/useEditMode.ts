
import { useEffect, RefObject, useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook to manage edit mode activation/deactivation
 */
export function useEditMode(editControlRef: RefObject<any>, activeTool: string | null) {
  const [isEditActive, setIsEditActive] = useState(false);
  const [activationAttempts, setActivationAttempts] = useState(0);
  
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
        editControlContainer.style.zIndex = '9999';
        
        // Make sure all buttons inside are visible and properly sized
        const buttons = editControlContainer.querySelectorAll('a');
        buttons.forEach(button => {
          (button as HTMLElement).style.display = 'inline-block';
          (button as HTMLElement).style.visibility = 'visible';
          (button as HTMLElement).style.opacity = '1';
        });
        
        // Ensure the edit toolbar is visible
        const toolbar = editControlContainer.querySelector('.leaflet-draw-toolbar') as HTMLElement;
        if (toolbar) {
          toolbar.style.display = 'block';
          toolbar.style.visibility = 'visible';
          toolbar.style.opacity = '1';
        }
        
        // Make edit and delete buttons specifically visible
        const editEditBtn = editControlContainer.querySelector('.leaflet-draw-edit-edit') as HTMLElement;
        if (editEditBtn) {
          editEditBtn.style.display = 'inline-block';
          editEditBtn.style.visibility = 'visible';
          editEditBtn.style.opacity = '1';
        }
        
        const editDeleteBtn = editControlContainer.querySelector('.leaflet-draw-edit-remove') as HTMLElement;
        if (editDeleteBtn) {
          editDeleteBtn.style.display = 'inline-block';
          editDeleteBtn.style.visibility = 'visible';
          editDeleteBtn.style.opacity = '1';
        }
      }
    } catch (err) {
      console.error('Error ensuring edit controls visibility:', err);
    }
  }, []);
  
  // More reliable way to update edit mode
  const updateEditMode = useCallback(() => {
    if (!editControlRef.current) {
      console.log('Edit control ref not available yet');
      return false;
    }
    
    try {
      const editControl = editControlRef.current;
      const editToolbar = editControl._toolbars?.edit;
      
      if (!editToolbar) {
        console.log('Edit toolbar not available yet');
        return false;
      }
      
      const editHandler = editToolbar._modes?.edit?.handler;
      const deleteHandler = editToolbar._modes?.remove?.handler;
      
      const shouldEnableEdit = activeTool === 'edit';
      
      if (shouldEnableEdit && editHandler && typeof editHandler.enable === 'function') {
        const isAlreadyEnabled = editHandler.enabled && editHandler.enabled();
        if (!isAlreadyEnabled) {
          console.log('Enabling edit mode');
          
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
          toast.success('Edit mode activated', { 
            id: 'edit-mode-success',
            duration: 2000
          });
          
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

  // More aggressive retry mechanism for edit mode activation
  useEffect(() => {
    // Function to activate or deactivate edit mode with retries
    const attemptUpdateEditMode = (retry = 0, maxRetries = 5) => {
      if (activeTool !== 'edit') {
        return; // Don't attempt if not in edit mode
      }
      
      console.log(`Attempting to activate edit mode (attempt ${retry + 1} of ${maxRetries})`);
      
      const result = updateEditMode();
      
      if (!result && retry < maxRetries) {
        // Retry with increasing delay
        const delay = Math.min(Math.pow(1.5, retry) * 300, 2000);
        setTimeout(() => attemptUpdateEditMode(retry + 1, maxRetries), delay);
        setActivationAttempts(prev => prev + 1);
      } else if (result) {
        console.log('Edit mode activation successful');
        setActivationAttempts(0);
      }
    };

    // Reset attempts when tool changes
    if (activeTool !== 'edit') {
      setActivationAttempts(0);
      return;
    }
    
    // Initial update with retry logic
    attemptUpdateEditMode();
    
    // Always ensure controls are visible on mount
    ensureEditControlsVisibility();
    
    // Set up a timer that periodically ensures edit controls are visible
    const controlsVisibilityId = setInterval(ensureEditControlsVisibility, 1000); // Check more frequently
    
    // Set up a timer to make periodic activation attempts
    let editAttemptId: NodeJS.Timeout | null = null;
    
    if (activeTool === 'edit') {
      editAttemptId = setInterval(() => {
        if (!isEditActive && activeTool === 'edit') {
          console.log('Periodically attempting to activate edit mode');
          updateEditMode();
        }
      }, 3000);
    }
    
    return () => {
      clearInterval(controlsVisibilityId);
      if (editAttemptId) clearInterval(editAttemptId);
    };
  }, [editControlRef, activeTool, updateEditMode, isEditActive, ensureEditControlsVisibility, activationAttempts]);
  
  // Add a special effect to handle DOM changes with increased sensitivity
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
  }, [ensureEditControlsVisibility]);
  
  return isEditActive;
}
