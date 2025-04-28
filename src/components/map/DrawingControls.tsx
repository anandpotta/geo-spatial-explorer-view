
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import { createDrawingLayer, getDefaultDrawingOptions } from '@/utils/leaflet-drawing-config';
import DrawTools from './DrawTools';
import { getSavedMarkers } from '@/utils/marker-utils';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
}

declare module 'leaflet' {
  interface Layer {
    drawingId?: string;
  }
}

const DrawingControls = forwardRef(({ onCreated, activeTool, onRegionClick, onClearAll }: DrawingControlsProps, ref) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawToolsRef = useRef<any>(null);
  const { savedDrawings } = useDrawings();
  
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current
  }));
  
  // Track drawings that have floor plans
  useEffect(() => {
    // This ensures floor plans are loaded when DrawingControls is mounted
    getDrawingIdsWithFloorPlans();
    
    const handleFloorPlanUpdated = () => {
      // This will trigger a re-render when floor plans are updated
      if (featureGroupRef.current) {
        // Re-add layers to reflect updated styling for drawings with floor plans
        updateLayers();
      }
    };
    
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    return () => {
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []);
  
  // Update layers when savedDrawings changes
  useEffect(() => {
    if (!featureGroupRef.current || !savedDrawings.length) return;
    updateLayers();
  }, [savedDrawings]);
  
  const updateLayers = () => {
    if (!featureGroupRef.current) return;
    
    featureGroupRef.current.clearLayers();
    const markers = getSavedMarkers();
    const drawingsWithFloorPlans = getDrawingIdsWithFloorPlans();
    
    savedDrawings.forEach(drawing => {
      if (drawing.geoJSON) {
        try {
          const associatedMarker = markers.find(m => m.associatedDrawing === drawing.id);
          const hasFloorPlan = drawingsWithFloorPlans.includes(drawing.id);
          
          // Customize options based on whether drawing has a floor plan
          const options = getDefaultDrawingOptions(drawing.properties.color);
          if (hasFloorPlan) {
            options.fillColor = '#3b82f6'; // Blue for drawings with floor plans
            options.fillOpacity = 0.4;
            options.color = '#1d4ed8';
          }
          
          const layer = createDrawingLayer(drawing, options);
          
          if (layer) {
            layer.eachLayer((l: L.Layer) => {
              if (l) {
                l.drawingId = drawing.id;
                
                if (onRegionClick) {
                  l.on('click', () => {
                    onRegionClick(drawing);
                  });
                }
              }
            });
            
            layer.addTo(featureGroupRef.current!);
          }
        } catch (err) {
          console.error('Error adding drawing layer:', err);
        }
      }
    });
  };

  return (
    <FeatureGroup ref={featureGroupRef}>
      <DrawTools 
        ref={drawToolsRef}
        onCreated={onCreated} 
        activeTool={activeTool} 
        onClearAll={onClearAll} 
      />
    </FeatureGroup>
  );
});

// Set display name
DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
