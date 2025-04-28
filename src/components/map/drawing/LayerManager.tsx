
import { useEffect } from 'react';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing';
import { getSavedMarkers } from '@/utils/marker-utils';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { createDrawingLayer, getDefaultDrawingOptions } from '@/utils/leaflet-drawing-config';

interface LayerManagerProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  onRegionClick?: (drawing: DrawingData) => void;
}

export function LayerManager({ featureGroup, savedDrawings, onRegionClick }: LayerManagerProps) {
  useEffect(() => {
    if (!featureGroup || !savedDrawings.length) return;
    
    featureGroup.clearLayers();
    const markers = getSavedMarkers();
    const drawingsWithFloorPlans = getDrawingIdsWithFloorPlans();
    
    savedDrawings.forEach(drawing => {
      if (drawing.geoJSON) {
        try {
          const associatedMarker = markers.find(m => m.associatedDrawing === drawing.id);
          const hasFloorPlan = drawingsWithFloorPlans.includes(drawing.id);
          
          const options = getDefaultDrawingOptions(drawing.properties.color);
          if (hasFloorPlan) {
            options.fillColor = '#3b82f6';
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
            
            layer.addTo(featureGroup);
          }
        } catch (err) {
          console.error('Error adding drawing layer:', err);
        }
      }
    });
  }, [featureGroup, savedDrawings, onRegionClick]);

  return null;
}
