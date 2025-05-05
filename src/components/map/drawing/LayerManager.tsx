
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

  // Safe unmounting of React roots
  const safeUnmountRoots = () => {
    // Unmount all React roots in a safe way
    const unmountRoot = (root: any) => {
      if (!root) return;
      try {
        // Check if the unmount method exists before calling it
        if (root && typeof root.unmount === 'function') {
          root.unmount();
        }
      } catch (err) {
        console.error('Error unmounting root:', err);
      }
    };
    
    // Safely clear all roots
    const safelyClearRoots = (rootsMap: Map<string, any>) => {
      if (!rootsMap) return;
      
      // Create array of entries to avoid modification during iteration
      const entries = Array.from(rootsMap.entries());
      entries.forEach(([key, root]) => {
        unmountRoot(root);
        rootsMap.delete(key);
      });
    };
    
    // Clear all types of roots
    safelyClearRoots(removeButtonRoots.current);
    safelyClearRoots(uploadButtonRoots.current);
    safelyClearRoots(imageControlRoots.current);
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Use the safe unmounting function
      safeUnmountRoots();
      
      // Clear the layers reference
      layersRef.current.clear();
    };
  }, []);

  // Re-render layers when drawings or activeTool changes
  useEffect(() => {
    if (isMountedRef.current) {
      // First safely unmount any existing roots to prevent conflicts
      safeUnmountRoots();
      
      // Then update layers with a small delay to ensure unmounting is complete
      setTimeout(() => {
        if (isMountedRef.current) {
          updateLayers();
        }
      }, 10);
    }
  }, [savedDrawings, activeTool, updateLayers]);

  return null; // This is a non-visual component
};

export default LayerManager;
