
import { useRef, useEffect } from 'react';
import { toast } from 'sonner';

export function useDrawingToolActivation(activeTool: string | null) {
  const editControlRef = useRef<any>(null);
  
  useEffect(() => {
    if (!activeTool) return;
    
    const handleDrawingActivation = () => {
      if (!editControlRef.current) {
        console.log('Edit control reference not available yet');
        return;
      }
      
      if (!editControlRef.current._toolbars || !editControlRef.current._toolbars.draw) {
        console.log('Drawing toolbar not initialized yet');
        return;
      }
      
      console.log('Activating drawing tool:', activeTool);
      
      // First, disable all drawing handlers safely
      try {
        Object.keys(editControlRef.current._toolbars.draw._modes).forEach(mode => {
          try {
            const handler = editControlRef.current._toolbars.draw._modes[mode].handler;
            if (handler && typeof handler.disable === 'function') {
              handler.disable();
            }
          } catch (err) {
            console.error('Error disabling drawing handler:', err);
          }
        });
      } catch (err) {
        console.error('Error accessing drawing handlers:', err);
      }
      
      // Then enable only the selected tool
      try {
        const toolMap: Record<string, string> = {
          'polygon': 'polygon',
          'marker': 'marker',
          'circle': 'circle',
          'rectangle': 'rectangle'
        };
        
        const leafletTool = toolMap[activeTool];
        
        if (leafletTool && 
            editControlRef.current._toolbars.draw._modes[leafletTool] && 
            editControlRef.current._toolbars.draw._modes[leafletTool].handler) {
          
          const handler = editControlRef.current._toolbars.draw._modes[leafletTool].handler;
          if (typeof handler.enable === 'function') {
            handler.enable();
          } else {
            console.error('Enable method not found on drawing handler');
          }
        }
      } catch (err) {
        console.error('Error enabling drawing tool:', err);
        toast.error('Failed to activate drawing tool. Please try again.');
      }
    };
    
    // Use a slightly longer timeout to ensure Leaflet is fully initialized
    const timer = setTimeout(handleDrawingActivation, 300);
    
    const toolMessages = {
      polygon: "Click on map to start drawing polygon",
      marker: "Click on map to place marker",
      circle: "Click on map to draw circle",
      rectangle: "Click on map to draw rectangle"
    };
    
    toast.info(toolMessages[activeTool as keyof typeof toolMessages] || "Drawing mode activated");
    
    return () => clearTimeout(timer);
  }, [activeTool]);

  return {
    editControlRef
  };
}
