
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getSavedMarkers } from '@/utils/marker-utils';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { createDrawingLayer, getDefaultDrawingOptions } from '@/utils/leaflet-drawing-config';
import { deleteDrawing, saveDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import RemoveButton from './RemoveButton';
import ReactDOM from 'react-dom/client';

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
  // Track mounted state to avoid updates after component unmount
  const isMountedRef = useRef(true);
  
  // Clean up all React portals and event listeners
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Listen for drawing image updates
  useEffect(() => {
    const handleDrawingImageUpdate = (event: CustomEvent) => {
      const { drawingId, imageUrl } = event.detail;
      
      // Find the drawing and update it
      const drawingToUpdate = savedDrawings.find(d => d.id === drawingId);
      if (drawingToUpdate) {
        const updatedDrawing = {
          ...drawingToUpdate,
          imageUrl: imageUrl
        };
        
        // Save the updated drawing
        saveDrawing(updatedDrawing);
        
        // Update the displayed layers
        updateLayers();
      }
    };
    
    // Add event listener
    window.addEventListener('updateDrawingImage', handleDrawingImageUpdate as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('updateDrawingImage', handleDrawingImageUpdate as EventListener);
    };
  }, [savedDrawings]);

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
          
          // Pass the image URL to the drawing layer if available
          if (drawing.imageUrl) {
            options.imageUrl = drawing.imageUrl;
          }
          
          const layer = createDrawingLayer(drawing, options);
          
          if (layer) {
            layer.eachLayer((l: L.Layer) => {
              if (l && isMountedRef.current) {
                // Ensure each layer has the drawingId
                (l as any).drawingId = drawing.id;
                
                // Add remove button in edit mode
                if (activeTool === 'edit' && isMountedRef.current) {
                  // Get the center point for the remove button
                  let buttonPosition;
                  if ('getLatLng' in l) {
                    buttonPosition = (l as L.Marker).getLatLng();
                  } else if ('getBounds' in l) {
                    buttonPosition = (l as any).getBounds().getNorthEast();
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
                    
                    // Add the button layer to the feature group
                    if (isMountedRef.current) {
                      buttonLayer.addTo(featureGroup);
                      
                      // Use setTimeout to ensure the DOM element is available
                      setTimeout(() => {
                        const container = document.querySelector('.remove-button-placeholder');
                        if (container && isMountedRef.current) {
                          try {
                            const root = ReactDOM.createRoot(container as HTMLElement);
                            root.render(
                              <RemoveButton onClick={() => handleRemoveShape(drawing.id)} />
                            );
                          } catch (err) {
                            console.error('Error rendering remove button:', err);
                          }
                        }
                      }, 0);
                    }
                  }
                }
                
                // Add click handler for region
                if (onRegionClick && isMountedRef.current) {
                  l.on('click', () => {
                    if (isMountedRef.current) {
                      onRegionClick(drawing);
                    }
                  });
                }
              }
            });
            
            // Add the layer to the feature group
            if (isMountedRef.current) {
              layer.addTo(featureGroup);
            }
          }
        } catch (err) {
          console.error('Error adding drawing layer:', err);
        }
      }
    });
  };

  // Update layers when savedDrawings or activeTool changes
  useEffect(() => {
    if (!featureGroup || !isMountedRef.current) return;
    
    console.log('Updating layers, active tool:', activeTool);
    updateLayers();
    
    return () => {
      // Cleanup function to ensure we don't update layers after unmount
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
