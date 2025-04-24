
import { useEffect, useRef, useState } from 'react';
import { FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import { createDrawingLayer, getDefaultDrawingOptions } from '@/utils/leaflet-drawing-config';
import DrawTools from './DrawTools';
import { getSavedMarkers } from '@/utils/marker-utils';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
}

const DrawingControls = ({ 
  onCreated, 
  activeTool, 
  onRegionClick, 
  onClearAll 
}: DrawingControlsProps) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const { savedDrawings } = useDrawings();
  const [wasCleared, setWasCleared] = useState(false);
  
  // Load saved drawings when component mounts
  useEffect(() => {
    if (featureGroupRef.current && savedDrawings.length > 0) {
      // Clear existing layers first
      featureGroupRef.current.clearLayers();
      
      // Add saved drawings to the feature group
      savedDrawings.forEach(drawing => {
        const layer = createDrawingLayer(drawing, getDefaultDrawingOptions(drawing.properties.color));
        if (layer) {
          layer.addTo(featureGroupRef.current!);
        }
      });
    }
  }, [savedDrawings]);
  
  return (
    <FeatureGroup ref={featureGroupRef}>
      <DrawTools 
        onCreated={onCreated} 
        activeTool={activeTool}
        onClearAll={onClearAll}
      />
    </FeatureGroup>
  );
};

export default DrawingControls;
