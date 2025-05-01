
/**
 * Type definitions for clip mask operations
 */

export interface ApplyClipMaskOptions {
  drawingId: string;
  isMounted: boolean;
  layer: L.Layer;
}

export interface ApplyWithStabilityOptions {
  drawingId: string;
  imageUrl: string;
  pathElement: SVGPathElement;
  isMounted: boolean;
}
