
import { useEffect, useRef, forwardRef } from 'react';
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
  onClearAll?: () => void; // Add new prop for clearing all state
}

declare module 'leaflet' {
  interface Layer {
    drawingId?: string;
  }
}

// Convert to forwardRef to properly handle refs from parent components
const DrawingControls = forwardRef<L.FeatureGroup, DrawingControlsProps>(({ 
  onCreated, 
  activeTool, 
  onRegionClick, 
  onClearAll 
}, ref) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const { savedDrawings } = useDrawings();
  
  useEffect(() => {
    if (!featureGroupRef.current || !savedDrawings.length) return;
    
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

  // Sync the forwarded ref with our internal ref
  useEffect(() => {
    if (featureGroupRef.current) {
      // Handle ref as either a function or an object
      if (typeof ref === 'function') {
        ref(featureGroupRef.current);
      } else if (ref) {
        ref.current = featureGroupRef.current;
      }
    }
  }, [ref]);

  return (
    <FeatureGroup ref={featureGroupRef}>
      <DrawTools 
        onCreated={onCreated} 
        activeTool={activeTool} 
        onClearAll={onClearAll} 
      />
    </FeatureGroup>
  );
});

// Add display name for debugging
DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
