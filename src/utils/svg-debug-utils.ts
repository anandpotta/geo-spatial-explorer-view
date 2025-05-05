
/**
 * Utility functions for debugging SVG and clip mask issues
 */

/**
 * Logs information about an SVG element and its clip mask
 */
export const debugSvgElement = (element: SVGElement | null, label: string = 'SVG Element'): void => {
  if (!element) {
    console.error(`${label} is null or undefined`);
    return;
  }

  console.log(`--- ${label} Debug Info ---`);
  console.log('Element:', element);
  console.log('Tag name:', element.tagName);
  console.log('ID:', element.id);
  console.log('Class:', element.className);
  console.log('Attributes:', Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`));
  
  // Check for clip path
  const clipPath = element.getAttribute('clip-path');
  console.log('Clip path:', clipPath || 'none');
  
  // Check for fill
  const fill = element.getAttribute('fill');
  console.log('Fill:', fill || 'none');
  
  // Check for custom data attributes
  console.log('Has clip mask:', element.getAttribute('data-has-clip-mask') || 'false');
  console.log('Image URL:', element.getAttribute('data-image-url') || 'none');
  
  // Get bounding box if available
  if ('getBBox' in element) {
    try {
      const bbox = (element as SVGGraphicsElement).getBBox();
      console.log('BBox:', { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height });
    } catch (err) {
      console.error('Error getting bbox:', err);
    }
  }
  
  // Check if the referenced clip path and pattern elements exist
  if (clipPath) {
    const clipPathId = clipPath.match(/url\(#(.*?)\)/)?.[1];
    if (clipPathId) {
      const clipPathElement = document.getElementById(clipPathId);
      console.log(`Clip path element (#${clipPathId}) exists:`, !!clipPathElement);
    }
  }
  
  if (fill && fill.startsWith('url(')) {
    const patternId = fill.match(/url\(#(.*?)\)/)?.[1];
    if (patternId) {
      const patternElement = document.getElementById(patternId);
      console.log(`Pattern element (#${patternId}) exists:`, !!patternElement);
      
      if (patternElement) {
        const image = patternElement.querySelector('image');
        console.log('Pattern has image:', !!image);
        if (image) {
          console.log('Image href:', image.getAttribute('href') || 'none');
        }
      }
    }
  }
  
  console.log('-------------------------');
};

/**
 * Checks if the element is visible in the DOM
 */
export const checkElementVisibility = (element: Element | null): boolean => {
  if (!element) return false;
  
  // Check if element is in the DOM
  const inDOM = document.body.contains(element);
  console.log('Element is in DOM:', inDOM);
  
  if (inDOM) {
    // Check computed style
    const style = window.getComputedStyle(element);
    const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    console.log('Element is visible:', isVisible);
    console.log('Display:', style.display);
    console.log('Visibility:', style.visibility);
    console.log('Opacity:', style.opacity);
    
    return isVisible;
  }
  
  return false;
};

/**
 * Adds debug info to the page to visualize SVG clip masks
 */
export const visualizeClipMasks = (containerId: string = 'clip-mask-debug'): void => {
  // Create container if it doesn't exist
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.zIndex = '9999';
    container.style.backgroundColor = 'rgba(0,0,0,0.7)';
    container.style.color = '#fff';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    container.style.maxHeight = '300px';
    container.style.overflowY = 'auto';
    container.style.maxWidth = '300px';
    document.body.appendChild(container);
  }
  
  // Clear container
  container.innerHTML = '<h4>SVG Debug</h4>';
  
  // Find all clip paths and patterns
  const defs = document.querySelectorAll('defs');
  defs.forEach((def, defIndex) => {
    const clipPaths = def.querySelectorAll('clipPath');
    const patterns = def.querySelectorAll('pattern');
    
    const defInfo = document.createElement('div');
    defInfo.innerHTML = `<strong>Defs #${defIndex + 1}</strong>: ${clipPaths.length} clip paths, ${patterns.length} patterns`;
    container.appendChild(defInfo);
    
    // Show info about clip paths and patterns
    if (clipPaths.length > 0 || patterns.length > 0) {
      const detailsList = document.createElement('ul');
      
      clipPaths.forEach(clip => {
        const item = document.createElement('li');
        item.textContent = `Clip: #${clip.id}`;
        detailsList.appendChild(item);
      });
      
      patterns.forEach(pattern => {
        const item = document.createElement('li');
        const image = pattern.querySelector('image');
        item.textContent = `Pattern: #${pattern.id} ${image ? '(has image)' : '(no image)'}`;
        detailsList.appendChild(item);
      });
      
      container.appendChild(detailsList);
    }
  });
};
