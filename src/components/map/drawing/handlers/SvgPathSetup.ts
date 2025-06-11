
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';

/**
 * Sets up SVG path attributes and DOM click handlers
 */
export const setupSvgPathAttributes = (
  layer: L.Layer,
  drawing: DrawingData,
  globalHandlerName: string
): boolean => {
  console.log(`=== SETTING UP SVG PATH ATTRIBUTES for drawing: ${drawing.id} ===`);
  
  // Get the layer's DOM element with improved detection
  let pathElement: Element | null = null;
  
  // Function to search for path elements more thoroughly
  const findPathElement = (searchLayer: L.Layer): Element | null => {
    // Check if the layer has a direct path element
    if ((searchLayer as any)._path) {
      const pathEl = (searchLayer as any)._path;
      if (pathEl && pathEl.tagName && (pathEl.tagName.toLowerCase() === 'path')) {
        console.log(`Found path element via layer._path for drawing: ${drawing.id}`);
        return pathEl;
      }
    }
    
    // Check if the layer has a container with path elements
    if ((searchLayer as any)._container) {
      const container = (searchLayer as any)._container;
      const pathEl = container.querySelector('path');
      if (pathEl) {
        console.log(`Found path element via container query for drawing: ${drawing.id}`);
        return pathEl;
      }
    }
    
    // Check if the layer has a renderer with path elements
    if ((searchLayer as any)._renderer && (searchLayer as any)._renderer._container) {
      const rendererContainer = (searchLayer as any)._renderer._container;
      const pathEl = rendererContainer.querySelector(`path[stroke-linejoin="round"]`);
      if (pathEl) {
        console.log(`Found path element via renderer container for drawing: ${drawing.id}`);
        return pathEl;
      }
    }
    
    return null;
  };
  
  // Try to find the path element
  pathElement = findPathElement(layer);
  
  // If no direct path, search through sub-layers
  if (!pathElement && typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((subLayer: L.Layer) => {
      if (!pathElement) {
        pathElement = findPathElement(subLayer);
      }
    });
  }
  
  // If still no path, try a more aggressive DOM search
  if (!pathElement) {
    // Look for any SVG path elements that might be related to this drawing
    const allPaths = document.querySelectorAll('svg path');
    allPaths.forEach((path) => {
      if (!pathElement) {
        // Check if this path might belong to our drawing by checking its position or attributes
        const existingDrawingId = path.getAttribute('data-drawing-id');
        if (!existingDrawingId) {
          // This might be our new path that hasn't been attributed yet
          pathElement = path;
          console.log(`Found unattributed path element for drawing: ${drawing.id}`);
        }
      }
    });
  }
  
  // If we found a path element, set up the attributes
  if (pathElement) {
    console.log(`=== SETTING ATTRIBUTES ON PATH ELEMENT for drawing: ${drawing.id} ===`);
    
    // Set the required attributes
    pathElement.setAttribute('data-drawing-id', drawing.id);
    pathElement.setAttribute('data-interactive', 'true');
    pathElement.setAttribute('data-global-handler', globalHandlerName);
    
    // Create DOM click handler
    const domClickHandler = (domEvent: Event) => {
      console.log(`=== DOM CLICK on SVG path for drawing: ${drawing.id} ===`);
      domEvent.stopPropagation();
      domEvent.preventDefault();
      domEvent.stopImmediatePropagation();
      
      // Call the global handler
      if ((window as any)[globalHandlerName]) {
        console.log(`=== CALLING GLOBAL HANDLER: ${globalHandlerName} ===`);
        (window as any)[globalHandlerName]();
      } else {
        console.warn(`Global handler ${globalHandlerName} not found on window object`);
      }
    };
    
    // Remove any existing click handlers
    if ((pathElement as any)._drawingClickHandler) {
      pathElement.removeEventListener('click', (pathElement as any)._drawingClickHandler, true);
      pathElement.removeEventListener('click', (pathElement as any)._drawingClickHandler, false);
    }
    
    // Add the new click handler with proper event capture
    pathElement.addEventListener('click', domClickHandler, { capture: true, passive: false });
    pathElement.addEventListener('click', domClickHandler, { passive: false });
    
    // Store reference for cleanup
    (pathElement as any)._drawingClickHandler = domClickHandler;
    (pathElement as any)._drawingId = drawing.id;
    (pathElement as any)._globalHandlerName = globalHandlerName;
    
    console.log(`=== SUCCESSFULLY SET UP SVG PATH for drawing: ${drawing.id} ===`);
    console.log(`Drawing ID: ${pathElement.getAttribute('data-drawing-id')}`);
    console.log(`Interactive: ${pathElement.getAttribute('data-interactive')}`);
    console.log(`Global Handler: ${pathElement.getAttribute('data-global-handler')}`);
    
    return true;
  } else {
    console.warn(`Could not find SVG path element for drawing: ${drawing.id}`);
    return false;
  }
};

/**
 * Retries SVG path setup with delays and more aggressive searches
 */
export const retrySetupWithDelays = (
  layer: L.Layer,
  drawing: DrawingData,
  globalHandlerName: string
): void => {
  console.log(`Setting up retries for SVG setup for drawing: ${drawing.id}`);
  
  const retryDelays = [100, 300, 500, 1000, 2000, 3000];
  let successfulSetup = false;
  
  retryDelays.forEach((delay, index) => {
    setTimeout(() => {
      if (!successfulSetup) {
        const success = setupSvgPathAttributes(layer, drawing, globalHandlerName);
        if (success) {
          console.log(`SVG setup succeeded on retry ${index + 1} for drawing: ${drawing.id}`);
          successfulSetup = true;
        } else if (index === retryDelays.length - 1) {
          console.warn(`All SVG setup retries failed for drawing: ${drawing.id}`);
          // Last resort: try to find any unattributed paths and set them up
          setTimeout(() => {
            const allPaths = document.querySelectorAll('svg path:not([data-drawing-id])');
            if (allPaths.length > 0) {
              console.log(`Found ${allPaths.length} unattributed paths, attempting to attribute the first one to drawing: ${drawing.id}`);
              const pathElement = allPaths[0];
              pathElement.setAttribute('data-drawing-id', drawing.id);
              pathElement.setAttribute('data-interactive', 'true');
              pathElement.setAttribute('data-global-handler', globalHandlerName);
            }
          }, 1000);
        }
      }
    }, delay);
  });
};
