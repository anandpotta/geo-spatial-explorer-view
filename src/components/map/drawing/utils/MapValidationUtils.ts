
import L from 'leaflet';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';

/**
 * Validates that a layer has a valid map attached
 */
export const validateLayerMap = (featureGroup: L.FeatureGroup): boolean => {
  try {
    const map = getMapFromLayer(featureGroup);
    if (!isMapValid(map)) {
      console.warn("Map container is not valid, skipping layer controls");
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error validating map for layer controls:', err);
    return false;
  }
};

/**
 * Validates that an SVG path exists on a layer
 */
export const validateSvgPath = (layer: L.Layer): boolean => {
  try {
    if (!layer) return false;
    
    if ((layer as any)._path) {
      const path = (layer as any)._path;
      const pathData = path.getAttribute('d');
      return !!pathData;
    }
    
    // For feature groups, check each layer
    if (typeof (layer as any).eachLayer === 'function') {
      let hasPath = false;
      (layer as any).eachLayer((subLayer: any) => {
        if (subLayer._path) {
          const pathData = subLayer._path.getAttribute('d');
          if (pathData) {
            hasPath = true;
          }
        }
      });
      return hasPath;
    }
    
    return false;
  } catch (err) {
    console.error('Error validating SVG path:', err);
    return false;
  }
};
