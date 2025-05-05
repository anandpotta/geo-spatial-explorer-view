
/**
 * Utility functions for handling image transformations in Leaflet paths
 */

/**
 * Apply transformation to an image element within a path
 */
export const transformImage = (
  imgElement: HTMLImageElement,
  transformOptions: ImageTransformOptions
): void => {
  if (!imgElement) return;

  const { rotation, scale, translateX, translateY } = transformOptions;
  
  // Apply CSS transformations - fixed the transform order for better results
  imgElement.style.transform = `
    translate(-50%, -50%)
    translate(${translateX}px, ${translateY}px)
    rotate(${rotation}deg)
    scale(${scale})
  `;
  
  // Ensure image is fully visible with no transparency
  imgElement.style.display = 'block';
  imgElement.style.opacity = '1';
  imgElement.style.visibility = 'visible';
  imgElement.style.objectFit = 'contain';
  
  // Log transformation for debugging
  console.log(`Applied transform: rotation=${rotation}, scale=${scale}, translateX=${translateX}, translateY=${translateY}`);
};

/**
 * Calculate the dimensions to fit an image within a container
 */
export const calculateFitDimensions = (
  imgWidth: number,
  imgHeight: number,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number } => {
  const aspectRatio = imgWidth / imgHeight;
  
  let width = containerWidth;
  let height = containerHeight;
  
  if (containerWidth / containerHeight > aspectRatio) {
    // Container is wider than image aspect ratio
    width = containerHeight * aspectRatio;
  } else {
    // Container is taller than image aspect ratio
    height = containerWidth / aspectRatio;
  }
  
  return { width, height };
};

/**
 * Create and prepare an image element from a data URL
 */
export const createImageElement = (
  dataUrl: string,
  onLoad?: (img: HTMLImageElement) => void
): HTMLImageElement => {
  const img = document.createElement('img');
  img.src = dataUrl;
  img.className = 'leaflet-drawing-image';
  img.style.position = 'absolute';
  img.style.transformOrigin = 'center';
  img.style.pointerEvents = 'auto';
  img.style.display = 'block'; // Ensure image is visible
  img.style.opacity = '1';
  img.style.visibility = 'visible';
  img.style.objectFit = 'contain';
  img.style.maxWidth = '100%';
  img.style.maxHeight = '100%';
  img.alt = "Drawing image";
  
  // Add console log to debug image loading
  img.onload = () => {
    console.log('Image loaded successfully', img.naturalWidth, img.naturalHeight);
    if (onLoad) onLoad(img);
  };
  
  img.onerror = (e) => {
    console.error('Error loading image:', e);
  };
  
  return img;
};

export interface ImageTransformOptions {
  rotation: number;
  scale: number;
  translateX: number;
  translateY: number;
}

export const getDefaultTransformOptions = (): ImageTransformOptions => ({
  rotation: 0,
  scale: 1,
  translateX: 0,
  translateY: 0
});
