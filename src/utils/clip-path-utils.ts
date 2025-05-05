
import { createSvgClipPath } from '@/utils/svg-path-utils';

/**
 * Applies an SVG clip path to an image container
 */
export const applyClipPathFromPathData = (
  svgElement: SVGElement,
  containerDiv: HTMLDivElement,
  pathElement: SVGElement,
  drawingId: string
): string | null => {
  if (!pathElement || !svgElement || !containerDiv) return null;
  
  try {
    // Get path data
    const pathData = pathElement.getAttribute('d');
    if (!pathData) return null;
    
    // Create a unique ID for the clip path
    const clipPathId = `clip-path-${drawingId}-${Date.now()}`;
    
    // Create clip path element
    const clipPathElement = createSvgClipPath(svgElement, pathData, clipPathId);
    if (!clipPathElement) return null;
    
    // Apply clip path to container
    containerDiv.style.clipPath = `url(#${clipPathId})`;
    // Use type assertion to apply webkit-prefixed property
    (containerDiv.style as any)['webkitClipPath'] = `url(#${clipPathId})`;
    
    // Log for debugging
    console.log(`Applied clip path: ${clipPathId} with path data: ${pathData.substring(0, 50)}...`);
    
    return clipPathId;
  } catch (err) {
    console.error('Error applying clip path:', err);
    return null;
  }
};

/**
 * Removes a clip path from SVG defs
 */
export const removeClipPath = (svgElement: SVGElement, clipPathId: string): void => {
  if (!svgElement || !clipPathId) return;
  
  try {
    const clipPath = svgElement.querySelector(`#${clipPathId}`);
    if (clipPath && clipPath.parentElement) {
      clipPath.parentElement.removeChild(clipPath);
    }
  } catch (err) {
    console.error('Error removing clip path:', err);
  }
};
