
import { DrawingData } from '@/utils/drawing-utils';

/**
 * Creates and manages global handlers for drawing clicks
 */
export const createGlobalHandler = (
  drawing: DrawingData,
  isMounted: boolean,
  onRegionClick?: (drawing: DrawingData) => void
): string => {
  const globalHandlerName = `triggerDrawingClick_${drawing.id}`;
  
  // Store the handler globally so DOM events can access it
  (window as any)[globalHandlerName] = () => {
    console.log(`=== GLOBAL DRAWING CLICK TRIGGERED for drawing: ${drawing.id} ===`);
    if (isMounted && onRegionClick) {
      try {
        onRegionClick(drawing);
        console.log(`=== onRegionClick called successfully from global handler for drawing: ${drawing.id} ===`);
      } catch (error) {
        console.error(`Error calling onRegionClick from global handler for drawing ${drawing.id}:`, error);
      }
    } else {
      console.warn(`Cannot call onRegionClick from global handler - isMounted: ${isMounted}, onRegionClick: ${!!onRegionClick}`);
    }
  };
  
  console.log(`=== GLOBAL HANDLER CREATED: ${globalHandlerName} ===`);
  return globalHandlerName;
};

/**
 * Calls a global handler by name
 */
export const callGlobalHandler = (handlerName: string): boolean => {
  if ((window as any)[handlerName]) {
    try {
      (window as any)[handlerName]();
      return true;
    } catch (error) {
      console.error(`Error calling global handler ${handlerName}:`, error);
      return false;
    }
  }
  return false;
};
