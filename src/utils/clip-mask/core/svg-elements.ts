
/**
 * Utilities for managing SVG elements in clip masks
 */

/**
 * Creates and initializes SVG elements needed for a clip mask
 */
export const createClipMaskSvgElements = (
  svg: SVGSVGElement,
  pathElement: SVGPathElement,
  drawingId: string
): { clipPath: SVGClipPathElement; pattern: SVGPatternElement } | null => {
  try {
    // Get the path data
    const pathData = pathElement.getAttribute('d');
    if (!pathData) {
      console.error('SVG path has no path data (d attribute)');
      return null;
    }
    
    // Create the defs section if it doesn't exist
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);
    }
    
    // Clean up any existing elements with the same IDs first
    const existingClipPath = defs.querySelector(`#clip-${drawingId}`);
    if (existingClipPath) defs.removeChild(existingClipPath);
    
    const existingPattern = defs.querySelector(`#pattern-${drawingId}`);
    if (existingPattern) defs.removeChild(existingPattern);
    
    // Create a clip path element
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', `clip-${drawingId}`);
    defs.appendChild(clipPath);
    
    // Create a path for the clip path
    const clipPathPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    clipPathPath.setAttribute('d', pathData);
    clipPath.appendChild(clipPathPath);
    
    // Create a pattern for the image
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', `pattern-${drawingId}`);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('preserveAspectRatio', 'none');
    defs.appendChild(pattern);
    
    return { clipPath, pattern };
  } catch (err) {
    console.error('Error creating SVG elements for clip mask:', err);
    return null;
  }
};

/**
 * Applies a pattern and clip path to an SVG path element
 */
export const applyPatternAndClipPath = (
  pathElement: SVGPathElement,
  patternId: string,
  clipPathId: string
): boolean => {
  try {
    requestAnimationFrame(() => {
      if (!pathElement || !document.contains(pathElement)) return;
      
      // Apply all changes in a single batch to reduce visual flickering
      const fill = `url(#${patternId})`;
      const clipPathUrl = `url(#${clipPathId})`;
      
      console.log(`Setting fill to: ${fill}`);
      console.log(`Setting clip-path to: ${clipPathUrl}`);
      
      // Set fill first
      pathElement.style.fill = fill;
      pathElement.setAttribute('fill', fill);
      
      // Then apply clip path
      pathElement.style.clipPath = clipPathUrl;
      pathElement.setAttribute('clip-path', clipPathUrl);
      
      // Add extra visibility classes
      pathElement.classList.add('has-image-fill');
    });
    
    return true;
  } catch (err) {
    console.error('Error applying pattern and clip path:', err);
    return false;
  }
};
