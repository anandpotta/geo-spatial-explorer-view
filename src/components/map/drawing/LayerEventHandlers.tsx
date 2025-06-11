
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { canUserInteractWithDrawing } from './handlers/UserAuthUtils';
import { createGlobalHandler } from './handlers/GlobalHandlerManager';
import { setupLayerClickHandlers } from './handlers/LayerEventSetup';
import { setupSvgPathAttributes, retrySetupWithDelays } from './handlers/SvgPathSetup';

/**
 * Main orchestrator function that sets up all drawing layer interactions
 */
export const setupDrawingLayerHandlers = (
  layer: L.Layer, 
  drawing: DrawingData,
  isMounted: boolean,
  onRegionClick?: (drawing: DrawingData) => void
): void => {
  if (!layer || !isMounted || !onRegionClick) {
    console.log('Layer click handler setup skipped:', { layer: !!layer, isMounted, onRegionClick: !!onRegionClick });
    return;
  }
  
  // Check if user can interact with this drawing
  if (!canUserInteractWithDrawing(drawing)) {
    return;
  }
  
  console.log(`=== SETTING UP CLICK HANDLER for drawing: ${drawing.id} ===`);
  
  // Create global handler for this drawing
  const globalHandlerName = createGlobalHandler(drawing, isMounted, onRegionClick);
  
  // Set up layer click handlers
  setupLayerClickHandlers(layer, drawing, isMounted, onRegionClick);
  
  // Try to set up SVG path attributes immediately
  const immediate = setupSvgPathAttributes(layer, drawing, globalHandlerName);
  
  // If immediate setup failed, retry with delays
  if (!immediate) {
    console.log(`Immediate SVG setup failed for drawing: ${drawing.id}, setting up retries`);
    retrySetupWithDelays(layer, drawing, globalHandlerName);
  }
  
  console.log(`=== CLICK HANDLER SETUP COMPLETE for drawing: ${drawing.id} ===`);
};
