
import L from 'leaflet';
import { toast } from 'sonner';

/**
 * Makes the feature group available globally for edit operations
 */
export const makeFeatureGroupGlobal = (featureGroup: L.FeatureGroup | null) => {
  if (featureGroup) {
    // Store the feature group in the window object for global access
    (window as any).featureGroup = featureGroup;
    
    // Set up enhanced remove handlers
    enhanceFeatureGroupRemoval(featureGroup);
    
    return () => {
      // Cleanup function to remove the global reference
      delete (window as any).featureGroup;
    };
  }
  return () => {};
};

/**
 * Enhances the feature group with better removal capabilities
 */
export const enhanceFeatureGroupRemoval = (featureGroup: L.FeatureGroup) => {
  // Store the original removeLayer method
  const originalRemoveLayer = featureGroup.removeLayer.bind(featureGroup);
  
  // Override the removeLayer method to also clean up associated elements
  featureGroup.removeLayer = function(layer: L.Layer) {
    if (layer) {
      // Get the drawing ID from the layer options
      const drawingId = (layer as any).options?.id;
      
      try {
        if (drawingId) {
          // Remove any associated marker icons
          const markerIcons = document.querySelectorAll(`.leaflet-marker-icon[data-drawing-id="${drawingId}"]`);
          markerIcons.forEach(icon => {
            if (icon && icon.parentNode) {
              icon.parentNode.removeChild(icon);
            }
          });
          
          // Clean up any remaining DOM elements
          const controlElements = document.querySelectorAll(`[data-control-id="${drawingId}"]`);
          controlElements.forEach(element => {
            if (element && element.parentNode) {
              element.parentNode.removeChild(element);
            }
          });
          
          // Trigger event to update SVG paths
          window.dispatchEvent(new CustomEvent('svgPathsUpdated'));
        }
      } catch (err) {
        console.error('Error while cleaning up layer elements:', err);
      }
      
      // Call the original method
      return originalRemoveLayer(layer);
    }
    return this;
  };
};

/**
 * Safely removes a layer from the feature group with confirmation
 */
export const safeRemoveLayer = (
  featureGroup: L.FeatureGroup,
  layer: L.Layer, 
  onConfirm?: () => void
) => {
  if (featureGroup && layer) {
    try {
      featureGroup.removeLayer(layer);
      if (onConfirm) onConfirm();
      toast.success('Shape removed successfully');
    } catch (error) {
      console.error('Error removing layer:', error);
      toast.error('Failed to remove shape');
    }
  }
};
