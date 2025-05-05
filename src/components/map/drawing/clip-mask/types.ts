
/**
 * Type definitions for clip mask operations
 */

export interface ApplyClipMaskOptions {
  drawingId: string;
  isMounted: boolean;
  layer: L.Layer;
  imageUrl?: string;
}

export interface ApplyWithStabilityOptions {
  drawingId: string;
  imageUrl: string;
  pathElement: SVGPathElement;
  isMounted: boolean;
}
