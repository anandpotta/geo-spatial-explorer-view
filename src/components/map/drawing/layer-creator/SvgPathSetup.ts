
import { DrawingData } from '@/utils/drawing-utils';
import { getFloorPlanById } from '@/utils/floor-plan-utils';
import { applyImageClipMask } from '@/utils/svg-clip-mask';

export function setupSvgPath(
  drawing: DrawingData,
  isMounted: boolean,
  onUploadRequest?: (drawingId: string) => void,
  onRegionClick?: (drawing: DrawingData) => void
): void {
  const performSvgSetup = () => {
    setTimeout(() => {
      if (!isMounted) return;
      
      console.log(`Setting up SVG path for drawing: ${drawing.id}`);
      
      let pathElement: SVGPathElement | null = null;
      
      // Strategy 1: Find by existing data-drawing-id
      pathElement = document.querySelector(`path[data-drawing-id="${drawing.id}"]`) as SVGPathElement;
      
      // Strategy 2: Find by data-shape-type and match coordinates or other attributes
      if (!pathElement) {
        const shapePaths = document.querySelectorAll(`path[data-shape-type="${drawing.type}"]`);
        console.log(`Found ${shapePaths.length} paths with shape type ${drawing.type}`);
        
        if (shapePaths.length > 0) {
          pathElement = shapePaths[shapePaths.length - 1] as SVGPathElement;
          console.log(`Selected path element based on shape type: ${drawing.type}`);
        }
      }
      
      // Strategy 3: Find the most recent path without data-drawing-id
      if (!pathElement) {
        const allPaths = document.querySelectorAll('path.leaflet-interactive:not([data-drawing-id])');
        if (allPaths.length > 0) {
          pathElement = allPaths[allPaths.length - 1] as SVGPathElement;
          console.log(`Selected most recent path without drawing ID`);
        }
      }
      
      if (pathElement) {
        setupPathElement(pathElement, drawing, onUploadRequest, onRegionClick);
        loadFloorPlanForPath(pathElement, drawing);
      } else {
        console.error(`Could not find SVG path element for drawing: ${drawing.id}`);
        if (isMounted) {
          setTimeout(performSvgSetup, 500);
        }
      }
    }, 200);
  };
  
  performSvgSetup();
}

function setupPathElement(
  pathElement: SVGPathElement,
  drawing: DrawingData,
  onUploadRequest?: (drawingId: string) => void,
  onRegionClick?: (drawing: DrawingData) => void
): void {
  console.log(`Found path element for drawing ${drawing.id}, setting up attributes and click handler`);
  
  // Set the crucial data-drawing-id attribute
  pathElement.setAttribute('data-drawing-id', drawing.id);
  pathElement.setAttribute('data-user-id', drawing.userId || 'unknown');
  pathElement.style.cursor = 'pointer';
  pathElement.style.pointerEvents = 'all';
  
  // Remove any existing click listeners to avoid duplicates
  const existingHandler = (pathElement as any).__drawingClickHandler;
  if (existingHandler) {
    pathElement.removeEventListener('click', existingHandler);
  }
  
  // Create new click handler that triggers upload request immediately
  const clickHandler = (e: MouseEvent) => {
    console.log(`SVG Path clicked for drawing: ${drawing.id} - calling upload request`);
    e.stopPropagation();
    e.preventDefault();
    
    if (onUploadRequest) {
      console.log(`Triggering upload request from SVG path click for drawing: ${drawing.id}`);
      onUploadRequest(drawing.id);
    } else {
      console.error(`No onUploadRequest handler available for drawing: ${drawing.id}`);
    }
    
    if (onRegionClick) {
      console.log(`Calling onRegionClick from SVG path for drawing: ${drawing.id}`);
      onRegionClick(drawing);
    }
  };
  
  // Store reference to handler for cleanup
  (pathElement as any).__drawingClickHandler = clickHandler;
  
  // Add the click event listener with high priority
  pathElement.addEventListener('click', clickHandler, { 
    passive: false, 
    capture: true
  });
  
  console.log(`SVG path click handler successfully set up for drawing ${drawing.id}`);
}

async function loadFloorPlanForPath(pathElement: SVGPathElement, drawing: DrawingData): Promise<void> {
  const floorPlan = await getFloorPlanById(drawing.id);
  if (floorPlan && pathElement) {
    console.log(`Applying existing floor plan for drawing: ${drawing.id}`);
    applyImageClipMask(pathElement, floorPlan.data, drawing.id);
  }
}
