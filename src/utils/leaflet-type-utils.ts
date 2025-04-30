
import L from 'leaflet';

// Define interface for internal map properties not exposed in TypeScript definitions
interface LeafletMapInternal extends L.Map {
  _loaded?: boolean;
  _container?: HTMLElement;
}

// Using type intersection for LeafletLayerInternal instead of interface extension
type LeafletLayerInternal = L.Layer & {
  _map?: L.Map;
  _path?: SVGPathElement;
  editing?: any;
};

// Define a safe handler interface for type checking
interface SafeHandler {
  disable?: () => void;
  dispose?: () => void;
}

export const getMapFromLayer = (layer: any): L.Map | null => {
  if (!layer) return null;
  
  try {
    // First check if layer has _map property directly
    if (layer._map) return layer._map;
    
    // Check if layer has getMap method
    if (layer.getMap && typeof layer.getMap === 'function') {
      return layer.getMap();
    }
    
    // Try to access map through group
    if (layer._group && layer._group._map) {
      return layer._group._map;
    }
    
    // For feature groups, try to get map from first child layer
    if (layer.getLayers && typeof layer.getLayers === 'function') {
      const layers = layer.getLayers();
      if (layers.length > 0) {
        for (const childLayer of layers) {
          const map = getMapFromLayer(childLayer);
          if (map) return map;
        }
      }
    }
    
    return null;
  } catch (err) {
    console.error('Error accessing map from layer:', err);
    return null;
  }
};

export const isMapValid = (map: L.Map | null): boolean => {
  if (!map) return false;
  
  try {
    // Cast to internal map type to access private properties
    const internalMap = map as LeafletMapInternal;
    
    // Check if map has required properties
    if (!internalMap._loaded) return false;
    
    // Check if map container exists and is in the DOM
    const container = map.getContainer();
    if (!container || !document.body.contains(container)) {
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error validating map:', err);
    return false;
  }
};

// Add a function to safely handle layer edit operations
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

// Enhanced function to safely disable editing, handling the 'dispose' property issue
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

// Helper function to safely cleanup a feature group
export const safelyCleanupFeatureGroup = (featureGroup: L.FeatureGroup | null): void => {
  if (!featureGroup) return;
  
  try {
    // First disable editing on all layers
    featureGroup.eachLayer(layer => {
      safelyDisableEditForLayer(layer);
    });
    
    // Then clear all layers
    try {
      featureGroup.clearLayers();
    } catch (err) {
      console.error('Error clearing layers from feature group:', err);
    }
  } catch (err) {
    console.error('Error cleaning up feature group:', err);
  }
};
