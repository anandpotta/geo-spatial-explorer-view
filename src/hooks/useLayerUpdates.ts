
import { useCallback } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import { createLayerFromDrawing } from '@/components/map/drawing/LayerCreator';
import debounce from 'lodash/debounce';
import { getCurrentUser } from '@/services/auth-service';

interface LayerUpdatesProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  isMountedRef: React.RefObject<boolean>;
  layersRef: React.MutableRefObject<Map<string, L.Layer>>;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
  imageControlRoots: Map<string, any>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
}

export function useLayerUpdates({
  featureGroup,
  savedDrawings,
  activeTool,
  isMountedRef,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  imageControlRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest
}: LayerUpdatesProps) {
  
  // The main update function that creates or updates layers
  const updateLayers = useCallback(() => {
    if (!featureGroup || !isMountedRef.current) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    console.log(`Updating layers for user: ${currentUser.id}, drawings:`, savedDrawings.length);
    
    // Filter drawings to only include ones that belong to the current user
    const userDrawings = savedDrawings.filter(drawing => drawing.userId === currentUser.id);
    console.log(`User drawings found: ${userDrawings.length}`);
    
    // Clear out any layers that are no longer in the saved drawings
    const drawingIds = new Set(userDrawings.map(d => d.id));
    
    // Create array of entries to avoid modification during iteration
    Array.from(layersRef.current.entries()).forEach(([id, layer]) => {
      if (!drawingIds.has(id)) {
        console.log(`Removing layer for deleted drawing: ${id}`);
        // This drawing no longer exists, remove the layer
        featureGroup.removeLayer(layer);
        layersRef.current.delete(id);
        
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
      if (!layersRef.current.has(drawing.id)) {
        console.log(`Creating new layer for drawing: ${drawing.id}`);
        // This is a new drawing, create a layer for it
        createLayerFromDrawing({
          drawing,
          featureGroup,
          activeTool,
          isMounted: isMountedRef.current,
          layersRef: layersRef.current,
          removeButtonRoots,
          uploadButtonRoots,
          imageControlRoots,
          onRegionClick,
          onRemoveShape,
          onUploadRequest
        });
      } else {
        console.log(`Layer already exists for drawing: ${drawing.id}`);
      }
    });
    
    console.log(`Layer update complete. Total layers: ${layersRef.current.size}`);
  }, [featureGroup, savedDrawings, activeTool, isMountedRef, layersRef, removeButtonRoots, uploadButtonRoots, imageControlRoots, onRegionClick, onRemoveShape, onUploadRequest]);
  
  // Create a debounced version of updateLayers for performance
  const debouncedUpdateLayers = useCallback(
    debounce(() => {
      if (isMountedRef.current) {
        updateLayers();
      }
    }, 150),
    [updateLayers, isMountedRef]
  );
  
  return { updateLayers, debouncedUpdateLayers };
}
