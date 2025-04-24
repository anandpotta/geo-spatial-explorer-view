
import { useRef, useEffect } from 'react';
import { toast } from 'sonner';

export function useDrawingToolActivation(activeTool: string | null) {
  const editControlRef = useRef<any>(null);
  
  useEffect(() => {
    if (!activeTool) return;
    
    const handleDrawingActivation = () => {
      if (editControlRef.current && editControlRef.current._toolbars && editControlRef.current._toolbars.draw) {
        console.log('Activating drawing tool:', activeTool);
        
        // First, disable all drawing handlers
        Object.keys(editControlRef.current._toolbars.draw._modes).forEach(mode => {
          try {
            const handler = editControlRef.current._toolbars.draw._modes[mode].handler;
            if (handler && handler.disable) {
              handler.disable();
            }
          } catch (err) {
            console.error('Error disabling drawing handler:', err);
          }
        });
        
        // Then enable only the selected tool
        try {
          const toolMap: Record<string, string> = {
            'polygon': 'polygon',
            'marker': 'marker',
            'circle': 'circle',
            'rectangle': 'rectangle'
          };
          
          const leafletTool = toolMap[activeTool];
          
          if (leafletTool && editControlRef.current._toolbars.draw._modes[leafletTool]) {
            const handler = editControlRef.current._toolbars.draw._modes[leafletTool].handler;
            if (handler && handler.enable) {
              handler.enable();
            }
          }
        } catch (err) {
          console.error('Error enabling drawing tool:', err);
        }
      }
    };
    
    const timer = setTimeout(handleDrawingActivation, 100);
    
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
