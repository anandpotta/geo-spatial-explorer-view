
/**
 * Utility function to ensure edit controls are visible
 */

/**
 * Ensures edit controls are visible by directly manipulating the DOM
 */
export function ensureEditControlsVisibility(): boolean {
  // Clear any existing visibility timeout
  if (window._controlsVisibilityTimeout) {
    clearTimeout(window._controlsVisibilityTimeout);
  }
  
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
    
    // Set up a delayed check to ensure visibility persists
    window._controlsVisibilityTimeout = window.setTimeout(() => {
      ensureEditControlsVisibility();
    }, 1000);
    
    return found;
  } catch (err) {
    console.error('Error ensuring edit controls visibility:', err);
    return false;
  }
}
