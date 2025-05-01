
import { useEffect, useRef } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';

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
  const isMountedRef = useRef<boolean>(true);
  const layersRef = useRef<Map<string, L.Layer>>(new Map());
  const removeButtonRoots = useRef<Map<string, any>>(new Map());
  const uploadButtonRoots = useRef<Map<string, any>>(new Map());
  const imageControlRoots = useRef<Map<string, any>>(new Map());

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
    onUploadRequest
  });

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Unmount all React roots
      removeButtonRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting root:', err);
        }
      });
      
      uploadButtonRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting upload button root:', err);
        }
      });
      
      imageControlRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting image control root:', err);
        }
      });
    };
  }, []);

  // Re-render layers when drawings or activeTool changes
  useEffect(() => {
    if (isMountedRef.current) {
      updateLayers();
    }
  }, [savedDrawings, activeTool]);

  return null; // This is a non-visual component
};

export default LayerManager;
