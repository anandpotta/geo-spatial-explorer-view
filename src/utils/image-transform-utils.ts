
interface Position {
  x: number;
  y: number;
}

interface ImageTransformation {
  rotation: number;
  scale: number;
  position: Position;
}

/**
 * Calculate the scale needed to fit an image within a container
 */
export const calculateFitScale = (
  containerWidth: number, 
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
  padding = 0.9 // 90% of container to leave some padding
): number => {
  const containerAspect = containerWidth / containerHeight;
  const imageAspect = imageWidth / imageHeight;
  
  if (containerAspect > imageAspect) {
    // Container is wider than image
    return (containerHeight * padding) / imageHeight;
  } else {
    // Container is taller than image
    return (containerWidth * padding) / imageWidth;
  }
};

/**
 * Constrain position to keep image within bounds
 */
export const constrainPosition = (
  position: Position,
  containerBounds: DOMRect,
  imageBounds: DOMRect,
  scale: number,
  rotation: number
): Position => {
  // This is a simplified constraint - for full implementation with rotation,
  // we would need more complex calculations
  const maxX = containerBounds.width / 2;
  const maxY = containerBounds.height / 2;
  
  return {
    x: Math.max(-maxX, Math.min(maxX, position.x)),
    y: Math.max(-maxY, Math.min(maxY, position.y)),
  };
};

/**
 * Calculate transformation to fit an image within a polygon
 */
export const calculatePolygonFit = (
  imageWidth: number,
  imageHeight: number,
  polygonBounds: { minX: number, minY: number, maxX: number, maxY: number }
): ImageTransformation => {
  const polygonWidth = polygonBounds.maxX - polygonBounds.minX;
  const polygonHeight = polygonBounds.maxY - polygonBounds.minY;
  
  // Calculate center position of the polygon
  const centerX = polygonBounds.minX + polygonWidth / 2;
  const centerY = polygonBounds.minY + polygonHeight / 2;
  
  // Calculate scale to fit within polygon
  const imageAspect = imageWidth / imageHeight;
  const polygonAspect = polygonWidth / polygonHeight;
  
  let scale;
  if (imageAspect > polygonAspect) {
    // Image is wider compared to its height than the polygon
    scale = polygonWidth / imageWidth * 0.9; // 90% to leave some padding
  } else {
    // Image is taller compared to its width than the polygon
    scale = polygonHeight / imageHeight * 0.9; // 90% to leave some padding
  }
  
  return {
    scale,
    rotation: 0,
    position: { 
      x: centerX, 
      y: centerY 
    }
  };
};

/**
 * Save image transformation to localStorage
 */
export const saveImageTransformation = (
  drawingId: string | undefined,
  transformation: ImageTransformation
): void => {
  if (!drawingId) return;
  
  const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
  if (savedFloorPlans[drawingId]) {
    savedFloorPlans[drawingId].transformation = transformation;
    localStorage.setItem('floorPlans', JSON.stringify(savedFloorPlans));
  }
};
