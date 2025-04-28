
interface Position {
  x: number;
  y: number;
}

export interface ImageTransformation {
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
  // Calculate image corners after rotation
  const imageWidth = imageBounds.width * scale;
  const imageHeight = imageBounds.height * scale;
  
  // Calculate rotated dimensions
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const rotatedWidth = imageWidth * cos + imageHeight * sin;
  const rotatedHeight = imageWidth * sin + imageHeight * cos;
  
  // Calculate constraints
  const maxX = (containerBounds.width + rotatedWidth) / 2;
  const maxY = (containerBounds.height + rotatedHeight) / 2;
  const minX = -maxX;
  const minY = -maxY;
  
  return {
    x: Math.max(minX, Math.min(maxX, position.x)),
    y: Math.max(minY, Math.min(maxY, position.y))
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
  
  // Calculate scale to fit within polygon while maintaining aspect ratio
  const scale = Math.min(
    polygonWidth / imageWidth,
    polygonHeight / imageHeight
  ) * 0.9; // 90% to leave some padding
  
  return {
    scale,
    rotation: 0,
    position: { x: centerX, y: centerY }
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
