
import { useRef, useEffect } from 'react';
import { toast } from 'sonner';

export function useDrawingToolActivation(activeTool: string | null) {
  const editControlRef = useRef<any>(null);
  
  useEffect(() => {
    if (!activeTool || !editControlRef.current) return;
    
    const handleToolActivation = () => {
      try {
        console.log(`Activating tool: ${activeTool}`);
        
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
        if (!drawControl || !drawControl._toolbars || !drawControl._toolbars.draw) {
          console.error('Draw control or toolbar not initialized properly');
          return;
        }
        
        const handlers = drawControl._toolbars.draw._modes;
        if (!handlers) {
          console.error('Draw handlers not found');
          return;
        }
        
        // Disable all drawing modes first
        Object.keys(handlers).forEach(mode => {
          const handler = handlers[mode]?.handler;
          if (handler && handler.disable) {
            handler.disable();
          }
        });
        
        // Enable only the selected tool
        const selectedHandler = handlers[leafletTool]?.handler;
        if (selectedHandler && selectedHandler.enable) {
          selectedHandler.enable();
          console.log(`${activeTool} drawing mode activated successfully`);
          toast.info(`${activeTool} drawing mode activated`);
        } else {
          console.error(`Failed to find or activate handler for ${leafletTool}`);
        }
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
