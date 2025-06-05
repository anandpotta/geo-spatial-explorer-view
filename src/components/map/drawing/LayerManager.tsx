
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
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  
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
  }, [removeButtonRoots, uploadButtonRoots, imageControlRoots]);

  // Component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      safeUnmountRoots();
      layersRef.current.clear();
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [safeUnmountRoots, layersRef]);

  // Stable update function with heavy debouncing
  const performUpdate = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        updateLayers();
        isInitialRenderRef.current = false;
        lastDrawingsRef.current = [...savedDrawings];
      }
    }, 500); // Increased debounce time
  }, [updateLayers, savedDrawings]);

  // Use a more stable approach for detecting real changes to drawings
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Helper function to check if drawings have actually changed
    const haveSavedDrawingsChanged = () => {
      if (savedDrawings.length !== lastDrawingsRef.current.length) {
        return true;
      }
      
      // Check if the IDs match
      const currentIds = new Set(savedDrawings.map(d => d.id));
      return lastDrawingsRef.current.some(d => !currentIds.has(d.id));
    };
    
    // Only do a full update if drawings have changed or this is the first render
    const shouldForceUpdate = isInitialRenderRef.current || haveSavedDrawingsChanged();
    
    if (shouldForceUpdate) {
      // First safely unmount any existing roots to prevent conflicts
      safeUnmountRoots();
      performUpdate();
    }
  }, [savedDrawings.length, performUpdate, safeUnmountRoots]); // Only depend on length to avoid full object comparison

  // Handle active tool changes separately with less aggressive updates
  useEffect(() => {
    if (!isMountedRef.current || isInitialRenderRef.current) return;
    
    if (activeTool === 'edit') {
      // For edit mode changes, use the debounced version
      debouncedUpdateLayers();
    }
  }, [activeTool, debouncedUpdateLayers]);

  // Listen for resize events which might affect positioning
  useEffect(() => {
    const handleResize = () => {
      if (isMountedRef.current && !isInitialRenderRef.current) {
        debouncedUpdateLayers();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [debouncedUpdateLayers]);

  // Handle storage events for cross-tab updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      if (isMountedRef.current && !isInitialRenderRef.current) {
        debouncedUpdateLayers();
      }
    };
    
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('floorPlanUpdated', handleStorageUpdate);
    
    // Also listen for visibility changes to update when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMountedRef.current && !isInitialRenderRef.current) {
        debouncedUpdateLayers();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('floorPlanUpdated', handleStorageUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [debouncedUpdateLayers]);

  return null; // This is a non-visual component
};

export default LayerManager;
