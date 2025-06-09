
import { useEffect, useRef, useCallback } from 'react';
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
  const isInitialRenderRef = useRef(true);
  const lastDrawingsRef = useRef<DrawingData[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<number>(0);
  
  const {
    removeButtonRoots,
    uploadButtonRoots,
    layersRef,
    imageControlRoots
  } = useLayerReferences();

  const { updateLayers, debouncedUpdateLayers } = useLayerUpdates({
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
  const safeUnmountRoots = useCallback(() => {
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
  }, [removeButtonRoots, uploadButtonRoots, imageControlRoots]);

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
  }, [safeUnmountRoots, layersRef]);

  // Optimized drawing changes detection with aggressive debouncing
  const haveSavedDrawingsChanged = useCallback(() => {
    if (savedDrawings.length !== lastDrawingsRef.current.length) {
      return true;
    }
    
    const currentIds = new Set(savedDrawings.map(d => d.id));
    return lastDrawingsRef.current.some(d => !currentIds.has(d.id));
  }, [savedDrawings]);

  // Main update effect with aggressive loop prevention
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // More aggressive debouncing to prevent loops
    const now = Date.now();
    if (now - lastUpdateTime.current < 2000) { // Increased to 2 seconds
      console.log('Layer update debounced to prevent loops');
      return;
    }
    
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Check if we actually need to update
    const shouldForceUpdate = isInitialRenderRef.current || haveSavedDrawingsChanged();
    
    if (shouldForceUpdate) {
      console.log('Scheduling layer update');
      lastUpdateTime.current = now;
      
      // First safely unmount any existing roots to prevent conflicts
      safeUnmountRoots();
      
      // Schedule update with a much longer delay to prevent loops
      updateTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('Executing layer update');
          updateLayers();
          isInitialRenderRef.current = false;
          lastDrawingsRef.current = [...savedDrawings];
        }
      }, 500); // Increased delay
    } else if (activeTool === 'edit') {
      // For edit mode changes, use even longer debounce
      updateTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && (Date.now() - lastUpdateTime.current >= 2000)) {
          console.log('Executing debounced layer update for edit mode');
          lastUpdateTime.current = Date.now();
          debouncedUpdateLayers();
        }
      }, 1000); // Much longer delay for edit mode
    }
  }, [savedDrawings, activeTool, updateLayers, debouncedUpdateLayers, haveSavedDrawingsChanged, safeUnmountRoots]);

  // Handle resize events with much more aggressive debouncing
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (isMountedRef.current && (Date.now() - lastUpdateTime.current >= 2000)) {
          console.log('Handling resize event');
          lastUpdateTime.current = Date.now();
          debouncedUpdateLayers();
        }
      }, 1000); // Much longer debounce for resize
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [debouncedUpdateLayers]);

  // Handle storage events with much more aggressive debouncing
  useEffect(() => {
    let storageTimeout: NodeJS.Timeout;
    
    const handleStorageUpdate = () => {
      if (storageTimeout) clearTimeout(storageTimeout);
      storageTimeout = setTimeout(() => {
        if (isMountedRef.current && (Date.now() - lastUpdateTime.current >= 2000)) {
          console.log('Handling storage event in LayerManager');
          lastUpdateTime.current = Date.now();
          debouncedUpdateLayers();
        }
      }, 1000); // Much longer debounce
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMountedRef.current) {
        if (storageTimeout) clearTimeout(storageTimeout);
        storageTimeout = setTimeout(() => {
          if (isMountedRef.current && (Date.now() - lastUpdateTime.current >= 2000)) {
            console.log('Handling visibility change');
            lastUpdateTime.current = Date.now();
            debouncedUpdateLayers();
          }
        }, 1500); // Even longer delay for visibility change
      }
    };
    
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('floorPlanUpdated', handleStorageUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('floorPlanUpdated', handleStorageUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (storageTimeout) clearTimeout(storageTimeout);
    };
  }, [debouncedUpdateLayers]);

  return null;
};

export default LayerManager;
