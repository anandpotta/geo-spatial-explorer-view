
import L from 'leaflet';
import { getMapFromLayer } from './map-validation';
import { safelyDisableEditForLayer } from './edit-handlers';

/**
 * Helper function to safely cleanup a feature group
 * @param featureGroup The feature group to clean up
 */
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

// Type for safe layer references
export type LeafletLayerInternal = L.Layer & {
  _map?: L.Map;
  _path?: SVGPathElement;
  editing?: any;
};
