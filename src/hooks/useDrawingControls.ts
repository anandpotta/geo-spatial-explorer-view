
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import L from 'leaflet';

export const useDrawingControls = (activeTool: string | null) => {
  const [drawControl, setDrawControl] = useState<any>(null);
  const [drawnLayers, setDrawnLayers] = useState<Record<string, L.Layer>>({});

  const onDrawControlMounted = useCallback((drawingControl: any) => {
    if (drawingControl) {
      setDrawControl(drawingControl);
      console.log("Drawing control mounted:", drawingControl);
    }
  }, []);

  // Effect to handle active tool changes is now integrated into this function
  // which will run whenever drawControl or activeTool changes
  const activateDrawingTool = useCallback(() => {
    if (!activeTool || !drawControl) return;

    try {
      const toolbar = drawControl._toolbars?.draw;
      if (!toolbar) return;

      // Disable all handlers first
      Object.values(toolbar._modes).forEach((mode: any) => {
        if (mode.handler) {
          mode.handler.disable();
        }
      });

      // Enable the selected tool
      if (toolbar._modes[activeTool]?.handler) {
        const handler = toolbar._modes[activeTool].handler;
        
        // Ensure the handler is properly initialized
        if (typeof handler.enable === 'function') {
          handler.enable();
          console.log(`Enabled ${activeTool} drawing tool`);
          
          // For polyline, make sure we setup the right styling
          if (activeTool === 'polyline' && handler._poly) {
            handler._poly.setStyle({
              color: '#1EAEDB',
              weight: 4,
              opacity: 0.8
            });
          }
        } else {
          console.error(`Handler for ${activeTool} is not properly initialized`);
          toast.error('Drawing tool could not be enabled');
        }
      }
    } catch (error) {
      console.error('Error enabling drawing tool:', error);
      toast.error('Failed to enable drawing tool');
    }
  }, [activeTool, drawControl]);

  // Call activateDrawingTool whenever drawControl or activeTool changes
  if (drawControl && activeTool) {
    activateDrawingTool();
  }

  const clearDrawnShapes = useCallback(() => {
    Object.values(drawnLayers).forEach(layer => {
      try {
        if (layer) {
          if ('remove' in layer && typeof layer.remove === 'function') {
            layer.remove();
          }
        }
      } catch (err) {
        console.error('Error removing layer:', err);
      }
    });
    setDrawnLayers({});
  }, [drawnLayers]);

  return {
    drawControl,
    drawnLayers,
    setDrawnLayers,
    onDrawControlMounted,
    clearDrawnShapes
  };
};
