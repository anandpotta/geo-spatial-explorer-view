
/**
 * Utility function to ensure edit controls are visible
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
