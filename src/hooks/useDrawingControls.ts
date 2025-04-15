
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import L from 'leaflet';

export const useDrawingControls = (activeTool: string | null) => {
  const [drawControl, setDrawControl] = useState<any>(null);
  const [drawnLayers, setDrawnLayers] = useState<Record<string, L.Layer>>({});

  const editControlRef = useCallback((element: any) => {
    if (element) {
      setDrawControl(element);
    }
  }, []);

  useEffect(() => {
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
        toolbar._modes[activeTool].handler.enable();
        console.log(`Enabled ${activeTool} drawing tool`);
      }
    } catch (error) {
      console.error('Error enabling drawing tool:', error);
      toast.error('Failed to enable drawing tool');
    }
  }, [activeTool, drawControl]);

  return {
    drawControl,
    drawnLayers,
    setDrawnLayers,
    editControlRef
  };
};
