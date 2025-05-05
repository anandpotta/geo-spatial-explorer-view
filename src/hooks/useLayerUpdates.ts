
import { useCallback } from 'react';
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
  // Use useCallback to ensure stable reference for the updateLayers function
  const updateLayers = useCallback(() => {
    if (!featureGroup || !isMountedRef.current) return;
    
    try {
      // Clear existing layers
      featureGroup.clearLayers();
      
      // Clear existing layer references
      layersRef.current.clear();
      
      // Create layers for each drawing
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
    } catch (err) {
      console.error('Error updating layers:', err);
    }
  }, [featureGroup, savedDrawings, activeTool, isMountedRef, layersRef, removeButtonRoots, uploadButtonRoots, imageControlRoots, onRegionClick, onRemoveShape, onUploadRequest]);

  return { updateLayers };
}
