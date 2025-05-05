
import { useEffect } from 'react';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';
import { useLayerReferences } from '@/hooks/useLayerReferences';
import { DrawingData } from '@/utils/drawing-utils';
import { useLayerLifecycle } from '@/hooks/useLayerLifecycle';
import { useResizeHandler } from '@/hooks/useResizeHandler';
import { useStorageEvents } from '@/hooks/useStorageEvents';
import { safeUnmountRoots } from '@/utils/react-roots';
import L from 'leaflet';

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
  const {
    removeButtonRoots,
    uploadButtonRoots,
    layersRef,
    imageControlRoots
  } = useLayerReferences();

  const { updateLayers, debouncedUpdateLayers, isMountedRef } = useLayerUpdates({
    featureGroup,
    savedDrawings,
    activeTool,
    layersRef,
    removeButtonRoots: removeButtonRoots.current,
    uploadButtonRoots: uploadButtonRoots.current,
    imageControlRoots: imageControlRoots.current,
    onRegionClick,
    onRemoveShape,
    onUploadRequest
  });
  
  // Use our extracted hook for layer lifecycle management
  const { isMountedRef: lifecycleMountedRef } = useLayerLifecycle({
    featureGroup,
    savedDrawings,
    activeTool,
    onRegionClick,
    onRemoveShape,
    onUploadRequest,
    debouncedUpdateLayers,
    updateLayers,
    isMountedRef // Pass the isMountedRef from useLayerUpdates
  });

  // Use our extracted hooks for event handling
  useResizeHandler({ isMountedRef, debouncedUpdateLayers });
  useStorageEvents({ isMountedRef, debouncedUpdateLayers });

  // Clean up roots on unmount
  useEffect(() => {
    return () => {
      safeUnmountRoots(
        removeButtonRoots.current,
        uploadButtonRoots.current,
        imageControlRoots.current
      );
      layersRef.current.clear();
    };
  }, [layersRef, removeButtonRoots, uploadButtonRoots, imageControlRoots]);

  return null; // This is a non-visual component
};

export default LayerManager;
