
/**
 * Image processing utilities for clip masks
 */

import { getCurrentUser } from '@/services/auth-service';

/**
 * Process an image for use in a clip mask pattern
 */
export const processImageForClipMask = (
  imageUrl: string,
  drawingId: string,
  pathElement: SVGPathElement,
  pattern: SVGPatternElement,
  onSuccess: () => void,
  onError: () => void
): void => {
  try {
    console.log(`Processing image for clip mask: ${imageUrl}`);
    
    // Get the bounding box of the path to size the pattern correctly
    const bbox = pathElement.getBBox();
    console.log(`Path bounding box:`, bbox);
    
    // Set pattern dimensions to match the path
    pattern.setAttribute('x', bbox.x.toString());
    pattern.setAttribute('y', bbox.y.toString());
    pattern.setAttribute('width', bbox.width.toString());
    pattern.setAttribute('height', bbox.height.toString());
    
    // Create the image element
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('href', imageUrl);
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('width', bbox.width.toString());
    image.setAttribute('height', bbox.height.toString());
    image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    
    // Add attributes for identification and user association
    const currentUser = getCurrentUser();
    if (currentUser) {
      image.setAttribute('data-user-id', currentUser.id);
    }
    image.setAttribute('data-drawing-id', drawingId);
    
    // Handle image load events
    image.addEventListener('load', () => {
      console.log(`Image loaded successfully for drawing ${drawingId}`);
      
      // Ensure the image is properly positioned and sized
      requestAnimationFrame(() => {
        // Re-apply dimensions in case they were reset
        image.setAttribute('width', bbox.width.toString());
        image.setAttribute('height', bbox.height.toString());
        
        // Mark as loaded
        image.setAttribute('data-loaded', 'true');
        
        // Call success callback
        onSuccess();
      });
    });
    
    image.addEventListener('error', (e) => {
      console.error(`Failed to load image for drawing ${drawingId}:`, e);
      
      // Create a fallback pattern with a colored background
      createFallbackPattern(pattern, bbox, drawingId);
      
      // Still call success to continue with the fallback
      onSuccess();
    });
    
    // Clear any existing content in the pattern
    pattern.innerHTML = '';
    
    // Add the image to the pattern
    pattern.appendChild(image);
    
    console.log(`Added image to pattern for drawing ${drawingId}`);
    
  } catch (err) {
    console.error('Error processing image for clip mask:', err);
    
    // Create fallback pattern
    if (pattern) {
      createFallbackPattern(pattern, pathElement.getBBox(), drawingId);
      onSuccess(); // Continue with fallback
    } else {
      onError();
    }
  }
};

/**
 * Create a fallback pattern when image loading fails
 */
const createFallbackPattern = (
  pattern: SVGPatternElement,
  bbox: DOMRect,
  drawingId: string
): void => {
  try {
    console.log(`Creating fallback pattern for drawing ${drawingId}`);
    
    // Clear existing content
    pattern.innerHTML = '';
    
    // Create a simple colored rectangle as fallback
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', bbox.width.toString());
    rect.setAttribute('height', bbox.height.toString());
    rect.setAttribute('fill', 'rgba(59, 130, 246, 0.3)'); // Light blue background
    rect.setAttribute('stroke', 'rgba(59, 130, 246, 0.8)');
    rect.setAttribute('stroke-width', '2');
    
    // Add a text element to indicate this is a placeholder
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', (bbox.width / 2).toString());
    text.setAttribute('y', (bbox.height / 2).toString());
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', 'rgba(59, 130, 246, 1)');
    text.setAttribute('font-size', Math.min(bbox.width / 10, bbox.height / 10, 16).toString());
    text.textContent = 'Image';
    
    pattern.appendChild(rect);
    pattern.appendChild(text);
    
    console.log(`Created fallback pattern for drawing ${drawingId}`);
  } catch (err) {
    console.error('Error creating fallback pattern:', err);
  }
};
