
import { hasFloorPlan as checkFloorPlan } from '@/utils/floor-plan-utils';

// Re-export all functions from the refactored modules
export { prepareLayerOptions, getDefaultDrawingOptions } from './LayerOptionsProvider';
export { createGeoJSONLayer } from './GeoJSONLayerFactory';
export { addDrawingAttributesToLayer } from './LayerAttributeManager';

/**
 * Checks if a drawing has a floor plan
 */
export const hasFloorPlan = checkFloorPlan;
