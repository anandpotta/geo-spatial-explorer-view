
import { useCallback, useRef } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import L from 'leaflet';
import { createLayerFromDrawing } from '@/components/map/drawing/LayerCreator';

interface LayerUpdatesProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  isMountedRef: React.MutableRefObject<boolean>;
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
  // Use a ref for debouncing
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef<boolean>(false);
  
  // Use useCallback to ensure stable reference for the updateLayers function
  const updateLayers = useCallback(() => {
    if (!featureGroup || !isMountedRef.current) return;
    
    // Clear any existing timeout to prevent multiple updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    // If already updating, defer this update
    if (isUpdatingRef.current) {
      updateTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          updateLayers();
        }
      }, 100);
      return;
    }
    
    // Set updating flag
    isUpdatingRef.current = true;
    
    try {
      // Clear existing layers without triggering too many redraws
      featureGroup.eachLayer(layer => {
        // Don't remove editing handlers
        if (!(layer as any)._toolbarClassName) {
          featureGroup.removeLayer(layer);
        }
      });
      
      // Clear existing layer references
      layersRef.current.clear();
      
      // Create layers for each drawing
      if (isMountedRef.current) {
        savedDrawings.forEach(drawing => {
          if (!isMountedRef.current) return;
          
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
        });
      }
    } catch (err) {
      console.error('Error updating layers:', err);
    } finally {
      // Reset updating flag with a short delay to prevent immediate re-entry
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  }, [featureGroup, savedDrawings, activeTool, isMountedRef, layersRef, removeButtonRoots, uploadButtonRoots, imageControlRoots, onRegionClick, onRemoveShape, onUploadRequest]);

  // Add a new debounced update function that's safer to call frequently
  const debouncedUpdateLayers = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        updateLayers();
      }
    }, 100);
  }, [updateLayers, isMountedRef]);

  return { updateLayers, debouncedUpdateLayers };
}
