
import { useCallback, useRef } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import L from 'leaflet';
import { createLayerFromDrawing } from '@/components/map/drawing/LayerCreator';

interface LayerUpdatesProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
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
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  imageControlRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest
}: LayerUpdatesProps) {
  // Use refs for debouncing and tracking updates
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef<boolean>(false);
  const lastUpdateTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  
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
      }, 200);
      return;
    }
    
    // Throttle updates to prevent too frequent redrawing
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    if (timeSinceLastUpdate < 1000 && updateCountRef.current > 2) {
      // If we've updated too many times recently, delay more aggressively
      const delay = Math.min(1000, 200 * Math.pow(1.5, updateCountRef.current - 2));
      updateTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          updateLayers();
        }
      }, delay);
      return;
    }
    
    // Set updating flag
    isUpdatingRef.current = true;
    updateCountRef.current++;
    lastUpdateTimeRef.current = now;
    
    try {
      // Check for existing layers first to avoid unnecessary redraws
      const existingLayerIds = new Set<string>();
      featureGroup.eachLayer(layer => {
        const drawingId = (layer as any).drawingId;
        if (drawingId) {
          existingLayerIds.add(drawingId);
        }
      });
      
      // Only process drawings that are not already represented
      const drawingsToProcess = savedDrawings.filter(drawing => 
        !existingLayerIds.has(drawing.id) || !layersRef.current.has(drawing.id)
      );
      
      // If no new drawings to process and we have all existing ones, skip the update
      if (drawingsToProcess.length === 0 && existingLayerIds.size === savedDrawings.length) {
        isUpdatingRef.current = false;
        return;
      }
      
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
      }, 250);
    }
  }, [featureGroup, savedDrawings, activeTool, layersRef, removeButtonRoots, uploadButtonRoots, imageControlRoots, onRegionClick, onRemoveShape, onUploadRequest]);

  // Add a new debounced update function that's safer to call frequently
  const debouncedUpdateLayers = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Use progressive backoff based on update frequency
    const delay = updateCountRef.current > 5 ? 500 : 250;
    
    updateTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        updateLayers();
      }
    }, delay);
  }, [updateLayers]);

  return { updateLayers, debouncedUpdateLayers, isMountedRef };
}
