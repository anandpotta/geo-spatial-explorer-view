
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
  imageUrl?: string; // Make imageUrl optional here to match usage
  pathElement?: SVGPathElement;
  isMounted: boolean;
}
