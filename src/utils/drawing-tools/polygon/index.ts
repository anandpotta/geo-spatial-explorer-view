
import { optimizePolygonDrawing } from './polygon-optimization';
import { setupEditHandlers } from './edit-handlers';
import { enhancePolygonMarkers } from './marker-enhancements';
import { configurePolygonHandlers } from './polygon-handlers';
import { configureShapeRenderers } from './shape-renderers';
import { enhancePolygonGuidelines } from './guideline-utils';

/**
 * Configures additional drawing tools
 */
export const configureDrawingTools = (): () => void => {
  const cleanupFunctions: Array<() => void> = [];
  
  // Add all individual cleanup functions
  cleanupFunctions.push(enhancePolygonMarkers());
  cleanupFunctions.push(configurePolygonHandlers());
  cleanupFunctions.push(configureShapeRenderers());
  cleanupFunctions.push(enhancePolygonGuidelines());
  
  // Return a single cleanup function that calls all individual cleanups
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
};

// Re-export all polygon utility functions
export {
  optimizePolygonDrawing,
  setupEditHandlers
};
