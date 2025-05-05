
import L from 'leaflet';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';

/**
 * Validates that a feature group is attached to a valid map
 */
export const validateFeatureGroupMap = (featureGroup: L.FeatureGroup): boolean => {
  try {
    const map = getMapFromLayer(featureGroup);
    return isMapValid(map);
  } catch (err) {
    console.error('Error validating map for layer controls:', err);
    return false;
  }
};
