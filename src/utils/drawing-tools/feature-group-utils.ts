
import L from 'leaflet';

/**
 * Makes the feature group available globally for edit operations
 */
export const makeFeatureGroupGlobal = (featureGroup: L.FeatureGroup | null) => {
  if (featureGroup) {
    // Store the feature group in the window object for global access
    (window as any).featureGroup = featureGroup;
    return () => {
      // Cleanup function to remove the global reference
      delete (window as any).featureGroup;
    };
  }
  return () => {};
};
