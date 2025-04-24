
import { useEffect, useRef } from 'react';
import { FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import { createDrawingLayer, getDefaultDrawingOptions } from '@/utils/leaflet-drawing-config';
import DrawTools from './DrawTools';
import { getSavedMarkers } from '@/utils/marker-utils';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
}

declare module 'leaflet' {
  interface Layer {
    drawingId?: string;
  }
}

const DrawingControls = ({ onCreated, activeTool, onRegionClick }: DrawingControlsProps) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const { savedDrawings } = useDrawings();
  
  useEffect(() => {
    if (!featureGroupRef.current || !savedDrawings.length) return;
    
    // Clear existing layers first
    featureGroupRef.current.clearLayers();
    const markers = getSavedMarkers();
    
    savedDrawings.forEach(drawing => {
      if (drawing.geoJSON) {
        try {
          const associatedMarker = markers.find(m => m.associatedDrawing === drawing.id);
          const layer = createDrawingLayer(drawing, getDefaultDrawingOptions(drawing.properties.color));
          
          if (layer) {
            layer.eachLayer((l: L.Layer) => {
              if (l) {
                l.drawingId = drawing.id;
                
                if (onRegionClick && associatedMarker) {
                  l.on('click', () => {
                    onRegionClick(drawing);
                  });
                }
              }
            });
            
            layer.addTo(featureGroupRef.current!);
            
            if (associatedMarker) {
              layer.bindPopup(associatedMarker.name);
            }
          }
        } catch (err) {
          console.error('Error adding drawing layer:', err);
        }
      }
    });
  }, [savedDrawings, onRegionClick]);

  return (
    <FeatureGroup ref={featureGroupRef}>
      <DrawTools onCreated={onCreated} activeTool={activeTool} />
    </FeatureGroup>
  );
};

export default DrawingControls;
