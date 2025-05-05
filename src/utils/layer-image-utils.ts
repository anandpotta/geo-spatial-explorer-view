
import L from 'leaflet';
import { createImageElement, transformImage, ImageTransformOptions } from '@/utils/image-transform-utils';
import '@/components/map/drawing/DrawingImage.css';

/**
 * Adds an image to a Leaflet layer
 */
export const addImageToLayer = (
  layer: L.Layer,
  drawingId: string,
  imageData: string,
  transformOptions: ImageTransformOptions,
  imageControlsRoots: Map<string, any>,
  onImageTransform?: (drawingId: string, options: Partial<ImageTransformOptions>) => void
) => {
  try {
    console.log(`Adding image to layer for drawing: ${drawingId}`);
    
    // Handle layers without _path property
    if (!(layer as any)._path) {
      console.log(`Layer has no _path property for drawing ${drawingId}, trying to find path in child layers`);
      
      // Check if it's a feature group that might contain multiple layers
      if ((layer as any).eachLayer && typeof (layer as any).eachLayer === 'function') {
        let foundLayer = false;
        (layer as any).eachLayer((childLayer: any) => {
          if (!foundLayer && childLayer._path) {
            console.log('Found child layer with _path, using it instead');
            addImageToLayer(
              childLayer, 
              drawingId, 
              imageData, 
              transformOptions, 
              imageControlsRoots, 
              onImageTransform
            );
            foundLayer = true;
          }
        });
        
        if (foundLayer) {
          return; // Image added to child layer successfully
        }
      }
      
      // If we still can't find a suitable layer, try to use the map container as fallback
      const map = (layer as any)._map;
      if (map && map.getContainer()) {
        console.log('Using map container as fallback for image placement');
        addImageToMapContainer(
          map,
          drawingId,
          imageData,
          transformOptions,
          imageControlsRoots,
          onImageTransform
        );
        return;
      }
      
      console.warn('Could not add image: no suitable layer or container found');
      return;
    }
    
    // Get path element and its parent SVG
    const pathElement = (layer as any)._path as SVGElement;
    const svgElement = pathElement.closest('svg');
    
    if (!svgElement || !pathElement.parentElement) {
      console.warn('Could not find SVG element or path parent');
      return;
    }
    
    // Remove any existing image containers for this drawing
    const existingContainers = document.querySelectorAll(`div[data-drawing-id="${drawingId}"]`);
    existingContainers.forEach(container => {
      if (container.parentElement) {
        container.parentElement.removeChild(container);
      }
    });
    
    // Create container for the image with enhanced styles
    const containerDiv = document.createElement('div');
    containerDiv.className = 'leaflet-drawing-image-container clipped-image-container';
    containerDiv.dataset.drawingId = drawingId;
    
    // Get overlay pane for proper positioning
    const overlayPane = (layer as any)._map.getPanes().overlayPane;
    if (!overlayPane) {
      console.warn('Could not find overlay pane');
      return;
    }
    
    // Append container to the overlay pane
    overlayPane.appendChild(containerDiv);
    
    // Define updatePosition function with improved positioning
    const updatePosition = () => {
      if (!pathElement || !svgElement) return;
      
      try {
        const newPathRect = pathElement.getBoundingClientRect();
        const newSvgRect = svgElement.getBoundingClientRect();
        
        // Account for map offsets and panning
        const map = (layer as any)._map;
        const mapContainer = map.getContainer();
        const mapRect = mapContainer.getBoundingClientRect();
        
        containerDiv.style.left = `${newPathRect.left - mapRect.left}px`;
        containerDiv.style.top = `${newPathRect.top - mapRect.top}px`;
        containerDiv.style.width = `${newPathRect.width}px`;
        containerDiv.style.height = `${newPathRect.height}px`;
      } catch (err) {
        console.error('Error updating position:', err);
      }
    };
    
    // Create and add image element with improved positioning
    const imgElement = createImageElement(imageData, (img) => {
      // Initial positioning
      updatePosition();
      
      // Position image in container with absolute positioning
      img.style.position = 'absolute';
      img.style.left = '50%';
      img.style.top = '50%';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.zIndex = '650'; // Set appropriate z-index
      
      // Apply transformation
      transformImage(img, transformOptions);
    });
    
    containerDiv.appendChild(imgElement);
    
    // Apply clipping mask using SVG path data with improved method
    if (pathElement && pathElement.getAttribute('d')) {
      const pathData = pathElement.getAttribute('d') || '';
      
      // Create a unique ID for the clip path
      const clipPathId = `clip-path-${drawingId}-${Date.now()}`;
      
      // Create or find SVG defs element
      let defs = svgElement.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svgElement.appendChild(defs);
      }
      
      // Remove existing clip path if present
      const existingClipPath = svgElement.querySelector(`#clip-path-${drawingId}`);
      if (existingClipPath && existingClipPath.parentElement) {
        existingClipPath.parentElement.removeChild(existingClipPath);
      }
      
      // Create new clip path
      const clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPathEl.setAttribute('id', clipPathId);
      
      const clipPathShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      clipPathShape.setAttribute('d', pathData);
      clipPathEl.appendChild(clipPathShape);
      defs.appendChild(clipPathEl);
      
      // Apply clip path to image container with correct URL format
      containerDiv.style.clipPath = `url(#${clipPathId})`;
      containerDiv.style.webkitClipPath = `url(#${clipPathId})`;
      
      // Log for debugging
      console.log(`Applied clip path: ${clipPathId} with path data: ${pathData.substring(0, 50)}...`);
    }
    
    // Create image edit controls - always visible
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'leaflet-drawing-image-controls';
    containerDiv.appendChild(controlsContainer);
    
    // Create React root for image controls through a delegate function
    import('@/components/map/drawing/ImageControlsRenderer').then(module => {
      try {
        module.renderImageControls(
          controlsContainer,
          drawingId,
          transformOptions,
          imageControlsRoots,
          (options) => {
            if (onImageTransform) {
              onImageTransform(drawingId, options);
              
              // Also update the display immediately
              transformImage(imgElement, {
                ...transformOptions,
                ...options
              });
            }
          }
        );
      } catch (err) {
        console.error('Error rendering image controls:', err);
      }
    }).catch(err => {
      console.error('Error loading ImageControlsRenderer module:', err);
    });
    
    // Listen for image transform updates
    const handleTransformUpdate = (e: CustomEvent) => {
      const detail = e.detail as { drawingId: string, transformOptions: ImageTransformOptions };
      if (detail.drawingId === drawingId) {
        transformImage(imgElement, detail.transformOptions);
      }
    };
    
    window.addEventListener('image-transform-updated', handleTransformUpdate as EventListener);
    
    // Update position on map events with improved event handling
    const map = (layer as any)._map;
    if (map) {
      map.on('zoom move moveend viewreset zoomend', updatePosition);
      // Initial update
      setTimeout(updatePosition, 100);
      // Additional updates to ensure positioning
      setTimeout(updatePosition, 500);
      setTimeout(updatePosition, 1000);
    }
    
    // Return a cleanup function
    return () => {
      window.removeEventListener('image-transform-updated', handleTransformUpdate as EventListener);
      
      // Remove the container
      if (containerDiv.parentElement) {
        containerDiv.parentElement.removeChild(containerDiv);
      }
      
      // Clean up React root
      const controlsRoot = imageControlsRoots.get(`${drawingId}-image-controls`);
      if (controlsRoot) {
        try {
          controlsRoot.unmount();
        } catch (err) {
          console.error('Error unmounting image controls root:', err);
        }
        imageControlsRoots.delete(`${drawingId}-image-controls`);
      }
      
      // Remove map event listeners
      if (map) {
        map.off('zoom move moveend viewreset zoomend', updatePosition);
      }
      
      // Remove clip path if exists
      const clipPathId = `clip-path-${drawingId}`;
      if (svgElement) {
        const clipPath = svgElement.querySelector(`#${clipPathId}`);
        if (clipPath && clipPath.parentElement) {
          clipPath.parentElement.removeChild(clipPath);
        }
      }
    };
  } catch (err) {
    console.error('Error adding image to layer:', err);
    return undefined;
  }
};

/**
 * Adds an image directly to the map container as a fallback
 */
const addImageToMapContainer = (
  map: L.Map,
  drawingId: string,
  imageData: string,
  transformOptions: ImageTransformOptions,
  imageControlsRoots: Map<string, any>,
  onImageTransform?: (drawingId: string, options: Partial<ImageTransformOptions>) => void
) => {
  try {
    // Remove any existing image containers for this drawing
    const existingContainers = document.querySelectorAll(`div[data-drawing-id="${drawingId}"]`);
    existingContainers.forEach(container => {
      if (container.parentElement) {
        container.parentElement.removeChild(container);
      }
    });
    
    // Get overlay pane for proper positioning
    const overlayPane = map.getPanes().overlayPane;
    if (!overlayPane) {
      console.warn('Could not find overlay pane');
      return;
    }
    
    // Create container for the image
    const containerDiv = document.createElement('div');
    containerDiv.className = 'leaflet-drawing-image-container';
    containerDiv.dataset.drawingId = drawingId;
    containerDiv.style.position = 'absolute';
    containerDiv.style.left = '50%';
    containerDiv.style.top = '50%';
    containerDiv.style.transform = 'translate(-50%, -50%)';
    containerDiv.style.width = '300px'; // Default size
    containerDiv.style.height = '300px';
    containerDiv.style.zIndex = '1000';
    
    // Append container to the overlay pane
    overlayPane.appendChild(containerDiv);
    
    // Create and add image element
    const imgElement = createImageElement(imageData, (img) => {
      img.style.position = 'absolute';
      img.style.left = '50%';
      img.style.top = '50%';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      
      // Apply transformation
      transformImage(img, transformOptions);
    });
    
    containerDiv.appendChild(imgElement);
    
    // Create image edit controls - always visible
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'leaflet-drawing-image-controls';
    containerDiv.appendChild(controlsContainer);
    
    // Create React root for image controls
    import('@/components/map/drawing/ImageControlsRenderer').then(module => {
      try {
        module.renderImageControls(
          controlsContainer,
          drawingId,
          transformOptions,
          imageControlsRoots,
          (options) => {
            if (onImageTransform) {
              onImageTransform(drawingId, options);
              
              // Also update the display immediately
              transformImage(imgElement, {
                ...transformOptions,
                ...options
              });
            }
          }
        );
      } catch (err) {
        console.error('Error rendering image controls:', err);
      }
    });
    
    // Listen for image transform updates
    const handleTransformUpdate = (e: CustomEvent) => {
      const detail = e.detail as { drawingId: string, transformOptions: ImageTransformOptions };
      if (detail.drawingId === drawingId) {
        transformImage(imgElement, detail.transformOptions);
      }
    };
    
    window.addEventListener('image-transform-updated', handleTransformUpdate as EventListener);
    
    // Return a cleanup function
    return () => {
      window.removeEventListener('image-transform-updated', handleTransformUpdate as EventListener);
      
      if (containerDiv.parentElement) {
        containerDiv.parentElement.removeChild(containerDiv);
      }
      
      const controlsRoot = imageControlsRoots.get(`${drawingId}-image-controls`);
      if (controlsRoot) {
        try {
          controlsRoot.unmount();
        } catch (err) {
          console.error('Error unmounting image controls root:', err);
        }
        imageControlsRoots.delete(`${drawingId}-image-controls`);
      }
    };
  } catch (err) {
    console.error('Error adding image to map container:', err);
    return undefined;
  }
};
