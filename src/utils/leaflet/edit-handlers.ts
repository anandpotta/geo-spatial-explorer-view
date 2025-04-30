
import L from 'leaflet';
import { getMapFromLayer } from './map-validation';

// Define a safe handler interface for type checking
interface SafeHandler {
  disable?: () => void;
  dispose?: () => void;
}

/**
 * Safely enables edit mode for a layer
 * @param layer The layer to enable edit mode for
 * @returns Whether edit mode was successfully enabled
 */
export const safelyEnableEditForLayer = (layer: any): boolean => {
  if (!layer) return false;
  
  try {
    // First check if the layer even has editing capabilities
    if (!layer.editing) {
      // Try to set up basic editing if missing
      if (layer.options && typeof layer.options === 'object') {
        layer.options.editing = { enable: () => {}, disable: () => {} };
      }
      return false;
    }
    
    // For newer Leaflet versions
    if (layer.editing.enable && typeof layer.editing.enable === 'function') {
      try {
        layer.editing.enable();
        return true;
      } catch (err) {
        console.error('Error enabling edit mode for layer:', err);
      }
    }
    
    // For older versions or react-leaflet-draw
    if (layer.enableEdit && typeof layer.enableEdit === 'function') {
      try {
        layer.enableEdit();
        return true;
      } catch (err) {
        console.error('Error enabling edit mode (enableEdit) for layer:', err);
      }
    }
  } catch (err) {
    console.error('Error checking edit capabilities for layer:', err);
  }
  
  return false;
};

/**
 * Safely disables edit mode for a layer with comprehensive error handling
 * @param layer The layer to disable edit mode for
 * @returns Whether edit mode was successfully disabled
 */
export const safelyDisableEditForLayer = (layer: any): boolean => {
  if (!layer) return false;
  
  try {
    // Make sure editing exists
    if (!layer.editing) {
      return false;
    }
    
    // Clear all problematic references first
    try {
      // These properties often cause the "Cannot read properties of undefined" errors
      if (layer.editing._poly) layer.editing._poly = null;
      if (layer.editing._shape) layer.editing._shape = null;
      if (layer.editing._guides) layer.editing._guides = [];
      
      // Handle problematic dispose methods
      if (layer.editing._verticesHandlers) {
        for (const handler of Object.values(layer.editing._verticesHandlers || {})) {
          try {
            // Type safety check before accessing disable method
            const typedHandler = handler as SafeHandler;
            
            // First ensure methods exist before calling them
            if (!typedHandler) continue;
            
            // Add missing methods to prevent errors
            if (!typedHandler.dispose) {
              typedHandler.dispose = function() {};
            }
            
            if (!typedHandler.disable) {
              typedHandler.disable = function() {};
            }
            
            // Now safely call methods
            if (typedHandler && typeof typedHandler.disable === 'function') {
              typedHandler.disable();
            }
          } catch (e) {
            console.warn("Error disabling vertex handler:", e);
          }
          
          try {
            // Type safety check before accessing dispose method
            const typedHandler = handler as SafeHandler;
            if (typedHandler && typeof typedHandler.dispose === 'function') {
              typedHandler.dispose();
            }
          } catch (e) {
            console.warn("Error disposing vertex handler:", e);
          }
        }
        layer.editing._verticesHandlers = null;
      }
      
      // Safely handle marker groups
      if (layer.editing._markerGroup) {
        try {
          // Try to properly remove the marker group
          const map = getMapFromLayer(layer);
          if (map && layer.editing._markerGroup) {
            layer.editing._markerGroup.clearLayers();
            if (layer.editing._markerGroup.remove) {
              layer.editing._markerGroup.remove();
            }
          }
          layer.editing._markerGroup = null;
        } catch (e) {
          console.warn("Error cleaning up marker group:", e);
        }
      }
    } catch (e) {
      console.warn("Error clearing edit properties:", e);
    }
    
    // Now try to properly disable editing
    try {
      // For newer Leaflet versions
      if (layer.editing.disable && typeof layer.editing.disable === 'function') {
        try {
          layer.editing.disable();
          return true;
        } catch (err) {
          console.error('Error disabling edit mode for layer:', err);
        }
      }
      
      // For older versions or react-leaflet-draw
      if (layer.disableEdit && typeof layer.disableEdit === 'function') {
        try {
          layer.disableEdit();
          return true;
        } catch (err) {
          console.error('Error disabling edit mode (disableEdit) for layer:', err);
        }
      }
      
      // Last resort: just replace the editing object altogether with safe methods
      layer.editing = {
        enable: function() {},
        disable: function() {},
        dispose: function() {},  // Add dispose method to prevent "reading 'dispose'" error
        _verticesHandlers: null, // Clear problematic references
        _markerGroup: null
      };
      
      return true;
    } catch (err) {
      console.error('Error disabling edit for layer:', err);
      
      // If all else fails, try to replace the editing object
      try {
        layer.editing = {
          enable: function() {},
          disable: function() {},
          dispose: function() {},  // Add dispose method to prevent "reading 'dispose'" error
          _verticesHandlers: null,
          _markerGroup: null
        };
      } catch (e) {
        console.error("Couldn't even replace editing object:", e);
      }
    }
  } catch (err) {
    console.error('Error checking edit capabilities for layer:', err);
  }
  
  return false;
};
