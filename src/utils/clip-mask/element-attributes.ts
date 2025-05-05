
/**
 * Utility functions for applying attributes to SVG elements
 */

/**
 * Applies the necessary attributes to the SVG path element for a clip mask
 */
export const applyElementAttributes = (
  pathElement: SVGPathElement,
  id: string
): void => {
  // Set default values for transformation
  pathElement.setAttribute('data-image-rotation', '0');
  pathElement.setAttribute('data-image-scale', '1');
  pathElement.setAttribute('data-image-offset-x', '0');
  pathElement.setAttribute('data-image-offset-y', '0');
  
  // Use requestAnimationFrame for smoother visual updates
  requestAnimationFrame(() => {
    if (!pathElement || !document.contains(pathElement)) return;
    
    // Apply all changes in a single batch to reduce visual flickering
    const fill = `url(#pattern-${id})`;
    const clipPathUrl = `url(#clip-${id})`;
    
    pathElement.style.fill = fill;
    pathElement.style.stroke = 'none';
    pathElement.style.clipPath = clipPathUrl;
    
    // Also set attributes as backup in case styles are reset
    pathElement.setAttribute('fill', fill);
    pathElement.setAttribute('stroke', 'none');
    pathElement.setAttribute('clip-path', clipPathUrl);
  });
};
