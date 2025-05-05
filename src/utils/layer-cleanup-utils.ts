
import L from 'leaflet';
import { safelyUnmountRoot } from './react-root-utils';

/**
 * Clean up layers and React roots with proper error handling
 */
export const cleanupLayers = (
  featureGroup: L.FeatureGroup | null, 
  removeButtonRoots: Map<string, any>,
  uploadButtonRoots: Map<string, any>,
  imageControlsRoots: Map<string, any>,
  layersRef: Map<string, L.Layer>
) => {
  // Safely unmount all React roots
  removeButtonRoots.forEach(root => {
    safelyUnmountRoot(root);
  });
  removeButtonRoots.clear();
  
  uploadButtonRoots.forEach(root => {
    safelyUnmountRoot(root);
  });
  uploadButtonRoots.clear();
  
  imageControlsRoots.forEach(root => {
    safelyUnmountRoot(root);
  });
  imageControlsRoots.clear();
  
  // Clear layers reference
  layersRef.clear();
  
  // Safely clear feature group if it exists and has the method
  if (featureGroup && featureGroup.clearLayers && typeof featureGroup.clearLayers === 'function') {
    try {
      featureGroup.clearLayers();
    } catch (err) {
      console.error('Error clearing feature group layers:', err);
    }
  }
};
