
import L from 'leaflet';

/**
 * Enhanced layer patching function
 */
export const patchLayerForEdit = (layer: any) => {
  if (!layer) return layer;
  
  // Add enableEdit method if missing
  if (!layer.enableEdit || typeof layer.enableEdit !== 'function') {
    layer.enableEdit = function() { 
      console.log('Edit enabled on layer:', this);
      if (this.editing && this.editing.enable) {
        try {
          this.editing.enable();
        } catch (err) {
          console.warn('Error enabling layer editing:', err);
        }
      }
      return this; 
    };
  }
  
  // Add disableEdit method if missing
  if (!layer.disableEdit || typeof layer.disableEdit !== 'function') {
    layer.disableEdit = function() { 
      console.log('Edit disabled on layer:', this);
      if (this.editing && this.editing.disable) {
        try {
          this.editing.disable();
        } catch (err) {
          console.warn('Error disabling layer editing:', err);
        }
      }
      return this; 
    };
  }
  
  // Add enable method if missing (for toolbar compatibility)
  if (!layer.enable || typeof layer.enable !== 'function') {
    layer.enable = function() { 
      return this.enableEdit();
    };
  }
  
  // Add disable method if missing (for toolbar compatibility)  
  if (!layer.disable || typeof layer.disable !== 'function') {
    layer.disable = function() { 
      return this.disableEdit();
    };
  }
  
  return layer;
};

/**
 * Patches all layers in a feature group to ensure they have edit methods
 */
export const patchFeatureGroupLayers = (featureGroup: any) => {
  if (!featureGroup || !featureGroup.eachLayer) return;
  
  try {
    featureGroup.eachLayer((layer: any) => {
      patchLayerForEdit(layer);
    });
  } catch (err) {
    console.error('Error patching feature group layers:', err);
  }
};
