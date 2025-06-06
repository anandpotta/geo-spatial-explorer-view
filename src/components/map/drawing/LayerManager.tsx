
import { useEffect, useRef } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';
import { useLayerReferences } from '@/hooks/useLayerReferences';

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
  const lastDrawingsHashRef = useRef<string>('');
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    removeButtonRoots,
    uploadButtonRoots,
    layersRef,
    imageControlRoots
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
    onUploadRequest
  });

  // Create a hash of the drawings to detect real changes
  const createDrawingsHash = (drawings: DrawingData[]) => {
    return drawings.map(d => `${d.id}-${d.geoJSON ? JSON.stringify(d.geoJSON) : ''}`).join('|');
  };

  // Safe unmounting of React roots
  const safeUnmountRoots = () => {
    const unmountRoot = (root: any) => {
      if (!root) return;
      try {
        if (root && typeof root.unmount === 'function') {
          root.unmount();
        }
      } catch (err) {
        console.error('Error unmounting root:', err);
      }
    };
    
    const safelyClearRoots = (rootsMap: Map<string, any>) => {
      if (!rootsMap) return;
      
      const entries = Array.from(rootsMap.entries());
      entries.forEach(([key, root]) => {
        unmountRoot(root);
        rootsMap.delete(key);
      });
    };
    
    safelyClearRoots(removeButtonRoots.current);
    safelyClearRoots(uploadButtonRoots.current);
    safelyClearRoots(imageControlRoots.current);
  };

  // Component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      safeUnmountRoots();
      layersRef.current.clear();
    };
  }, []);

  // Handle drawings changes with debouncing
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const currentHash = createDrawingsHash(savedDrawings);
    
    // Only update if drawings actually changed
    if (currentHash !== lastDrawingsHashRef.current) {
      console.log('Drawings changed, updating layers');
      lastDrawingsHashRef.current = currentHash;
      
      // Clear any pending updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Debounce the update
      updateTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          safeUnmountRoots();
          updateLayers();
        }
      }, 100);
    }
  }, [savedDrawings, updateLayers]);

  // Handle tool changes separately with shorter debounce
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        updateLayers();
      }
    }, 50);
  }, [activeTool, updateLayers]);

  return null;
};

export default LayerManager;
