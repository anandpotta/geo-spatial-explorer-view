
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
    
    // Clean up any existing observer to prevent multiple observers
    cleanupFillProtection(pathElement);
    
    // Set up a more conservative MutationObserver with strict conditions
    let lastRestoreTime = 0;
    const RESTORE_COOLDOWN = 1000; // 1 second cooldown between restores
    
    const observer = new MutationObserver((mutations) => {
      const now = Date.now();
      
      // Strict cooldown to prevent rapid restoration cycles
      if (now - lastRestoreTime < RESTORE_COOLDOWN) {
        return;
      }
      
      // Only process if the element is still in the DOM and has the lock
      if (!document.contains(pathElement) || pathElement.getAttribute('data-fill-locked') !== 'true') {
        observer.disconnect();
        return;
      }
      
      let shouldRestore = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'fill') {
          const currentFill = pathElement.getAttribute('fill');
          const expectedFill = `url(#${patternId})`;
          
          // Only restore if the fill was completely removed or changed to something else
          if (currentFill !== expectedFill && currentFill !== null) {
            shouldRestore = true;
          }
        }
      });
      
      if (shouldRestore) {
        lastRestoreTime = now;
        console.log(`Fill protection: restoring ${fill} for ${patternId}`);
        pathElement.setAttribute('fill', fill);
        pathElement.style.fill = fill;
      }
    });
    
    // Start observing with more specific options
    observer.observe(pathElement, {
      attributes: true,
      attributeFilter: ['fill'], // Only watch the fill attribute
      attributeOldValue: true
    });
    
    // Store the observer reference for cleanup
    (pathElement as any)._fillObserver = observer;
    
    // Force a repaint
    requestAnimationFrame(() => {
      if (pathElement && document.contains(pathElement)) {
        pathElement.getBoundingClientRect();
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
