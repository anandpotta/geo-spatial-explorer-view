
/**
 * Utilities for managing attributes on SVG elements with clip masks
 */
import { getCurrentUser } from '@/services/auth-service';
import { storeOriginalAttributes } from '../clip-mask-attributes';

/**
 * Prepares a path element for a clip mask by setting necessary attributes
 */
export const preparePathForClipMask = (
  pathElement: SVGPathElement, 
  drawingId: string
): void => {
  // Get current user
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot apply clip mask: user not logged in');
    return;
  }
  
  // Store original path data and style for potential restoration
  storeOriginalAttributes(pathElement);
  
  // Mark as having clip mask (prevents race conditions)
  pathElement.setAttribute('data-has-clip-mask', 'true');
  pathElement.setAttribute('data-last-updated', Date.now().toString());
  pathElement.setAttribute('data-drawing-id', drawingId);
  pathElement.setAttribute('data-user-id', currentUser.id);
  
  // Add a visible outline to help see the path
  pathElement.classList.add('visible-path-stroke');
  
  // Set a loading class to indicate that an image is being loaded
  pathElement.classList.add('loading-clip-mask');
  
  // Set default values for transformation
  pathElement.setAttribute('data-image-rotation', '0');
  pathElement.setAttribute('data-image-scale', '1');
  pathElement.setAttribute('data-image-offset-x', '0');
  pathElement.setAttribute('data-image-offset-y', '0');
};
