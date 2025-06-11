
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
  
  // Get the layer's DOM element
  let pathElement: Element | null = null;
  
  // Check if the layer has a direct path element
  if ((layer as any)._path) {
    pathElement = (layer as any)._path;
    console.log(`Found path element via layer._path for drawing: ${drawing.id}`);
  }
  
  // If no direct path, try to find it through the container
  if (!pathElement && (layer as any)._container) {
    const container = (layer as any)._container;
    pathElement = container.querySelector('path');
    if (pathElement) {
      console.log(`Found path element via container query for drawing: ${drawing.id}`);
    }
  }
  
  // If still no path, search through sub-layers
  if (!pathElement && typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((subLayer: L.Layer) => {
      if (!pathElement) {
        if ((subLayer as any)._path) {
          pathElement = (subLayer as any)._path;
          console.log(`Found path element via sublayer._path for drawing: ${drawing.id}`);
        } else if ((subLayer as any)._container) {
          const subContainer = (subLayer as any)._container;
          const foundPath = subContainer.querySelector('path');
          if (foundPath) {
            pathElement = foundPath;
            console.log(`Found path element via sublayer container for drawing: ${drawing.id}`);
          }
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
        (window as any)[globalHandlerName]();
      }
    };
    
    // Remove any existing click handlers
    if ((pathElement as any)._drawingClickHandler) {
      pathElement.removeEventListener('click', (pathElement as any)._drawingClickHandler, true);
      pathElement.removeEventListener('click', (pathElement as any)._drawingClickHandler, false);
    }
    
    // Add the new click handler
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
 * Retries SVG path setup with delays
 */
export const retrySetupWithDelays = (
  layer: L.Layer,
  drawing: DrawingData,
  globalHandlerName: string
): void => {
  console.log(`Setting up retries for SVG setup for drawing: ${drawing.id}`);
  
  const retryDelays = [100, 300, 500, 1000, 2000];
  retryDelays.forEach((delay, index) => {
    setTimeout(() => {
      const success = setupSvgPathAttributes(layer, drawing, globalHandlerName);
      if (success) {
        console.log(`SVG setup succeeded on retry ${index + 1} for drawing: ${drawing.id}`);
      } else if (index === retryDelays.length - 1) {
        console.warn(`All SVG setup retries failed for drawing: ${drawing.id}`);
      }
    }, delay);
  });
};
