
import L from 'leaflet';
import { ImageTransformOptions, transformImage } from '@/utils/image-transform-utils';
import { 
  createImageContainer, 
  addImageToContainer, 
  createControlsContainer,
  centerImageContainer 
} from '@/utils/layer-images/image-container-utils';
import { getOverlayPane } from '@/utils/layer-path-finder';
import { setupImageEventListeners } from '@/utils/layer-images/image-event-utils';

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
