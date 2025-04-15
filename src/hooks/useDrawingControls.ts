
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import L from 'leaflet';

export const useDrawingControls = (activeTool: string | null) => {
  const [drawControl, setDrawControl] = useState<any>(null);
  const [drawnLayers, setDrawnLayers] = useState<Record<string, L.Layer>>({});
  // Use refs to track mounting and previous active tool state
  const controlMountedRef = useRef(false);
  const prevActiveToolRef = useRef<string | null>(null);
  const toolEnabledRef = useRef<string | null>(null);

  const onDrawControlMounted = useCallback((drawingControl: any) => {
    if (drawingControl && !controlMountedRef.current) {
      controlMountedRef.current = true;
      setDrawControl(drawingControl);
      console.log("Drawing control mounted:", drawingControl);
    }
  }, []);

  // Use useEffect to handle activeTool changes
  useEffect(() => {
    // Skip if no active tool or draw control
    if (!drawControl) return;
    
    // Skip if tool hasn't changed or we've already enabled this tool
    if (activeTool === toolEnabledRef.current) return;
    
    // Update the tool enabled ref
    toolEnabledRef.current = activeTool;
    prevActiveToolRef.current = activeTool;
    
    try {
      const toolbar = drawControl._toolbars?.draw;
      if (!toolbar) return;

      // Disable all handlers first
      Object.values(toolbar._modes).forEach((mode: any) => {
        if (mode.handler) {
          mode.handler.disable();
        }
      });

      // Enable the selected tool if we have an active tool
      if (activeTool && toolbar._modes[activeTool]?.handler) {
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
