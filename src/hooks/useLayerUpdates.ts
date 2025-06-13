
import { useCallback } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import { createLayerFromDrawing } from '@/components/map/drawing/LayerCreator';
import debounce from 'lodash/debounce';
import { getCurrentUser } from '@/services/auth-service';

interface LayerUpdatesProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  layersRef: Map<string, L.Layer>;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
  imageControlRoots: Map<string, any>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  isMounted: boolean;
}

export function useLayerUpdates({
  featureGroup,
  savedDrawings,
  activeTool,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  imageControlRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  isMounted
}: LayerUpdatesProps) {
  
  // The main update function that creates or updates layers
  const updateLayers = useCallback(() => {
    if (!featureGroup || !isMounted) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Filter drawings to only include ones that belong to the current user
    const userDrawings = savedDrawings.filter(drawing => drawing.userId === currentUser.id);
    
    // Clear out any layers that are no longer in the saved drawings
    const drawingIds = new Set(userDrawings.map(d => d.id));
    
    // Create array of entries to avoid modification during iteration
    Array.from(layersRef.entries()).forEach(([id, layer]) => {
      if (!drawingIds.has(id)) {
        // This drawing no longer exists, remove the layer
        featureGroup.removeLayer(layer);
        layersRef.delete(id);
        
        // Also clean up any React roots for this layer
        const removeRoot = removeButtonRoots.get(`${id}-remove`);
        if (removeRoot) {
          try {
            removeRoot.unmount();
          } catch (e) {
            console.error(`Error unmounting remove button root for ${id}:`, e);
          }
          removeButtonRoots.delete(`${id}-remove`);
        }
        
        const uploadRoot = uploadButtonRoots.get(`${id}-upload`);
        if (uploadRoot) {
          try {
            uploadRoot.unmount();
          } catch (e) {
            console.error(`Error unmounting upload button root for ${id}:`, e);
          }
          uploadButtonRoots.delete(`${id}-upload`);
        }
        
        const imageControlRoot = imageControlRoots.get(`${id}-controls`);
        if (imageControlRoot) {
          try {
            imageControlRoot.unmount();
          } catch (e) {
            console.error(`Error unmounting image control root for ${id}:`, e);
          }
          imageControlRoots.delete(`${id}-controls`);
        }
      }
    });
    
    // Create or update layers for each drawing
    userDrawings.forEach(drawing => {
      if (!layersRef.has(drawing.id)) {
        // This is a new drawing, create a layer for it
        createLayerFromDrawing({
          drawing,
          featureGroup,
          activeTool,
          isMounted,
          layersRef,
          removeButtonRoots,
          uploadButtonRoots,
          imageControlRoots,
          onRegionClick,
          onRemoveShape,
          onUploadRequest
        });
      }
    });
  }, [featureGroup, savedDrawings, activeTool, layersRef, removeButtonRoots, uploadButtonRoots, imageControlRoots, onRegionClick, onRemoveShape, onUploadRequest, isMounted]);
  
  // Create a debounced version of updateLayers for performance
  const debouncedUpdateLayers = useCallback(
    debounce(() => {
      if (isMounted) {
        updateLayers();
      }
    }, 150),
    [updateLayers, isMounted]
  );
  
  return { updateLayers, debouncedUpdateLayers };
}
