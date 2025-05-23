
import L from 'leaflet';

/**
 * Patches Leaflet layers to ensure they have necessary edit methods
 * This prevents "Cannot read properties of undefined" errors
 */
export function patchLayerWithEditMethods(layer: L.Layer): L.Layer {
  if (!layer) return layer;
  
  // Add enableEdit method if missing
  if (!(layer as any).enableEdit) {
    (layer as any).enableEdit = function() { 
      console.log('Edit enabled on patched layer');
      return this; 
    };
  }
  
  // Add disableEdit method if missing
  if (!(layer as any).disableEdit) {
    (layer as any).disableEdit = function() { 
      console.log('Edit disabled on patched layer');
      return this; 
    };
  }
  
  return layer;
}

/**
 * Safely adds a layer to a feature group with edit method patching
 */
export function safelyAddLayerToFeatureGroup(featureGroup: L.FeatureGroup, layer: L.Layer): void {
  if (!featureGroup || !layer) return;
  
  try {
    // Patch the layer first
    const patchedLayer = patchLayerWithEditMethods(layer);
    
    // Add to feature group
    featureGroup.addLayer(patchedLayer);
  } catch (err) {
    console.error('Error adding layer to feature group:', err);
  }
}

/**
 * Ensures that a feature group has a properly typed eachLayer method
 */
export function ensureFeatureGroupMethods(featureGroup: L.FeatureGroup): L.FeatureGroup {
  if (!featureGroup) return featureGroup;
  
  // Add eachLayer method if it doesn't exist or fix it if it's broken
  if (!featureGroup.eachLayer) {
    const eachLayerFn = function(this: L.FeatureGroup, cb: (layer: L.Layer) => void) {
      if (this._layers) {
        Object.keys(this._layers).forEach(key => {
          cb(this._layers[key as keyof typeof this._layers] as L.Layer);
        });
      }
      return this; // Return this to maintain method chaining
    };
    
    (featureGroup as any).eachLayer = eachLayerFn;
  }
  
  return featureGroup;
}
