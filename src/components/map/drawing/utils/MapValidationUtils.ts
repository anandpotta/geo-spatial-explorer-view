
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
