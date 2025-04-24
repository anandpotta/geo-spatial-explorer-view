
import { useEffect, useRef } from 'react';
import { FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import { createDrawingLayer, getDefaultDrawingOptions } from '@/utils/leaflet-drawing-config';
import DrawTools from './DrawTools';

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
  const featureGroupRef = useRef<any>(null);
  const { savedDrawings } = useDrawings();
  
  useEffect(() => {
    if (!featureGroupRef.current || !savedDrawings.length) return;
    
    featureGroupRef.current.clearLayers();
    
    savedDrawings.forEach(drawing => {
      if (drawing.geoJSON) {
        const layer = createDrawingLayer(drawing, getDefaultDrawingOptions(drawing.properties.color));
        
        if (layer) {
          layer.eachLayer((l: L.Layer) => {
            if (l) {
              l.drawingId = drawing.id;
              
              if (onRegionClick) {
                l.on('click', () => {
                  console.log('Layer clicked:', drawing.id);
                  onRegionClick(drawing);
                });
              }
            }
          });
          
          layer.addTo(featureGroupRef.current);
          
          if (drawing.properties.name) {
            layer.bindPopup(drawing.properties.name);
          }
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
