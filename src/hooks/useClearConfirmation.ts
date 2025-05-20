
import { useState, useEffect } from 'react';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';

export function useClearConfirmation(featureGroup: L.FeatureGroup | null, onClearAll?: () => void) {
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  
  useEffect(() => {
    // Find and override the click handler for the "Clear all layers" option
    const overrideClearAllLayers = () => {
      setTimeout(() => {
        // Find clear all layers button in the DOM
        const clearAllButton = document.querySelector('.leaflet-draw-actions li a[title="Clear all layers"]');
        
        if (clearAllButton) {
          // Remove existing listeners
          const oldButton = clearAllButton.cloneNode(true);
          if (clearAllButton.parentNode) {
            clearAllButton.parentNode.replaceChild(oldButton, clearAllButton);
          }
          
          // Add new click handler
          oldButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Close the leaflet control UI
            const actions = document.querySelector('.leaflet-draw-actions');
            if (actions) {
              actions.classList.add('leaflet-draw-actions-bottom');
              actions.classList.add('hidden');
            }
            
            // Show confirmation dialog
            setIsClearDialogOpen(true);
          });
          
          console.log('Successfully overrode clear all layers button');
        }
      }, 100); // Short delay to ensure DOM elements are available
    };
    
    // Listen for when the remove tools become visible
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const element = mutation.target as HTMLElement;
          if (element.classList.contains('leaflet-draw-actions') && !element.classList.contains('hidden')) {
            overrideClearAllLayers();
          }
        }
      });
    });
    
    // Start observing the document body for the appearance of the leaflet-draw-actions
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleConfirmClear = () => {
    if (featureGroup) {
      handleClearAll({ 
        featureGroup,
        onClearAll
      });
    }
    setIsClearDialogOpen(false);
  };

  return {
    isClearDialogOpen,
    setIsClearDialogOpen,
    handleConfirmClear
  };
}
