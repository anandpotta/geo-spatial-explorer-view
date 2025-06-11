
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
    // Add additional attributes for visibility
    pattern.setAttribute('width', '100%');
    pattern.setAttribute('height', '100%');
    
    defs.appendChild(pattern);
    
    return { clipPath, pattern };
  } catch (err) {
    console.error('Error creating SVG elements for clip mask:', err);
    return null;
  }
};

/**
 * Applies a pattern and clip path to an SVG path element while preserving the original path
 */
export const applyPatternAndClipPath = (
  pathElement: SVGPathElement,
  patternId: string,
  clipPathId: string
): boolean => {
  try {
    // Store the original styling to preserve it
    const originalFill = pathElement.getAttribute('fill') || pathElement.style.fill;
    const originalStroke = pathElement.getAttribute('stroke') || pathElement.style.stroke;
    const originalStrokeWidth = pathElement.getAttribute('stroke-width') || pathElement.style.strokeWidth;
    
    console.log(`Applying pattern ${patternId} and clip-path ${clipPathId} to path element`);
    console.log(`Original styling - fill: ${originalFill}, stroke: ${originalStroke}, stroke-width: ${originalStrokeWidth}`);
    
    requestAnimationFrame(() => {
      if (!pathElement || !document.contains(pathElement)) return;
      
      // Apply the pattern as fill while preserving stroke
      const fill = `url(#${patternId})`;
      
      // Set the pattern fill
      pathElement.style.fill = fill;
      pathElement.setAttribute('fill', fill);
      
      // Preserve or set a visible stroke to ensure the path outline remains visible
      if (!originalStroke || originalStroke === 'none') {
        pathElement.style.stroke = 'rgba(0, 0, 0, 0.3)';
        pathElement.style.strokeWidth = '1px';
      } else {
        pathElement.style.stroke = originalStroke;
        pathElement.style.strokeWidth = originalStrokeWidth || '1px';
      }
      
      // Ensure the path is visible
      pathElement.style.opacity = '1';
      pathElement.style.visibility = 'visible';
      pathElement.style.display = 'block';
      
      // Add class to identify paths with image fills
      pathElement.classList.add('has-image-fill');
      
      // Store original styling as data attributes for potential restoration
      pathElement.setAttribute('data-original-fill', originalFill || 'none');
      pathElement.setAttribute('data-original-stroke', originalStroke || 'none');
      pathElement.setAttribute('data-original-stroke-width', originalStrokeWidth || '1');
      
      console.log(`Successfully applied pattern ${patternId} to path element`);
      
      // Force a repaint
      pathElement.getBoundingClientRect();
      window.dispatchEvent(new Event('resize'));
      
      // Double-check the fill is still applied after a short delay
      setTimeout(() => {
        if (!pathElement || !document.contains(pathElement)) return;
        
        const currentFill = pathElement.style.fill || pathElement.getAttribute('fill');
        if (!currentFill || !currentFill.includes(patternId)) {
          console.log(`Fill lost for ${patternId}, reapplying with fallback`);
          pathElement.style.fill = fill;
          pathElement.setAttribute('fill', fill);
          
          // Add a fallback visible stroke if pattern is not showing
          pathElement.style.stroke = 'rgba(59, 130, 246, 0.8)'; // Blue stroke as fallback
          pathElement.style.strokeWidth = '2px';
        }
      }, 500);
    });
    
    return true;
  } catch (err) {
    console.error('Error applying pattern and clip path:', err);
    return false;
  }
};

/**
 * Removes clip mask from a path element and restores original styling
 */
export const removePatternAndClipPath = (pathElement: SVGPathElement): boolean => {
  try {
    if (!pathElement) return false;
    
    // Restore original styling
    const originalFill = pathElement.getAttribute('data-original-fill');
    const originalStroke = pathElement.getAttribute('data-original-stroke');
    const originalStrokeWidth = pathElement.getAttribute('data-original-stroke-width');
    
    if (originalFill) {
      pathElement.style.fill = originalFill === 'none' ? 'transparent' : originalFill;
      pathElement.setAttribute('fill', originalFill);
    }
    
    if (originalStroke) {
      pathElement.style.stroke = originalStroke === 'none' ? 'none' : originalStroke;
      pathElement.setAttribute('stroke', originalStroke);
    }
    
    if (originalStrokeWidth) {
      pathElement.style.strokeWidth = originalStrokeWidth;
      pathElement.setAttribute('stroke-width', originalStrokeWidth);
    }
    
    // Remove clip mask related attributes
    pathElement.style.clipPath = '';
    pathElement.removeAttribute('clip-path');
    pathElement.classList.remove('has-image-fill');
    
    // Clean up data attributes
    pathElement.removeAttribute('data-original-fill');
    pathElement.removeAttribute('data-original-stroke');
    pathElement.removeAttribute('data-original-stroke-width');
    pathElement.removeAttribute('data-has-clip-mask');
    pathElement.removeAttribute('data-image-url');
    
    console.log('Removed clip mask and restored original styling');
    return true;
  } catch (err) {
    console.error('Error removing pattern and clip path:', err);
    return false;
  }
};
