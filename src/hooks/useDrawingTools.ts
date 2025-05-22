
import { useRef, useCallback, useState } from 'react';
import L from 'leaflet';

/**
 * Hook to manage drawing tools for the Leaflet map
 */
export function useDrawingTools(
  mapRef: React.MutableRefObject<L.Map | null>,
  drawnItemsRef: React.MutableRefObject<L.FeatureGroup | null>,
  activeTool: string | null
) {
  const [drawingControls, setDrawingControls] = useState<any>(null);
  const drawControlRef = useRef<any>(null);
  
  /**
   * Initialize the drawing controls on the map
   */
  const initDrawingControls = useCallback((map: L.Map, featureGroup: L.FeatureGroup) => {
    if (!map || !featureGroup) return;
    
    console.log("useDrawingTools: Initializing drawing controls with active tool:", activeTool);
    
    try {
      // Remove existing controls if any
      if (drawControlRef.current) {
        try {
          map.removeControl(drawControlRef.current);
        } catch (err) {
          console.error("Error removing existing draw control:", err);
        }
        drawControlRef.current = null;
      }
      
      // Configure drawing options based on active tool
      const drawOptions: any = {
        polyline: activeTool === 'polyline',
        polygon: activeTool === 'polygon',
        circle: activeTool === 'circle',
        rectangle: activeTool === 'rectangle',
        marker: activeTool === 'marker',
        circlemarker: false
      };
      
      // Create drawing control with proper edit options
      const drawControl = new L.Control.Draw({
        position: 'topright',
        draw: drawOptions,
        edit: {
          featureGroup: featureGroup,
          edit: activeTool === 'edit' ? {} : false,
          remove: activeTool === 'delete' ? {} : false
        }
      });
      
      // Add to map
      map.addControl(drawControl);
      drawControlRef.current = drawControl;
      setDrawingControls(drawControl);
      
      // Force visibility of drawing controls
      setTimeout(() => {
        const drawControls = document.querySelectorAll('.leaflet-draw-toolbar');
        drawControls.forEach((control: Element) => {
          (control as HTMLElement).style.display = 'block';
          (control as HTMLElement).style.visibility = 'visible';
          (control as HTMLElement).style.opacity = '1';
        });
      }, 500);
      
      return drawControl;
    } catch (error) {
      console.error("Error initializing drawing controls:", error);
    }
  }, [activeTool]);
  
  return { 
    initDrawingControls, 
    drawingControls 
  };
}
