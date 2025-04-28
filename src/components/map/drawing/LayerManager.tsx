
import { useEffect } from 'react';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getSavedMarkers } from '@/utils/marker-utils';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { createDrawingLayer, getDefaultDrawingOptions } from '@/utils/leaflet-drawing-config';
import { deleteDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import RemoveButton from './RemoveButton';
import { ReactDOM } from './ReactDOMUtils';

interface LayerManagerProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
}

const LayerManager = ({ 
  featureGroup, 
  savedDrawings, 
  activeTool,
  onRegionClick,
  onRemoveShape 
}: LayerManagerProps) => {
  const handleRemoveShape = (drawingId: string) => {
    deleteDrawing(drawingId);
    if (onRemoveShape) {
      onRemoveShape(drawingId);
    }
    updateLayers();
    toast.success('Shape removed successfully');
  };

  const updateLayers = () => {
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
                
                const container = L.DomUtil.create('div', 'relative');
                
                if (activeTool === 'edit') {
                  const removeButton = L.DomUtil.create('div', 'absolute z-50', container);
                  const removeButtonInstance = document.createElement('div');
                  removeButton.appendChild(removeButtonInstance);
                  
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
            
            layer.addTo(featureGroup);
          }
        } catch (err) {
          console.error('Error adding drawing layer:', err);
        }
      }
    });
  };

  useEffect(() => {
    if (!featureGroup || !savedDrawings.length) return;
    updateLayers();
  }, [savedDrawings, activeTool]);

  return null;
};

export default LayerManager;

