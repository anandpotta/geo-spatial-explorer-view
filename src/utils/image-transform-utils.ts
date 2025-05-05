
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
  
  // Apply CSS transformations
  imgElement.style.transform = `
    rotate(${rotation}deg)
    scale(${scale})
    translate(${translateX}px, ${translateY}px)
  `;
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
  
  if (onLoad) {
    img.onload = () => onLoad(img);
  }
  
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
