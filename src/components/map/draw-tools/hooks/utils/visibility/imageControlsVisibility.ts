
/**
 * Utility function to ensure image controls are visible
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
