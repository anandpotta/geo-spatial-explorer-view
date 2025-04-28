import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import { createDrawingLayer, getDefaultDrawingOptions } from '@/utils/leaflet-drawing-config';
import DrawTools from './DrawTools';
import { getSavedMarkers } from '@/utils/marker-utils';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import RemoveButton from './drawing/RemoveButton';
import { deleteDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import 'leaflet-draw/dist/leaflet.draw.css';
import { ReactDOM } from './drawing/ReactDOMUtils';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
}

declare module 'leaflet' {
  interface Layer {
    drawingId?: string;
  }
}

const DrawingControls = forwardRef(({ onCreated, activeTool, onRegionClick, onClearAll, onRemoveShape }: DrawingControlsProps, ref) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawToolsRef = useRef<any>(null);
  const { savedDrawings } = useDrawings();
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current
  }));
  
  useEffect(() => {
    getDrawingIdsWithFloorPlans();
    
    const handleFloorPlanUpdated = () => {
      if (featureGroupRef.current) {
        updateLayers();
      }
    };
    
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    return () => {
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []);
  
  useEffect(() => {
    if (!featureGroupRef.current || !savedDrawings.length) return;
    updateLayers();
  }, [savedDrawings]);
  
  const handleRemoveShape = (drawingId: string) => {
    if (!featureGroupRef.current) return;
    
    deleteDrawing(drawingId);
    if (onRemoveShape) {
      onRemoveShape(drawingId);
    }
    
    // Trigger a re-render of the layers
    updateLayers();
    toast.success('Shape removed successfully');
  };
  
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
                
                // Create a container for the layer and remove button
                const container = L.DomUtil.create('div', 'relative');
                
                // Add the remove button if editing is active
                if (activeTool === 'edit') {
                  const removeButton = L.DomUtil.create('div', 'absolute z-50', container);
                  const removeButtonInstance = document.createElement('div');
                  removeButton.appendChild(removeButtonInstance);
                  
                  // Render the RemoveButton component
                  const root = ReactDOM.createRoot(removeButtonInstance);
                  root.render(
                    <RemoveButton 
                      onClick={() => handleRemoveShape(drawing.id)} 
                    />
                  );
                }
                
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

DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
