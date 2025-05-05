
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
    // Skip if layer doesn't have _path property (SVG element)
    if (!(layer as any)._path) {
      console.warn('Layer has no _path property, cannot add image');
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
    
    // Create container for the image
    const containerDiv = document.createElement('div');
    containerDiv.className = 'leaflet-drawing-image-container';
    containerDiv.dataset.drawingId = drawingId;
    
    // Get overlay pane for proper positioning
    const overlayPane = (layer as any)._map.getPanes().overlayPane;
    if (!overlayPane) {
      console.warn('Could not find overlay pane');
      return;
    }
    
    // Append container to the overlay pane
    overlayPane.appendChild(containerDiv);
    
    // Define updatePosition function
    const updatePosition = () => {
      if (!pathElement || !svgElement) return;
      
      const newPathRect = pathElement.getBoundingClientRect();
      const newSvgRect = svgElement.getBoundingClientRect();
      
      containerDiv.style.left = `${newPathRect.left - newSvgRect.left}px`;
      containerDiv.style.top = `${newPathRect.top - newSvgRect.top}px`;
      containerDiv.style.width = `${newPathRect.width}px`;
      containerDiv.style.height = `${newPathRect.height}px`;
    };
    
    // Create and add image element with improved positioning
    const imgElement = createImageElement(imageData, (img) => {
      // Initial positioning
      updatePosition();
      
      // Position image in container
      img.style.position = 'absolute';
      img.style.left = '50%';
      img.style.top = '50%';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      
      // Apply transformation
      transformImage(img, transformOptions);
    });
    
    containerDiv.appendChild(imgElement);
    
    // Apply clipping mask using SVG path data
    if (pathElement && pathElement.getAttribute('d')) {
      const pathData = pathElement.getAttribute('d') || '';
      
      // Create a SVG clipPath
      const clipPathId = `clip-path-${drawingId}`;
      let clipPathEl = svgElement.querySelector(`#${clipPathId}`);
      
      // Remove existing clip path if present
      if (clipPathEl) {
        clipPathEl.remove();
      }
      
      // Create new clip path
      const defs = svgElement.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      if (!svgElement.querySelector('defs')) {
        svgElement.appendChild(defs);
      }
      
      clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPathEl.setAttribute('id', clipPathId);
      
      const clipPathShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      clipPathShape.setAttribute('d', pathData);
      clipPathEl.appendChild(clipPathShape);
      defs.appendChild(clipPathEl);
      
      // Apply clip path to image container
      containerDiv.style.clipPath = `url(#${clipPathId})`;
    }
    
    // Create image edit controls - always visible
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'leaflet-drawing-image-controls';
    containerDiv.appendChild(controlsContainer);
    
    // Create React root for image controls through a delegate function
    // Moved the actual JSX rendering to a separate file
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
    
    // Update position on map events
    const map = (layer as any)._map;
    if (map) {
      map.on('zoom move moveend', updatePosition);
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
        map.off('zoom move moveend', updatePosition);
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
