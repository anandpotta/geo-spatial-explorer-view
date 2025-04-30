
import { toast } from 'sonner';

/**
 * Applies an image pattern to an SVG path element
 */
export const applyImageToSvgPath = (pathElement: SVGPathElement, imageSrc: string) => {
  try {
    // Get the SVG parent
    const svgElement = pathElement.ownerSVGElement;
    if (!svgElement) return;
    
    // Check if a pattern with this ID already exists
    const patternId = `pattern-${Math.random().toString(36).substr(2, 9)}`;
    let pattern = svgElement.querySelector(`#${patternId}`);
    
    if (!pattern) {
      // Create pattern element if it doesn't exist
      const defs = svgElement.querySelector('defs') || 
                  svgElement.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), 
                  svgElement.firstChild);
      
      pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', patternId);
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');
      pattern.setAttribute('width', '100%');
      pattern.setAttribute('height', '100%');
      
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      image.setAttribute('href', imageSrc);
      image.setAttribute('width', '100%');
      image.setAttribute('height', '100%');
      image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      
      pattern.appendChild(image);
      defs.appendChild(pattern);
    }
    
    // Apply pattern to path
    pathElement.setAttribute('fill', `url(#${patternId})`);
    pathElement.setAttribute('stroke-width', '2');
  } catch (err) {
    console.error('Error applying image to SVG path:', err);
  }
};
