
import { useRef, useEffect } from 'react';
import { toast } from 'sonner';

export function useDrawingToolActivation(activeTool: string | null) {
  const editControlRef = useRef<any>(null);
  
  useEffect(() => {
    if (!activeTool || !editControlRef.current) return;
    
    const handleToolActivation = () => {
      try {
        // Map Leaflet tool names to our custom tool names
        const toolMap: Record<string, string> = {
          'marker': 'marker',
          'polygon': 'polygon',
          'rectangle': 'rectangle',
          'circle': 'circle'
        };
        
        const leafletTool = toolMap[activeTool];
        
        if (!leafletTool) {
          console.warn(`Unsupported tool: ${activeTool}`);
          return;
        }
        
        const drawControl = editControlRef.current;
        const handlers = drawControl._toolbars.draw._modes;
        
        // Disable all drawing modes first
        Object.keys(handlers).forEach(mode => {
          const handler = handlers[mode].handler;
          if (handler && handler.disable) {
            handler.disable();
          }
        });
        
        // Enable only the selected tool
        const selectedHandler = handlers[leafletTool]?.handler;
        if (selectedHandler && selectedHandler.enable) {
          selectedHandler.enable();
        }
        
        toast.info(`${activeTool} drawing mode activated`);
      } catch (error) {
        console.error('Error activating drawing tool:', error);
        toast.error('Failed to activate drawing tool');
      }
    };
    
    // Use a timeout to ensure Leaflet is fully initialized
    const timer = setTimeout(handleToolActivation, 300);
    
    return () => clearTimeout(timer);
  }, [activeTool]);
  
  return { editControlRef };
}
