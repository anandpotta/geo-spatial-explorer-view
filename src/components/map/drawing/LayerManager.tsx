
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getSavedMarkers } from '@/utils/marker-utils';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { createDrawingLayer, getDefaultDrawingOptions } from '@/utils/leaflet-drawing-config';
import { deleteDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import { createRoot } from 'react-dom/client';
import RemoveButton from './RemoveButton';

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
  const isMountedRef = useRef(true);
  const removeButtonRoots = useRef<Map<string, any>>(new Map());
  const layersRef = useRef<Map<string, L.Layer>>(new Map());

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Cleanup all React roots
      removeButtonRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting root:', err);
        }
      });
      removeButtonRoots.current.clear();
      layersRef.current.clear();
    };
  }, []);

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
    if (!featureGroup || !isMountedRef.current) return;
    
    try {
      // Clear existing layers and React roots
      featureGroup.clearLayers();
      removeButtonRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting root:', err);
        }
      });
      removeButtonRoots.current.clear();
      layersRef.current.clear();
      
      const markers = getSavedMarkers();
      const drawingsWithFloorPlans = getDrawingIdsWithFloorPlans();
      
      savedDrawings.forEach(drawing => {
        if (drawing.geoJSON && isMountedRef.current) {
          try {
            const associatedMarker = markers.find(m => m.associatedDrawing === drawing.id);
            const hasFloorPlan = drawingsWithFloorPlans.includes(drawing.id);
            
            const options = getDefaultDrawingOptions(drawing.properties.color);
            if (hasFloorPlan) {
              options.fillColor = '#3b82f6';
              options.fillOpacity = 0.4;
              options.color = '#1d4ed8';
            }
            
            // Always ensure opacity is set to visible values
            options.opacity = 1;
            options.fillOpacity = options.fillOpacity || 0.2;
            
            const layer = createDrawingLayer(drawing, options);
            
            if (layer) {
              layer.eachLayer((l: L.Layer) => {
                if (l && isMountedRef.current) {
                  (l as any).drawingId = drawing.id;
                  
                  // Store the layer reference
                  layersRef.current.set(drawing.id, l);
                  
                  // Always add the remove button when in edit mode
                  if (activeTool === 'edit' && isMountedRef.current) {
                    let buttonPosition;
                    if ('getLatLng' in l) {
                      buttonPosition = (l as L.Marker).getLatLng();
                    } else if ('getBounds' in l) {
                      buttonPosition = (l as any).getBounds().getNorthEast();
                    }
                    
                    if (buttonPosition) {
                      const container = document.createElement('div');
                      const buttonLayer = L.marker(buttonPosition, {
                        icon: L.divIcon({
                          className: 'remove-button-container',
                          html: container,
                          iconSize: [24, 24]
                        }),
                        interactive: true,
                        zIndexOffset: 1000
                      });
                      
                      if (isMountedRef.current) {
                        buttonLayer.addTo(featureGroup);
                        
                        try {
                          const root = createRoot(container);
                          removeButtonRoots.current.set(drawing.id, root);
                          root.render(
                            <RemoveButton onClick={() => handleRemoveShape(drawing.id)} />
                          );
                        } catch (err) {
                          console.error('Error rendering remove button:', err);
                        }
                      }
                    }
                  }
                  
                  // Always make clicking on a shape that has a floor plan trigger the handler
                  if (hasFloorPlan && onRegionClick && isMountedRef.current) {
                    l.on('click', () => {
                      if (isMountedRef.current) {
                        onRegionClick(drawing);
                      }
                    });
                  }
                }
              });
              
              if (isMountedRef.current) {
                layer.addTo(featureGroup);
              }
            }
          } catch (err) {
            console.error('Error adding drawing layer:', err);
          }
        }
      });
    } catch (err) {
      console.error('Error updating layers:', err);
    }
  };

  // Listen for marker updates to ensure drawings stay visible
  useEffect(() => {
    const handleMarkerUpdated = () => {
      if (isMountedRef.current) {
        // Small delay to ensure storage is updated first
        setTimeout(updateLayers, 50);
      }
    };
    
    window.addEventListener('markersUpdated', handleMarkerUpdated);
    return () => {
      window.removeEventListener('markersUpdated', handleMarkerUpdated);
    };
  }, []);

  useEffect(() => {
    if (!featureGroup || !isMountedRef.current) return;
    updateLayers();
    
    // Also update layers when storage changes
    const handleStorageChange = () => {
      if (isMountedRef.current) {
        updateLayers();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (featureGroup && featureGroup.clearLayers) {
        try {
          featureGroup.clearLayers();
        } catch (err) {
          console.error('Error clearing layers on unmount:', err);
        }
      }
    };
  }, [savedDrawings, activeTool]);

  return null;
};

export default LayerManager;
