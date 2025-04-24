
import { useEffect, useRef } from 'react';
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

declare module 'leaflet' {
  interface Layer {
    drawingId?: string;
  }
}

const DrawingControls = ({ onCreated, activeTool, onRegionClick, onClearAll }: DrawingControlsProps) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const { savedDrawings } = useDrawings();
  
  // Effect to update drawings whenever they change
  useEffect(() => {
    if (!featureGroupRef.current) return;
    
    try {
      console.log('Updating drawings in DrawingControls, count:', savedDrawings.length);
      
      // Clear existing layers
      featureGroupRef.current.clearLayers();
      
      // Only add layers if we have drawings
      if (savedDrawings.length > 0) {
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
                
                if (featureGroupRef.current) {
                  layer.addTo(featureGroupRef.current);
                }
              }
            } catch (err) {
              console.error('Error adding drawing layer:', err);
            }
          }
        });
      } else {
        console.log('No drawings to display');
      }
    } catch (err) {
      console.error('Error updating drawings:', err);
    }
  }, [savedDrawings, onRegionClick]);

  // Listen for clearing events and handle them
  useEffect(() => {
    const handleClearEvent = () => {
      console.log('Clear event received in DrawingControls');
      if (featureGroupRef.current) {
        console.log('Clearing all layers in feature group');
        featureGroupRef.current.clearLayers();
      }
      
      if (onClearAll) {
        onClearAll();
      }
    };
    
    window.addEventListener('clearAllDrawings', handleClearEvent);
    
    return () => {
      window.removeEventListener('clearAllDrawings', handleClearEvent);
    };
  }, [onClearAll]);

  // Listen for drawing tool activation events
  useEffect(() => {
    const handleDrawingToolActivation = (e: any) => {
      // Implement tool activation logic if needed
      console.log('Drawing tool activated:', e.detail?.tool);
    };
    
    window.addEventListener('activateDrawingTool', handleDrawingToolActivation);
    
    return () => {
      window.removeEventListener('activateDrawingTool', handleDrawingToolActivation);
    };
  }, []);

  // Add handler for clear all
  const handleClearAll = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    
    if (onClearAll) {
      onClearAll();
    }
  };

  return (
    <FeatureGroup ref={featureGroupRef}>
      <DrawTools 
        onCreated={onCreated} 
        activeTool={activeTool}
        onClearAll={handleClearAll}
      />
    </FeatureGroup>
  );
};

export default DrawingControls;
