
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
 * Applies a pattern and clip path to an SVG path element with improved persistence
 */
export const applyPatternAndClipPath = (
  pathElement: SVGPathElement,
  patternId: string,
  clipPathId: string
): boolean => {
  try {
    // Apply all changes in a single batch to reduce visual flickering
    const fill = `url(#${patternId})`;
    const clipPathUrl = `url(#${clipPathId})`;
    
    console.log(`Setting fill to: ${fill}`);
    console.log(`Setting clip-path to: ${clipPathUrl}`);
    
    // Set attributes directly to ensure they take effect
    pathElement.style.fill = fill;
    pathElement.setAttribute('fill', fill);
    pathElement.style.clipPath = clipPathUrl;
    pathElement.setAttribute('clip-path', clipPathUrl);
    
    // Add extra visibility classes
    pathElement.classList.add('has-image-fill');
    
    // Mark the element as having stable fill to prevent overwrites
    pathElement.setAttribute('data-fill-locked', 'true');
    pathElement.setAttribute('data-fill-pattern-id', patternId);
    
    // Set up a MutationObserver to watch for attribute changes with debouncing
    let debounceTimeout: NodeJS.Timeout | null = null;
    let isRestoring = false;
    
    const observer = new MutationObserver((mutations) => {
      // Skip if we're currently restoring to prevent loops
      if (isRestoring) return;
      
      // Clear any existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      // Debounce the restoration to prevent rapid fire changes
      debounceTimeout = setTimeout(() => {
        let needsRestore = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'fill' || mutation.attributeName === 'style')) {
            
            // Check if the fill was lost or changed
            const currentFill = pathElement.style.fill || pathElement.getAttribute('fill');
            const expectedFill = `url(#${patternId})`;
            
            if (currentFill !== expectedFill && pathElement.getAttribute('data-fill-locked') === 'true') {
              needsRestore = true;
            }
          }
        });
        
        if (needsRestore) {
          isRestoring = true;
          console.log(`Fill protection: restoring ${fill} for ${patternId}`);
          pathElement.style.fill = fill;
          pathElement.setAttribute('fill', fill);
          
          // Reset the restoring flag after a short delay
          setTimeout(() => {
            isRestoring = false;
          }, 100);
        }
      }, 50); // 50ms debounce
    });
    
    // Start observing
    observer.observe(pathElement, {
      attributes: true,
      attributeFilter: ['fill', 'style']
    });
    
    // Store the observer reference for cleanup
    (pathElement as any)._fillObserver = observer;
    
    // Force a repaint
    requestAnimationFrame(() => {
      if (pathElement && document.contains(pathElement)) {
        pathElement.getBoundingClientRect();
        window.dispatchEvent(new Event('resize'));
      }
    });
    
    return true;
  } catch (err) {
    console.error('Error applying pattern and clip path:', err);
    return false;
  }
};

/**
 * Clean up fill protection for a path element
 */
export const cleanupFillProtection = (pathElement: SVGPathElement): void => {
  try {
    // Stop observing
    const observer = (pathElement as any)._fillObserver;
    if (observer) {
      observer.disconnect();
      delete (pathElement as any)._fillObserver;
    }
    
    // Remove protection attributes
    pathElement.removeAttribute('data-fill-locked');
    pathElement.removeAttribute('data-fill-pattern-id');
  } catch (err) {
    console.error('Error cleaning up fill protection:', err);
  }
};
