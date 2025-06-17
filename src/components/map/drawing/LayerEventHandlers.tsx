
import React from 'react';
import { DrawingData } from '@/utils/drawing-utils';

/**
 * Sets up click handlers for drawing layers with better timing
 */
export const setupLayerClickHandlers = (
  layer: any,
  drawing: DrawingData,
  isMounted: boolean,
  onRegionClick: (drawing: DrawingData) => void
): void => {
  if (!layer || !drawing || !isMounted) {
    console.log('❌ LayerEventHandlers: Invalid setup parameters');
    return;
  }

  console.log(`🔧 LayerEventHandlers: Setting up click handlers for drawing ${drawing.id}`);

  // Initialize global handlers map if needed
  if (!(window as any).drawingClickHandlers) {
    console.log('🔧 LayerEventHandlers: Initializing global handlers map');
    (window as any).drawingClickHandlers = new Map();
  }

  // Store the handler in global map for path click handling
  const handlers = (window as any).drawingClickHandlers;
  handlers.set(drawing.id, {
    drawing,
    onRegionClick
  });

  console.log(`✅ LayerEventHandlers: Stored handler for drawing ${drawing.id}`, {
    mapSize: handlers.size,
    drawingId: drawing.id,
    hasOnRegionClick: typeof onRegionClick === 'function'
  });

  // Set up layer-level click handler as fallback
  if (layer.on && typeof layer.on === 'function') {
    console.log(`🎯 LayerEventHandlers: Setting up layer click handler for ${drawing.id}`);
    
    const layerClickHandler = (e: any) => {
      console.log(`🖱️ LayerEventHandlers: Layer click detected for ${drawing.id}`);
      
      if (e.originalEvent) {
        e.originalEvent.__handledByLayer = true;
      }
      
      try {
        onRegionClick(drawing);
        console.log(`✅ LayerEventHandlers: Successfully called onRegionClick for ${drawing.id}`);
      } catch (err) {
        console.error(`❌ LayerEventHandlers: Error calling onRegionClick for ${drawing.id}:`, err);
      }
    };
    
    layer.on('click', layerClickHandler);
    console.log(`✅ LayerEventHandlers: Layer click handler attached for ${drawing.id}`);
  } else {
    console.warn(`⚠️ LayerEventHandlers: Layer does not support event handlers for ${drawing.id}`);
  }

  // Ensure path-level handlers are set up with a delay to allow DOM rendering
  setTimeout(() => {
    setupPathLevelHandlers(drawing.id, drawing, onRegionClick);
  }, 200);
};

/**
 * Sets up path-level click handlers directly on SVG elements
 */
const setupPathLevelHandlers = (
  drawingId: string,
  drawing: DrawingData,
  onRegionClick: (drawing: DrawingData) => void
): void => {
  console.log(`🎯 LayerEventHandlers: Setting up path-level handlers for ${drawingId}`);

  const findAndSetupPath = () => {
    // Try multiple selectors to find the path
    const selectors = [
      `path[data-drawing-id="${drawingId}"]`,
      `#drawing-path-${drawingId}`,
      `path[data-path-uid*="${drawingId}"]`
    ];

    for (const selector of selectors) {
      const pathElement = document.querySelector(selector) as SVGPathElement;
      if (pathElement) {
        console.log(`✅ LayerEventHandlers: Found path via ${selector} for ${drawingId}`);
        
        // Remove any existing click handlers to prevent duplicates
        const existingHandler = (pathElement as any).__clickHandler;
        if (existingHandler) {
          pathElement.removeEventListener('click', existingHandler);
        }

        // Create new click handler
        const clickHandler = (event: Event) => {
          console.log(`🖱️ LayerEventHandlers: Path click handler triggered for ${drawingId}`);
          event.stopPropagation();
          event.preventDefault();
          
          try {
            onRegionClick(drawing);
            console.log(`✅ LayerEventHandlers: Path click handler success for ${drawingId}`);
          } catch (err) {
            console.error(`❌ LayerEventHandlers: Path click handler error for ${drawingId}:`, err);
          }
        };

        // Store reference to handler for cleanup
        (pathElement as any).__clickHandler = clickHandler;
        
        // Add the click handler
        pathElement.addEventListener('click', clickHandler, true);
        
        console.log(`✅ LayerEventHandlers: Path click handler attached for ${drawingId}`);
        return true;
      }
    }
    
    return false;
  };

  // Try immediately
  if (!findAndSetupPath()) {
    // Retry with delays if not found immediately
    const retryDelays = [500, 1000, 2000];
    retryDelays.forEach((delay) => {
      setTimeout(() => {
        if (!findAndSetupPath()) {
          console.log(`⏰ LayerEventHandlers: Path setup retry ${delay}ms failed for ${drawingId}`);
        }
      }, delay);
    });
  }
};

/**
 * Clean up handlers for a specific drawing
 */
export const cleanupLayerHandlers = (drawingId: string): void => {
  console.log(`🧹 LayerEventHandlers: Cleaning up handlers for ${drawingId}`);

  // Remove from global handlers map
  if ((window as any).drawingClickHandlers) {
    (window as any).drawingClickHandlers.delete(drawingId);
  }

  // Remove path-level handlers
  const pathElement = document.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
  if (pathElement) {
    const existingHandler = (pathElement as any).__clickHandler;
    if (existingHandler) {
      pathElement.removeEventListener('click', existingHandler);
      delete (pathElement as any).__clickHandler;
    }
  }
};
