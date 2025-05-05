
import L from 'leaflet';

export const getMapFromLayer = (layer: any): L.Map | null => {
  try {
    if (!layer) return null;
    
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
  try {
    if (!map) return false;
    
    // Check if map has required properties and methods
    // Use type assertion for internal Leaflet properties
    if (!(map as any)._loaded) return false;
    
    // Check if map container exists and is in the DOM
    if (!map.getContainer) return false;
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
    // Check if the layer has editing capabilities
    if (layer.editing) {
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
    }
  } catch (err) {
    console.error('Error checking edit capabilities for layer:', err);
  }
  
  return false;
};

// Add a function to safely disable editing
export const safelyDisableEditForLayer = (layer: any): boolean => {
  if (!layer) return false;
  
  try {
    // Check if the layer has editing capabilities
    if (layer.editing) {
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
    }
  } catch (err) {
    console.error('Error checking edit capabilities for layer:', err);
  }
  
  return false;
};
