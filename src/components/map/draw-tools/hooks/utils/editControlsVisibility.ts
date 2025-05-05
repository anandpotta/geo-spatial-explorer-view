
/**
 * Utility function to ensure edit controls are visible
 */

// Global state to track if controls are visible
declare global {
  interface Window {
    _controlsVisibilityTimeout?: number;
    _editModeActivating?: boolean;
    _editControlsForceVisible?: boolean;
  }
}

/**
 * Ensures edit controls are visible by directly manipulating the DOM
 */
export function ensureEditControlsVisibility(): boolean {
  // Clear any existing visibility timeout
  if (window._controlsVisibilityTimeout) {
    clearTimeout(window._controlsVisibilityTimeout);
  }
  
  // Set the global flag to indicate we want controls to be visible
  window._editControlsForceVisible = true;
  
  try {
    // Find the edit control container with broader selectors
    const editControlSelectors = [
      '.leaflet-draw.leaflet-control',
      '.leaflet-draw',
      '.leaflet-control-draw'
    ];
    
    let found = false;
    
    // Try each selector
    for (const selector of editControlSelectors) {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(editControlContainer => {
        if (!(editControlContainer instanceof HTMLElement)) return;
        
        // Force visibility with !important styles
        editControlContainer.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          z-index: 9999 !important;
        `;
        
        // Make all children visible
        Array.from(editControlContainer.querySelectorAll('*')).forEach(child => {
          if (child instanceof HTMLElement) {
            child.style.cssText = `
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              pointer-events: auto !important;
            `;
          }
        });
        
        // Specifically target toolbar and buttons
        const toolbars = editControlContainer.querySelectorAll('.leaflet-draw-toolbar, .leaflet-draw-edit-toolbar');
        toolbars.forEach(toolbar => {
          if (toolbar instanceof HTMLElement) {
            toolbar.style.cssText = `
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
            `;
          }
        });
        
        // Ensure edit and delete buttons are visible
        const actionButtons = editControlContainer.querySelectorAll('.leaflet-draw-edit-edit, .leaflet-draw-edit-remove');
        actionButtons.forEach(button => {
          if (button instanceof HTMLElement) {
            button.style.cssText = `
              display: inline-block !important;
              visibility: visible !important;
              opacity: 1 !important;
              pointer-events: auto !important;
            `;
          }
        });
        
        found = true;
      });
    }
    
    // Always maintain visibility
    window._controlsVisibilityTimeout = window.setTimeout(() => {
      ensureEditControlsVisibility();
    }, 500); // More frequent checks
    
    return found;
  } catch (err) {
    console.error('Error ensuring edit controls visibility:', err);
    return false;
  }
}

/**
 * Ensures image controls are visible by directly manipulating the DOM
 */
export function ensureImageControlsVisibility(): boolean {
  try {
    // Find all image control containers
    const imageControlSelectors = [
      '.image-controls-wrapper',
      '.image-controls-container'
    ];
    
    let found = false;
    
    // Try each selector
    for (const selector of imageControlSelectors) {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(container => {
        if (!(container instanceof HTMLElement)) return;
        
        // Force visibility with !important styles
        container.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          z-index: 9999 !important;
        `;
        
        // Make all children visible
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
          if (button instanceof HTMLElement) {
            button.style.cssText = `
              visibility: visible !important;
              opacity: 1 !important;
              pointer-events: auto !important;
            `;
          }
        });
        
        found = true;
      });
    }
    
    return found;
  } catch (err) {
    console.error('Error ensuring image controls visibility:', err);
    return false;
  }
}

/**
 * Force activate edit mode on a persistent basis
 */
export function persistentlyActivateEditMode(editControlRef: React.RefObject<any>): boolean {
  if (!editControlRef.current) return false;
  
  try {
    const editControl = editControlRef.current;
    const editToolbar = editControl._toolbars?.edit;
    
    if (!editToolbar || !editToolbar._modes) {
      return false;
    }
    
    const editHandler = editToolbar._modes?.edit?.handler;
    
    if (!editHandler || !editHandler.enable || typeof editHandler.enable !== 'function') {
      return false;
    }
    
    // First ensure all layers are selected to make them eligible for editing
    if (editHandler._featureGroup) {
      try {
        // Select all layers
        editHandler._featureGroup.eachLayer((layer: any) => {
          if (typeof layer._path !== 'undefined') {
            editHandler._selectableLayers.addLayer(layer);
          }
        });
        
        // Then enable edit mode
        if (!editHandler.enabled || !editHandler.enabled()) {
          editHandler.enable();
          console.log("Edit mode successfully activated permanently");
          return true;
        }
        return true; // Already enabled
      } catch (e) {
        console.error("Error selecting layers or enabling edit mode:", e);
        return false;
      }
    }
  } catch (e) {
    console.error("Error in persistently activating edit mode:", e);
  }
  
  return false;
}
