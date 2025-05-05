
import L from 'leaflet';
import { ImageTransformOptions, transformImage } from '@/utils/image-transform-utils';

/**
 * Sets up event listeners and returns a cleanup function
 */
export const setupImageEventListeners = (
  drawingId: string,
  imgElement: HTMLImageElement,
  containerDiv: HTMLDivElement,
  map: L.Map | null,
  updatePositionFn?: () => void,
  controlsRoot?: any
): () => void => {
  // Listen for image transform updates
  const handleTransformUpdate = (e: CustomEvent) => {
    const detail = e.detail as { drawingId: string, transformOptions: ImageTransformOptions };
    if (detail.drawingId === drawingId) {
      transformImage(imgElement, detail.transformOptions);
    }
  };
  
  window.addEventListener('image-transform-updated', handleTransformUpdate as EventListener);
  
  // Setup map event listeners if map is available
  let mapEventListeners: (() => void) | undefined;
  if (map && updatePositionFn) {
    map.on('zoom move moveend viewreset zoomend', updatePositionFn);
    // Initial position updates
    setTimeout(updatePositionFn, 100);
    setTimeout(updatePositionFn, 500);
    setTimeout(updatePositionFn, 1000);
    
    // Setup cleanup function for map events
    mapEventListeners = () => {
      map.off('zoom move moveend viewreset zoomend', updatePositionFn);
    };
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('image-transform-updated', handleTransformUpdate as EventListener);
    
    // Remove container if it exists
    if (containerDiv.parentElement) {
      containerDiv.parentElement.removeChild(containerDiv);
    }
    
    // Clean up React root if exists
    if (controlsRoot) {
      try {
        controlsRoot.unmount();
      } catch (err) {
        console.error('Error unmounting controls root:', err);
      }
    }
    
    // Clean up map event listeners
    if (mapEventListeners) {
      mapEventListeners();
    }
  };
};

/**
 * Creates a dynamic position updater function
 */
export const createPositionUpdater = (
  containerDiv: HTMLDivElement,
  pathElement: SVGElement | null,
  svgElement: SVGElement | null,
  mapContainer: HTMLElement | null
): (() => void) => {
  return () => {
    if (!pathElement || !svgElement || !mapContainer) return;
    
    try {
      const newPathRect = pathElement.getBoundingClientRect();
      const mapRect = mapContainer.getBoundingClientRect();
      
      containerDiv.style.left = `${newPathRect.left - mapRect.left}px`;
      containerDiv.style.top = `${newPathRect.top - mapRect.top}px`;
      containerDiv.style.width = `${newPathRect.width}px`;
      containerDiv.style.height = `${newPathRect.height}px`;
    } catch (err) {
      console.error('Error updating position:', err);
    }
  };
};
