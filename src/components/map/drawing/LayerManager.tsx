
import { useEffect, useCallback } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import L from 'leaflet';
import { createLayerControls } from './LayerControls';
import { useLayerReferences } from '@/hooks/useLayerReferences';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';

interface LayerManagerProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onClearAll?: () => void;
}

const LayerManager = ({
  featureGroup,
  savedDrawings,
  activeTool,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onClearAll
}: LayerManagerProps) => {
  const {
    isMountedRef,
    removeButtonRoots,
    uploadButtonRoots,
    imageControlRoots,
    layersRef
  } = useLayerReferences();

  const { updateLayers } = useLayerUpdates({
    featureGroup,
    savedDrawings,
    activeTool,
    isMountedRef,
    layersRef,
    removeButtonRoots: removeButtonRoots.current,
    uploadButtonRoots: uploadButtonRoots.current,
    imageControlRoots: imageControlRoots.current,
    onRegionClick,
    onRemoveShape,
    onUploadRequest,
    onClearAll
  });

  // Call updateLayers when dependencies change
  useEffect(() => {
    if (featureGroup && isMountedRef.current) {
      updateLayers();
    }
  }, [featureGroup, savedDrawings, activeTool, updateLayers]);

  // Configure layer controls
  useEffect(() => {
    const handleAddLayer = (e: any) => {
      const layer = e.layer;
      const drawingId = layer.drawingId;
      
      if (drawingId && isMountedRef.current) {
        createLayerControls({
          layer,
          drawingId,
          activeTool,
          featureGroup,
          uploadButtonRoots: uploadButtonRoots.current,
          removeButtonRoots: removeButtonRoots.current,
          imageControlRoots: imageControlRoots.current,
          isMounted: isMountedRef.current,
          onUploadRequest: (id) => {
            if (onUploadRequest) onUploadRequest(id);
          },
          onRemoveShape: (id) => {
            if (onRemoveShape) onRemoveShape(id);
          },
          onClearAll
        });
      }
    };

    if (featureGroup) {
      featureGroup.on('layeradd', handleAddLayer);
    }

    return () => {
      if (featureGroup) {
        featureGroup.off('layeradd', handleAddLayer);
      }
    };
  }, [featureGroup, activeTool, onUploadRequest, onRemoveShape, onClearAll, isMountedRef, removeButtonRoots, uploadButtonRoots, imageControlRoots]);

  return null;
};

export default LayerManager;
