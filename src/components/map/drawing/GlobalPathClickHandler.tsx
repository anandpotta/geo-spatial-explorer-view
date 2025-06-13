
import { useEffect } from 'react';

/**
 * Global click handler for SVG paths that ensures drawing clicks are properly handled
 */
const GlobalPathClickHandler = () => {
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as Element;
      
      console.log('🔍 GlobalPathClickHandler: Click detected on element:', target?.tagName, target?.className);
      
      // Check if this is a click on an SVG path with a drawing ID
      if (target?.tagName?.toLowerCase() === 'path' || target?.closest?.('path')) {
        const pathElement = target.tagName?.toLowerCase() === 'path' ? target : target.closest('path');
        const drawingId = pathElement?.getAttribute('data-drawing-id');
        
        console.log('🎯 GlobalPathClickHandler: Path element found:', pathElement);
        console.log('🏷️ GlobalPathClickHandler: Drawing ID:', drawingId);
        
        if (drawingId) {
          console.log(`🌐 GlobalPathClickHandler: Click detected on path for drawing ${drawingId}`);
          
          // Get the stored drawing handler
          const handlers = (window as any).drawingClickHandlers;
          console.log('🗂️ GlobalPathClickHandler: Available handlers:', handlers);
          console.log('🗂️ GlobalPathClickHandler: Handlers type:', typeof handlers);
          console.log('🗂️ GlobalPathClickHandler: Handlers size:', handlers ? handlers.size : 'N/A');
          
          if (handlers && handlers.has && handlers.has(drawingId)) {
            const { drawing, onRegionClick } = handlers.get(drawingId);
            
            console.log('✅ GlobalPathClickHandler: Handler found for drawing:', drawing);
            console.log('📞 GlobalPathClickHandler: onRegionClick function:', typeof onRegionClick);
            
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
          } else {
            console.warn(`❌ GlobalPathClickHandler: No handler found for drawing ${drawingId}`);
            console.log('🗂️ GlobalPathClickHandler: Available handler keys:', handlers ? Array.from(handlers.keys()) : 'No handlers map');
            console.log('🗂️ GlobalPathClickHandler: Attempting to initialize handlers map...');
            
            // Try to initialize the handlers map if it doesn't exist
            if (!handlers) {
              (window as any).drawingClickHandlers = new Map();
              console.log('🔧 GlobalPathClickHandler: Initialized empty handlers map');
            }
          }
        } else {
          console.log('❌ GlobalPathClickHandler: No drawing ID found on path element');
        }
      } else {
        console.log('ℹ️ GlobalPathClickHandler: Click not on a path element');
      }
    };
    
    console.log('🚀 GlobalPathClickHandler: Adding global click listener');
    
    // Add global click handler with capture to catch events early
    document.addEventListener('click', handleGlobalClick, true);
    
    return () => {
      console.log('🛑 GlobalPathClickHandler: Removing global click listener');
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);
  
  return null;
};

export default GlobalPathClickHandler;
