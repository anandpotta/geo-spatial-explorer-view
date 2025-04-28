
import { useEffect, useRef } from 'react';
import { FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { createDrawingLayer, getDefaultDrawingOptions } from '@/utils/leaflet-drawing-config';
import DrawTools from '../DrawTools';
import { getSavedMarkers } from '@/utils/marker-utils';
import OverlayFloorPlan from '../OverlayFloorPlan';

interface DrawingCanvasProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  savedDrawings: DrawingData[];
  drawingsWithFloorPlans: DrawingData[];
}

const DrawingCanvas = ({
  onCreated,
  activeTool,
  onRegionClick,
  onClearAll,
  savedDrawings,
  drawingsWithFloorPlans
}: DrawingCanvasProps) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawToolsRef = useRef<any>(null);

  useEffect(() => {
    if (!featureGroupRef.current || !savedDrawings.length) return;
    
    featureGroupRef.current.clearLayers();
    const markers = getSavedMarkers();
    
    savedDrawings.forEach(drawing => {
      if (drawing.geoJSON) {
        try {
          const layer = createDrawingLayer(drawing, getDefaultDrawingOptions(drawing.properties.color));
          
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
  }, [savedDrawings, onRegionClick]);

  return (
    <FeatureGroup ref={featureGroupRef}>
      <DrawTools 
        ref={drawToolsRef}
        onCreated={onCreated} 
        activeTool={activeTool} 
        onClearAll={onClearAll} 
      />
      
      {drawingsWithFloorPlans.map(drawing => {
        const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
        const floorPlan = floorPlans[drawing.id];
        
        if (floorPlan && floorPlan.data && !floorPlan.isPdf && drawing.coordinates) {
          return (
            <OverlayFloorPlan 
              key={drawing.id}
              drawingId={drawing.id}
              coordinates={drawing.coordinates}
              floorPlanUrl={floorPlan.data}
              onBack={() => {}} // Add empty onBack handler to fix build error
            />
          );
        }
        return null;
      })}
    </FeatureGroup>
  );
};

export default DrawingCanvas;
