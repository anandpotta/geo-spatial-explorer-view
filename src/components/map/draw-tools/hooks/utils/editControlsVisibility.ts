
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
      
      // Make sure all buttons inside are visible and properly sized
      const buttons = editControlContainer.querySelectorAll('a');
      buttons.forEach(button => {
        (button as HTMLElement).style.display = 'inline-block';
        (button as HTMLElement).style.visibility = 'visible';
        (button as HTMLElement).style.opacity = '1';
      });
      
      // Ensure toolbar is visible
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
};

/**
 * Ensures image controls are always visible
 */
export const ensureImageControlsVisibility = () => {
  document.querySelectorAll('.image-controls-wrapper').forEach((el) => {
    (el as HTMLElement).style.opacity = '1';
    (el as HTMLElement).style.visibility = 'visible';
    (el as HTMLElement).style.display = 'block';
    (el as HTMLElement).style.pointerEvents = 'auto';
  });
};
