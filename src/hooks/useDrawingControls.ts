
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import L from 'leaflet';

export const useDrawingControls = (activeTool: string | null) => {
  const [drawControl, setDrawControl] = useState<any>(null);
  const [drawnLayers, setDrawnLayers] = useState<Record<string, L.Layer>>({});

  const editControlRef = useCallback((element: any) => {
    if (element) {
      console.log('EditControl ref received:', element);
      setDrawControl(element);
    }
  }, []);

  useEffect(() => {
    if (activeTool && drawControl) {
      console.log('Active drawing tool:', activeTool);
      
      try {
        if (drawControl._toolbars && drawControl._toolbars.draw) {
          const toolbar = drawControl._toolbars.draw;
          
          if (activeTool === 'polygon' || activeTool === 'rectangle' || activeTool === 'circle') {
            toolbar._modes.marker?.handler?.disable();
          }
          
          switch (activeTool) {
            case 'polygon':
              if (toolbar._modes.polygon && toolbar._modes.polygon.handler) {
                toolbar._modes.polygon.handler.enable();
              }
              break;
            case 'rectangle':
              if (toolbar._modes.rectangle && toolbar._modes.rectangle.handler) {
                toolbar._modes.rectangle.handler.enable();
              }
              break;
            case 'circle':
              if (toolbar._modes.circle && toolbar._modes.circle.handler) {
                toolbar._modes.circle.handler.enable();
              }
              break;
            case 'marker':
              if (toolbar._modes.marker && toolbar._modes.marker.handler) {
                toolbar._modes.marker.handler.enable();
              }
              break;
          }
        }
      } catch (error) {
        console.error('Error enabling drawing tool:', error);
      }
    }
  }, [activeTool, drawControl]);

  return {
    drawControl,
    drawnLayers,
    setDrawnLayers,
    editControlRef
  };
};
