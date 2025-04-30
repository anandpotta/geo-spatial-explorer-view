
// Export utility functions from the various leaflet utility files
export * from './edit-handlers';
export * from './layer-handlers';
export * from './map-validation';

import L from 'leaflet';

// Check if a map object is valid
export function isMapValid(map: L.Map | null): boolean {
  return Boolean(
    map && 
    !map.isRemoved && 
    map.getContainer && 
    map.getContainer() && 
    document.body.contains(map.getContainer())
  );
}

// Try to get the map from any layer
export function getMapFromLayer(layer: L.Layer): L.Map | null {
  try {
    // Try multiple paths to get the map reference
    const map = 
      // @ts-ignore - _map is an internal property but commonly used
      layer._map || 
      // @ts-ignore - some layers have getMap
      (typeof layer.getMap === 'function' ? layer.getMap() : null) ||
      // @ts-ignore - for FeatureGroup, try to get map from first layer
      (layer.getLayers && layer.getLayers()[0]?._map);
    
    return map || null;
  } catch (err) {
    console.error('Error getting map from layer:', err);
    return null;
  }
}

// Safely disable edit functionality for a layer
export function safelyDisableEditForLayer(layer: L.Layer): boolean {
  try {
    // Check for various edit-related methods
    if ((layer as any).editing && typeof (layer as any).editing.disable === 'function') {
      (layer as any).editing.disable();
      return true;
    }
    
    // Check for disableEdit method
    if (typeof (layer as any).disableEdit === 'function') {
      (layer as any).disableEdit();
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Error disabling edit for layer:', err);
    return false;
  }
}

// Safely enable edit functionality for a layer
export function safelyEnableEditForLayer(layer: L.Layer): boolean {
  try {
    // Check for various edit-related methods
    if ((layer as any).editing && typeof (layer as any).editing.enable === 'function') {
      (layer as any).editing.enable();
      return true;
    }
    
    // Check for enableEdit method
    if (typeof (layer as any).enableEdit === 'function') {
      (layer as any).enableEdit();
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Error enabling edit for layer:', err);
    return false;
  }
}

// Safely clean up a feature group
export function safelyCleanupFeatureGroup(featureGroup: L.FeatureGroup): void {
  try {
    // First disable editing on all layers
    featureGroup.eachLayer((layer) => {
      safelyDisableEditForLayer(layer);
    });
    
    // Then clear the layers
    featureGroup.clearLayers();
  } catch (err) {
    console.error('Error cleaning up feature group:', err);
  }
}
