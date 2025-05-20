
import { useEffect } from 'react';
import L from 'leaflet';

/**
 * Custom hook to override the default behavior of the remove button in leaflet-draw
 */
export function useOverrideRemoveButton(
  featureGroup: L.FeatureGroup | null, 
  handleRemoveButtonClick: () => void
) {
  useEffect(() => {
    if (!featureGroup) return;

    // Function to override the default remove button behavior
    const overrideRemoveButtonBehavior = () => {
      // Target the delete handler button once it's available in the DOM
      const removeBtn = document.querySelector('.leaflet-draw-edit-remove');
      
      if (removeBtn) {
        // Remove existing listeners and add our custom one
        const newBtn = removeBtn.cloneNode(true);
        if (removeBtn.parentNode) {
          removeBtn.parentNode.replaceChild(newBtn, removeBtn);
        }
        
        newBtn.addEventListener('click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          
          handleRemoveButtonClick();
        });
      }
    };
    
    // Set up a mutation observer to detect when the edit controls are added to the DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          if (document.querySelector('.leaflet-draw-edit-remove')) {
            overrideRemoveButtonBehavior();
            break;
          }
        }
      }
    });
    
    // Start observing the document body for added nodes
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Also try immediately in case the button already exists
    setTimeout(overrideRemoveButtonBehavior, 500);
    
    return () => {
      observer.disconnect();
    };
  }, [featureGroup, handleRemoveButtonClick]);
}
