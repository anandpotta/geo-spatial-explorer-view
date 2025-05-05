
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
      '.leaflet-control-draw',
      '.leaflet-top.leaflet-right .leaflet-control' // More general selector
    ];
    
    let found = false;
    
    // Try each selector
    for (const selector of editControlSelectors) {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(editControlContainer => {
        if (!(editControlContainer instanceof HTMLElement)) return;
        
        // Unhide parent containers if any
        let parent = editControlContainer.parentElement;
        while (parent) {
          if (parent instanceof HTMLElement) {
            parent.style.cssText = `
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              pointer-events: auto !important;
              z-index: 9999 !important;
            `;
          }
          parent = parent.parentElement;
        }
        
        // Force visibility with !important styles
        editControlContainer.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          z-index: 9999 !important;
          position: absolute !important;
          top: 50px !important;
          right: 10px !important;
          width: 30px !important;
        `;
        
        // Make all children visible
        Array.from(editControlContainer.querySelectorAll('*')).forEach(child => {
          if (child instanceof HTMLElement) {
            child.style.cssText = `
              visibility: visible !important;
              opacity: 1 !important;
              pointer-events: auto !important;
            `;
            
            // Special handling for specific elements
            if (child.classList.contains('leaflet-draw-toolbar') || 
                child.classList.contains('leaflet-draw-edit-toolbar')) {
              child.style.cssText += `
                display: block !important;
                background-color: white !important;
                border: 2px solid rgba(0,0,0,0.2) !important;
                box-shadow: 0 1px 5px rgba(0,0,0,0.4) !important;
              `;
            }
            
            // Fix buttons specifically
            if (child.tagName.toLowerCase() === 'a') {
              child.style.cssText += `
                display: inline-block !important;
                background-color: white !important;
                width: 26px !important;
                height: 26px !important;
                line-height: 26px !important;
                text-align: center !important;
                text-decoration: none !important;
              `;
            }
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
              background-color: white !important;
              box-shadow: 0 1px 5px rgba(0,0,0,0.4) !important;
              border-radius: 4px !important;
              border: 2px solid rgba(0,0,0,0.2) !important;
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
              background-color: white !important;
              width: 26px !important;
              height: 26px !important;
            `;
          }
        });
        
        found = true;
      });
    }
    
    // Force visibility of the entire Leaflet container
    const map = document.querySelector('.leaflet-container') as HTMLElement;
    if (map) {
      const controls = map.querySelectorAll('.leaflet-control-container, .leaflet-top, .leaflet-right');
      controls.forEach(control => {
        if (control instanceof HTMLElement) {
          control.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            z-index: 1000 !important;
            position: absolute !important;
          `;
        }
      });
    }
    
    // Always maintain visibility with a more aggressive approach
    window._controlsVisibilityTimeout = window.setTimeout(() => {
      ensureEditControlsVisibility();
    }, 300); // More frequent checks
    
    // If we didn't find any controls but map exists, try to force their creation
    if (!found && map) {
      console.log('Controls not found, attempting to force Leaflet to redraw controls');
      // Dispatch custom event to indicate controls need to be shown
      window.dispatchEvent(new CustomEvent('force-show-leaflet-controls'));
    }
    
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
          
          // Ensure edit controls are visible after activation
          setTimeout(() => ensureEditControlsVisibility(), 100);
          
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
