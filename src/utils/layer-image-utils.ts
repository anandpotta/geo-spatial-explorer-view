
import L from 'leaflet';
import { ImageTransformOptions, getDefaultTransformOptions, transformImage } from '@/utils/image-transform-utils';
import { 
  createImageContainer, 
  addImageToContainer, 
  createControlsContainer, 
  positionContainerFromPath,
  centerImageContainer 
} from '@/utils/image-container-utils';
import { applyClipPathFromPathData } from '@/utils/clip-path-utils';
import { 
  findPathElementInLayer, 
  getSvgForLayer, 
  getMapContainer,
  getOverlayPane 
} from '@/utils/layer-path-finder';
import { setupImageEventListeners, createPositionUpdater } from '@/utils/image-event-utils';

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
    
    // Find path element in the layer
    const pathElement = findPathElementInLayer(layer);
    
    // If no path element found, try fallback to map container
    if (!pathElement) {
      console.log(`Layer has no _path property for drawing ${drawingId}, trying to find path in child layers`);
      
      // Try to use map container as fallback
      const map = (layer as any)._map;
      if (map && map.getContainer()) {
        console.log('Using map container as fallback for image placement');
        return addImageToMapContainer(
          map,
          drawingId,
          imageData,
          transformOptions,
          imageControlsRoots,
          onImageTransform
        );
      }
      
      console.warn('Could not add image: no suitable layer or container found');
      return;
    }
    
    // Get SVG element containing the path
    const svgElement = getSvgForLayer(pathElement);
    const mapContainer = getMapContainer(layer);
    
    if (!svgElement || !pathElement.parentElement || !mapContainer) {
      console.warn('Could not find SVG element, path parent, or map container');
      return;
    }
    
    // Remove existing image containers for this drawing
    const existingContainers = document.querySelectorAll(`div[data-drawing-id="${drawingId}"]`);
    existingContainers.forEach(container => {
      if (container.parentElement) {
        container.parentElement.removeChild(container);
      }
    });
    
    // Get overlay pane for proper positioning
    const overlayPane = getOverlayPane((layer as any)._map);
    if (!overlayPane) {
      console.warn('Could not find overlay pane');
      return;
    }
    
    // Create container for the image
    const containerDiv = createImageContainer(drawingId);
    
    // Append container to the overlay pane
    overlayPane.appendChild(containerDiv);
    
    // Create a position updater function
    const updatePosition = createPositionUpdater(containerDiv, pathElement, svgElement, mapContainer);
    
    // Add image to container
    const imgElement = addImageToContainer(containerDiv, imageData, transformOptions);
    
    // Apply clipping mask using SVG path data
    applyClipPathFromPathData(svgElement, containerDiv, pathElement, drawingId);
    
    // Create image edit controls container
    const controlsContainer = createControlsContainer(containerDiv);
    
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
    
    // Set up event listeners and return cleanup function
    return setupImageEventListeners(
      drawingId,
      imgElement,
      containerDiv,
      (layer as any)._map,
      updatePosition,
      imageControlsRoots.get(`${drawingId}-image-controls`)
    );
  } catch (err) {
    console.error('Error adding image to layer:', err);
    return undefined;
  }
};

/**
 * Adds an image directly to the map container as a fallback
 */
export const addImageToMapContainer = (
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
    const overlayPane = getOverlayPane(map);
    if (!overlayPane) {
      console.warn('Could not find overlay pane');
      return;
    }
    
    // Create container for the image
    const containerDiv = createImageContainer(drawingId);
    
    // Center the container as fallback positioning
    centerImageContainer(containerDiv);
    
    // Append container to the overlay pane
    overlayPane.appendChild(containerDiv);
    
    // Add image to container
    const imgElement = addImageToContainer(containerDiv, imageData, transformOptions);
    
    // Create image edit controls container
    const controlsContainer = createControlsContainer(containerDiv);
    
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
    
    // Set up event listeners and return cleanup function
    return setupImageEventListeners(
      drawingId,
      imgElement,
      containerDiv,
      map,
      undefined,
      imageControlsRoots.get(`${drawingId}-image-controls`)
    );
  } catch (err) {
    console.error('Error adding image to map container:', err);
    return undefined;
  }
};

