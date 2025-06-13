
import { useEffect } from 'react';

/**
 * Global click handler for SVG paths that ensures drawing clicks are properly handled
 */
const GlobalPathClickHandler = () => {
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if this is a click on an SVG path with a drawing ID
      if (target?.tagName?.toLowerCase() === 'path' || target?.closest?.('path')) {
        const pathElement = target.tagName?.toLowerCase() === 'path' ? target : target.closest('path');
        const drawingId = pathElement?.getAttribute('data-drawing-id');
        
        if (drawingId) {
          console.log(`🌐 GlobalPathClickHandler: Click detected on path for drawing ${drawingId}`);
          
          // Get the stored drawing handler
          const handlers = (window as any).drawingClickHandlers;
          if (handlers && handlers.has(drawingId)) {
            const { drawing, onRegionClick } = handlers.get(drawingId);
            
            // Stop the event
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
            
            console.log(`📞 GlobalPathClickHandler: Calling onRegionClick for drawing ${drawingId}`);
            
            try {
              onRegionClick(drawing);
              console.log(`✅ GlobalPathClickHandler: Successfully called onRegionClick for drawing ${drawingId}`);
            } catch (err) {
              console.error(`❌ GlobalPathClickHandler: Error calling onRegionClick for drawing ${drawingId}:`, err);
            }
          }
        }
      }
    };
    
    // Add global click handler with capture to catch events early
    document.addEventListener('click', handleGlobalClick, true);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);
  
  return null;
};

export default GlobalPathClickHandler;
