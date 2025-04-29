
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
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayerManagerProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
}

const LayerManager = ({ 
  featureGroup, 
  savedDrawings, 
  activeTool,
  onRegionClick,
  onRemoveShape,
  onUploadRequest
}: LayerManagerProps) => {
  const isMountedRef = useRef(true);
  const removeButtonRoots = useRef<Map<string, any>>(new Map());
  const uploadButtonRoots = useRef<Map<string, any>>(new Map());
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
      
      uploadButtonRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting upload button root:', err);
        }
      });
      uploadButtonRoots.current.clear();
      
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

  const handleUploadRequest = (drawingId: string) => {
    if (onUploadRequest) {
      onUploadRequest(drawingId);
    }
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
      
      uploadButtonRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting upload button root:', err);
        }
      });
      uploadButtonRoots.current.clear();
      
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
                  
                  // Add the remove and upload buttons when in edit mode
                  if (activeTool === 'edit' && isMountedRef.current) {
                    let buttonPosition;
                    let uploadButtonPosition;
                    
                    if ('getLatLng' in l) {
                      // For markers
                      buttonPosition = (l as L.Marker).getLatLng();
                      uploadButtonPosition = L.latLng(
                        buttonPosition.lat + 0.0001,
                        buttonPosition.lng
                      );
                    } else if ('getBounds' in l) {
                      // For polygons, rectangles, etc.
                      const bounds = (l as any).getBounds();
                      if (bounds) {
                        buttonPosition = bounds.getNorthEast();
                        uploadButtonPosition = L.latLng(
                          bounds.getNorthEast().lat,
                          bounds.getNorthEast().lng - 0.0002
                        );
                      }
                    } else if ('getLatLngs' in l) {
                      // For polylines or complex shapes
                      const latlngs = (l as any).getLatLngs();
                      if (latlngs && latlngs.length > 0) {
                        buttonPosition = Array.isArray(latlngs[0]) ? latlngs[0][0] : latlngs[0];
                        uploadButtonPosition = L.latLng(
                          buttonPosition.lat + 0.0001,
                          buttonPosition.lng
                        );
                      }
                    }
                    
                    if (buttonPosition) {
                      // Create remove button
                      const container = document.createElement('div');
                      container.className = 'remove-button-wrapper';
                      
                      const buttonLayer = L.marker(buttonPosition, {
                        icon: L.divIcon({
                          className: 'remove-button-container',
                          html: container,
                          iconSize: [24, 24],
                          iconAnchor: [12, 12]
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
                      
                      // Create upload button
                      if (uploadButtonPosition) {
                        const uploadContainer = document.createElement('div');
                        uploadContainer.className = 'upload-button-wrapper';
                        
                        const uploadButtonLayer = L.marker(uploadButtonPosition, {
                          icon: L.divIcon({
                            className: 'upload-button-container',
                            html: uploadContainer,
                            iconSize: [32, 32],
                            iconAnchor: [16, 16]
                          }),
                          interactive: true,
                          zIndexOffset: 1000
                        });
                        
                        if (isMountedRef.current) {
                          uploadButtonLayer.addTo(featureGroup);
                          
                          try {
                            const uploadRoot = createRoot(uploadContainer);
                            uploadButtonRoots.current.set(`${drawing.id}-upload`, uploadRoot);
                            uploadRoot.render(
                              <Button 
                                onClick={() => handleUploadRequest(drawing.id)} 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 rounded-full p-1 h-8 w-8"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            );
                          } catch (err) {
                            console.error('Error rendering upload button:', err);
                          }
                        }
                      }
                    }
                  }
                  
                  // Make clicking on any shape trigger the click handler
                  if (onRegionClick && isMountedRef.current) {
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
