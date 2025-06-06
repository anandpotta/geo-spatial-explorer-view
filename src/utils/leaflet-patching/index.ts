
import { patchEditToolbar, patchDeleteToolbar } from './toolbar-patches';
import { patchDrawingTools } from './draw-patches';

/**
 * Apply all patches to leaflet-draw to fix known issues
 */
export const applyLeafletDrawPatches = () => {
  try {
    // Apply toolbar patches
    patchEditToolbar();
    patchDeleteToolbar();
    
    // Apply drawing tool patches
    patchDrawingTools();
  } catch (error) {
    console.error('Failed to apply Leaflet Draw patches:', error);
  }
};

// Re-export utilities that might be needed elsewhere
export { patchLayerForEdit, patchFeatureGroupLayers } from './layer-patches';
export { patchEditToolbar, patchDeleteToolbar } from './toolbar-patches';
export { patchDrawingTools } from './draw-patches';
