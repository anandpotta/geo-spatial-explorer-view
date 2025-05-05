
import { useCallback, useEffect } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import L from 'leaflet';
import { ImageTransformOptions } from '@/utils/image-transform-utils';
import { useDrawControlsVisibility } from './useDrawControlsVisibility';
import { useLayerEventListeners } from './useLayerEventListeners';
import { useDrawControlInteractions } from './useDrawControlInteractions';
import { updateLayers as updateLayerUtil } from '@/utils/layer-update-utils';

interface LayerUpdatesProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  isMountedRef: React.MutableRefObject<boolean>;
  layersRef: React.MutableRefObject<Map<string, L.Layer>>;
  removeButtonRoots: React.MutableRefObject<Map<string, any>>;
  uploadButtonRoots: React.MutableRefObject<Map<string, any>>;
  imageControlsRoots: React.MutableRefObject<Map<string, any>>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onImageTransform?: (drawingId: string, options: Partial<ImageTransformOptions>) => void;
}

/**
 * Hook to manage layer updates and control visibility
 */
export function useLayerUpdates({
  featureGroup,
  savedDrawings,
  activeTool,
  isMountedRef,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  imageControlsRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onImageTransform
}: LayerUpdatesProps) {
  // Use the drawing controls visibility hook
  const { ensureDrawControlsVisibility } = useDrawControlsVisibility();
  
  // Create a memoized update layers function
  const updateLayers = useCallback(() => {
    updateLayerUtil({
      featureGroup,
      savedDrawings,
      activeTool,
      isMountedRef: isMountedRef.current,
      layersRef: layersRef.current,
      removeButtonRoots: removeButtonRoots.current,
      uploadButtonRoots: uploadButtonRoots.current,
      imageControlsRoots: imageControlsRoots.current,
      ensureDrawControlsVisibility,
      onRegionClick,
      onRemoveShape,
      onUploadRequest,
      onImageTransform
    });
  }, [
    featureGroup,
    savedDrawings,
    activeTool,
    isMountedRef,
    layersRef,
    removeButtonRoots,
    uploadButtonRoots,
    imageControlsRoots,
    ensureDrawControlsVisibility,
    onRegionClick,
    onRemoveShape,
    onUploadRequest,
    onImageTransform
  ]);
  
  // Use the layer event listeners hook
  useLayerEventListeners({
    isMountedRef,
    updateLayers,
    ensureDrawControlsVisibility
  });
  
  // Use the draw control interactions hook
  useDrawControlInteractions({
    isMountedRef,
    ensureDrawControlsVisibility
  });

  // Effect for updating layers when savedDrawings or activeTool changes
  useEffect(() => {
    if (!featureGroup || !isMountedRef.current) return;
    
    // Add a check to ensure featureGroup has required methods
    if (!featureGroup.clearLayers || typeof featureGroup.clearLayers !== 'function') {
      console.error('Feature group is missing clearLayers method');
      return;
    }
    
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
    };
  }, [featureGroup, savedDrawings, activeTool, isMountedRef, updateLayers]);

  return { updateLayers, ensureDrawControlsVisibility };
}
