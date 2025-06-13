
import { useEffect } from 'react';

/**
 * Global click handler for SVG paths that ensures drawing clicks are properly handled
 */
const GlobalPathClickHandler = () => {
  useEffect(() => {
    // Initialize handlers map immediately if it doesn't exist
    if (!(window as any).drawingClickHandlers) {
      console.log('🔧 GlobalPathClickHandler: Initializing handlers map on mount');
      (window as any).drawingClickHandlers = new Map();
    }
    
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
          
          // Ensure handlers map exists
          if (!(window as any).drawingClickHandlers) {
            console.log('🔧 GlobalPathClickHandler: Creating missing handlers map');
            (window as any).drawingClickHandlers = new Map();
          }
          
          // Get the stored drawing handler
          const handlers = (window as any).drawingClickHandlers;
          console.log('🗂️ GlobalPathClickHandler: Handlers map details:', {
            exists: !!handlers,
            type: typeof handlers,
            size: handlers ? handlers.size : 'N/A',
            isMap: handlers instanceof Map,
            keys: handlers ? Array.from(handlers.keys()) : []
          });
          
          if (handlers && handlers.has && handlers.has(drawingId)) {
            const { drawing, onRegionClick } = handlers.get(drawingId);
            
            console.log('✅ GlobalPathClickHandler: Handler found for drawing:', drawing);
            console.log('📞 GlobalPathClickHandler: onRegionClick function:', typeof onRegionClick);
            console.log('📞 GlobalPathClickHandler: onRegionClick details:', onRegionClick);
            
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
            console.log('🗂️ GlobalPathClickHandler: Debug info:', {
              hasHandlers: !!handlers,
              handlerKeys: handlers ? Array.from(handlers.keys()) : 'No handlers',
              lookingFor: drawingId,
              hasMethod: handlers && typeof handlers.has === 'function',
              mapSize: handlers ? handlers.size : 'N/A'
            });
            
            // Additional debugging: check if any similar IDs exist
            if (handlers && handlers.keys) {
              const allKeys = Array.from(handlers.keys());
              console.log('🔍 GlobalPathClickHandler: Checking for similar IDs:', {
                targetId: drawingId,
                allStoredIds: allKeys,
                possibleMatches: allKeys.filter(key => key.includes(drawingId.substring(8)) || drawingId.includes(key.substring(8)))
              });
            }
          }
        } else {
          console.log('❌ GlobalPathClickHandler: No drawing ID found on path element');
          // Debug: check if path has any data attributes
          if (pathElement) {
            const attributes = Array.from(pathElement.attributes).map(attr => ({
              name: attr.name,
              value: attr.value
            }));
            console.log('🔍 GlobalPathClickHandler: Path element attributes:', attributes);
          }
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
