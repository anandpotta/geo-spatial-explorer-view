
import { createImageElement, transformImage, ImageTransformOptions } from '@/utils/image-transform-utils';
import '@/components/map/drawing/DrawingImage.css';

/**
 * Creates and configures a container for a drawing image
 */
export const createImageContainer = (
  drawingId: string,
  containerClassName: string = 'leaflet-drawing-image-container'
): HTMLDivElement => {
  // Create container for the image
  const containerDiv = document.createElement('div');
  containerDiv.className = `${containerClassName} clipped-image-container`;
  containerDiv.dataset.drawingId = drawingId;
  
  // Add basic styling
  containerDiv.style.position = 'absolute';
  containerDiv.style.overflow = 'visible';
  containerDiv.style.zIndex = '650';
  
  return containerDiv;
};

/**
 * Positions an image container based on path element coordinates
 */
export const positionContainerFromPath = (
  containerDiv: HTMLDivElement,
  pathElement: SVGElement,
  mapContainer: HTMLElement
): void => {
  if (!pathElement || !containerDiv || !mapContainer) return;
  
  try {
    // Get position relative to map
    const pathRect = pathElement.getBoundingClientRect();
    const mapRect = mapContainer.getBoundingClientRect();
    
    // Position container
    containerDiv.style.left = `${pathRect.left - mapRect.left}px`;
    containerDiv.style.top = `${pathRect.top - mapRect.top}px`;
    containerDiv.style.width = `${pathRect.width}px`;
    containerDiv.style.height = `${pathRect.height}px`;
  } catch (err) {
    console.error('Error positioning container:', err);
  }
};

/**
 * Creates, configures and adds an image element to a container
 */
export const addImageToContainer = (
  containerDiv: HTMLDivElement,
  imageData: string,
  transformOptions: ImageTransformOptions
): HTMLImageElement => {
  // Create and add image element
  const imgElement = createImageElement(imageData, (img) => {
    // Style the image
    img.style.position = 'absolute';
    img.style.left = '50%';
    img.style.top = '50%';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.zIndex = '650';
    
    // Apply transformation
    transformImage(img, transformOptions);
  });
  
  containerDiv.appendChild(imgElement);
  return imgElement;
};

/**
 * Creates a container for image controls
 */
export const createControlsContainer = (
  parentContainer: HTMLDivElement
): HTMLDivElement => {
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'leaflet-drawing-image-controls';
  parentContainer.appendChild(controlsContainer);
  return controlsContainer;
};

/**
 * Centers an image container on the map (used as fallback)
 */
export const centerImageContainer = (containerDiv: HTMLDivElement): void => {
  containerDiv.style.position = 'absolute';
  containerDiv.style.left = '50%';
  containerDiv.style.top = '50%';
  containerDiv.style.transform = 'translate(-50%, -50%)';
  containerDiv.style.width = '300px'; // Default size
  containerDiv.style.height = '300px';
  containerDiv.style.zIndex = '1000';
};
