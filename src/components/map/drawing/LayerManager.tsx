
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
  const unmountPendingRef = useRef(false);
  
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

  // Safe unmounting of React roots - now implemented as a useCallback
  const safeUnmountRoots = useCallback(() => {
    if (unmountPendingRef.current) return; // Prevent multiple unmount attempts
    
    unmountPendingRef.current = true;
    
    // Use requestAnimationFrame to ensure we're outside React's rendering cycle
    requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      
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
      
      unmountPendingRef.current = false;
    });
  }, [removeButtonRoots, uploadButtonRoots, imageControlRoots]);

  // Component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      safeUnmountRoots();
      layersRef.current.clear();
    };
  }, [safeUnmountRoots]);

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
    
    // First safely unmount any existing roots to prevent conflicts
    // This now runs outside of the render cycle
    safeUnmountRoots();
    
    // Only do a full update if drawings have changed or this is the first render
    const shouldForceUpdate = isInitialRenderRef.current || haveSavedDrawingsChanged();
    
    if (shouldForceUpdate) {
      // For initial render or when drawings change, use a short delay
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          updateLayers();
          isInitialRenderRef.current = false;
          lastDrawingsRef.current = [...savedDrawings];
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else if (activeTool === 'edit') {
      // For edit mode changes, use the debounced version
      debouncedUpdateLayers();
    }
  }, [savedDrawings, activeTool, updateLayers, debouncedUpdateLayers, safeUnmountRoots]);

  // Listen for resize events which might affect positioning
  useEffect(() => {
    const handleResize = () => {
      if (isMountedRef.current) {
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
      if (isMountedRef.current) {
        debouncedUpdateLayers();
      }
    };
    
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('floorPlanUpdated', handleStorageUpdate);
    
    // Also listen for visibility changes to update when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isMountedRef.current) {
        debouncedUpdateLayers();
      }
    });
    
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('floorPlanUpdated', handleStorageUpdate);
      document.removeEventListener('visibilitychange', handleStorageUpdate);
    };
  }, [debouncedUpdateLayers]);

  return null; // This is a non-visual component
};

export default LayerManager;
