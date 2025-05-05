
/**
 * Utility functions to manage edit controls visibility
 */

/**
 * Ensures edit controls are always visible with correct positioning and styling
 */
export const ensureEditControlsVisibility = () => {
  try {
    // Find the edit control container
    const editControlContainer = document.querySelector('.leaflet-draw.leaflet-control') as HTMLElement;
    if (editControlContainer) {
      // Set width and position as requested
      editControlContainer.style.width = '30px';
      editControlContainer.style.top = '50px'; 
      editControlContainer.style.display = 'block';
      editControlContainer.style.visibility = 'visible';
      editControlContainer.style.opacity = '1';
      editControlContainer.style.pointerEvents = 'auto';
      editControlContainer.style.zIndex = '9999';
      editControlContainer.style.position = 'absolute'; // Ensure absolute positioning
      
      // Force inline styles to take precedence
      editControlContainer.setAttribute('style', `
        width: 30px !important;
        top: 50px !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        z-index: 9999 !important;
        position: absolute !important;
      `);
      
      // Make sure all buttons inside are visible and properly sized
      const buttons = editControlContainer.querySelectorAll('a');
      buttons.forEach(button => {
        (button as HTMLElement).style.display = 'inline-block';
        (button as HTMLElement).style.visibility = 'visible';
        (button as HTMLElement).style.opacity = '1';
        
        // Force inline styles
        (button as HTMLElement).setAttribute('style', `
          display: inline-block !important;
          visibility: visible !important;
          opacity: 1 !important;
        `);
      });
      
      // Ensure toolbar is visible
      const toolbar = editControlContainer.querySelector('.leaflet-draw-toolbar') as HTMLElement;
      if (toolbar) {
        toolbar.style.display = 'block';
        toolbar.style.visibility = 'visible';
        toolbar.style.opacity = '1';
        
        // Force inline styles
        toolbar.setAttribute('style', `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        `);
      }
      
      // Make edit and delete buttons specifically visible
      const editEditBtn = editControlContainer.querySelector('.leaflet-draw-edit-edit') as HTMLElement;
      if (editEditBtn) {
        editEditBtn.style.display = 'inline-block';
        editEditBtn.style.visibility = 'visible';
        editEditBtn.style.opacity = '1';
        
        // Force inline styles
        editEditBtn.setAttribute('style', `
          display: inline-block !important;
          visibility: visible !important;
          opacity: 1 !important;
        `);
      }
      
      const editDeleteBtn = editControlContainer.querySelector('.leaflet-draw-edit-remove') as HTMLElement;
      if (editDeleteBtn) {
        editDeleteBtn.style.display = 'inline-block';
        editDeleteBtn.style.visibility = 'visible';
        editDeleteBtn.style.opacity = '1';
        
        // Force inline styles
        editDeleteBtn.setAttribute('style', `
          display: inline-block !important;
          visibility: visible !important;
          opacity: 1 !important;
        `);
      }
      
      // Also check parent container visibility
      const leafletControlContainer = document.querySelector('.leaflet-control-container') as HTMLElement;
      if (leafletControlContainer) {
        leafletControlContainer.style.display = 'block';
        leafletControlContainer.style.visibility = 'visible';
        leafletControlContainer.style.zIndex = '9000';
      }
    } else {
      console.log('Edit control container not found in DOM');
    }
  } catch (err) {
    console.error('Error ensuring edit controls visibility:', err);
  }
};

/**
 * Ensures image controls are always visible
 */
export const ensureImageControlsVisibility = () => {
  try {
    document.querySelectorAll('.image-controls-wrapper').forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.visibility = 'visible';
      (el as HTMLElement).style.display = 'block';
      (el as HTMLElement).style.pointerEvents = 'auto';
      
      // Force inline styles
      (el as HTMLElement).setAttribute('style', `
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        pointer-events: auto !important;
      `);
    });
  } catch (err) {
    console.error('Error ensuring image controls visibility:', err);
  }
};
