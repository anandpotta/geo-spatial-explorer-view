
/**
 * Type definitions for SVG elements and attributes
 */

export interface SVGPathElementWithAttributes extends SVGPathElement {
  // Additional attributes that might be present on path elements
  'data-has-clip-mask'?: string;
  'data-image-rotation'?: string;
  'data-image-scale'?: string;
  'data-image-offset-x'?: string;
  'data-image-offset-y'?: string;
  'data-drawing-id'?: string;
  'data-last-updated'?: string;
  'data-original-d'?: string;
  'data-original-fill'?: string;
  'data-original-stroke'?: string;
}
