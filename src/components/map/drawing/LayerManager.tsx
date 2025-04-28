
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
    if (!drawingId) {
      console.warn('Missing drawing ID for removal');
      return;
    }
    
    deleteDrawing(drawingId);
    if (onRemoveShape) {
      onRemoveShape(drawingId);
    }
    updateLayers();
    toast.success('Shape removed successfully');
  };

  const updateLayers = () => {
    if (!featureGroup) return;
    
    // Clear existing layers safely
    try {
      featureGroup.clearLayers();
    } catch (err) {
      console.error('Error clearing feature group layers:', err);
      return;
    }
    
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
                // Ensure each layer has the drawingId
                l.drawingId = drawing.id;
                
                // Add remove button in edit mode
                if (activeTool === 'edit') {
                  // Get the center point for the remove button
                  let buttonPosition;
                  if ('getLatLng' in l) {
                    buttonPosition = l.getLatLng();
                  } else if ('getBounds' in l) {
                    buttonPosition = l.getBounds().getNorthEast();
                  }
                  
                  if (buttonPosition) {
                    const buttonLayer = L.marker(buttonPosition, {
                      icon: L.divIcon({
                        className: 'remove-button-container',
                        html: '<div class="remove-button-placeholder"></div>',
                        iconSize: [24, 24]
                      }),
                      interactive: true,
                      zIndexOffset: 1000
                    });
                    
                    buttonLayer.addTo(featureGroup);
                    
                    // Use setTimeout to ensure the DOM element is available
                    setTimeout(() => {
                      const container = document.querySelector('.remove-button-placeholder');
                      if (container) {
                        const root = ReactDOM.createRoot(container);
                        root.render(
                          <RemoveButton 
                            onClick={() => handleRemoveShape(drawing.id)} 
                          />
                        );
                      }
                    }, 0);
                  }
                }
                
                // Add click handler for region
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
