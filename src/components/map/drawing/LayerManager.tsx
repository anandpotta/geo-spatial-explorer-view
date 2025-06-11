
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
  const isInitialRenderRef = useRef(true);
  const lastDrawingsRef = useRef<DrawingData[]>([]);
  const renderCountRef = useRef(0);
  
  // Debug: Track renders
  renderCountRef.current += 1;
  
  // Get layer count using proper API
  let layerCount = 0;
  if (featureGroup) {
    featureGroup.eachLayer(() => {
      layerCount++;
    });
  }
  
  console.log(`LayerManager render #${renderCountRef.current}`, {
    savedDrawingsLength: savedDrawings.length,
    activeTool,
    featureGroupLayerCount: layerCount
  });
  
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

  // Component lifecycle
  useEffect(() => {
    console.log('LayerManager: Component mounted');
    isMountedRef.current = true;
    
    return () => {
      console.log('LayerManager: Component unmounting');
      isMountedRef.current = false;
      safeUnmountRoots();
      layersRef.current.clear();
    };
  }, []);

  // Use a more stable approach for detecting real changes to drawings
  useEffect(() => {
    console.log('LayerManager: savedDrawings/activeTool effect triggered', {
      isMounted: isMountedRef.current,
      savedDrawingsLength: savedDrawings.length,
      activeTool
    });
    
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
    safeUnmountRoots();
    
    // Only do a full update if drawings have changed or this is the first render
    const shouldForceUpdate = isInitialRenderRef.current || haveSavedDrawingsChanged();
    
    console.log('LayerManager: Update decision', {
      shouldForceUpdate,
      isInitialRender: isInitialRenderRef.current,
      drawingsChanged: haveSavedDrawingsChanged()
    });
    
    if (shouldForceUpdate) {
      // For initial render or when drawings change, use a short delay
      setTimeout(() => {
        if (isMountedRef.current) {
          console.log('LayerManager: Calling updateLayers (forced)');
          updateLayers();
          isInitialRenderRef.current = false;
          lastDrawingsRef.current = [...savedDrawings];
        }
      }, 100);
    } else if (activeTool === 'edit') {
      // For edit mode changes, use the debounced version
      console.log('LayerManager: Calling debouncedUpdateLayers (edit mode)');
      debouncedUpdateLayers();
    }
  }, [savedDrawings, activeTool, updateLayers, debouncedUpdateLayers]);

  // Listen for resize events which might affect positioning
  useEffect(() => {
    console.log('LayerManager: Setting up resize listener');
    
    const handleResize = () => {
      console.log('LayerManager: Resize event triggered');
      if (isMountedRef.current) {
        debouncedUpdateLayers();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      console.log('LayerManager: Removing resize listener');
      window.removeEventListener('resize', handleResize);
    };
  }, [debouncedUpdateLayers]);

  // Handle storage events for cross-tab updates
  useEffect(() => {
    console.log('LayerManager: Setting up storage listeners');
    
    const handleStorageUpdate = () => {
      console.log('LayerManager: Storage update event triggered');
      if (isMountedRef.current) {
        debouncedUpdateLayers();
      }
    };
    
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('floorPlanUpdated', handleStorageUpdate);
    
    // Also listen for visibility changes to update when tab becomes visible
    const handleVisibilityChange = () => {
      console.log('LayerManager: Visibility change event triggered', {
        visibilityState: document.visibilityState
      });
      if (document.visibilityState === 'visible' && isMountedRef.current) {
        debouncedUpdateLayers();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      console.log('LayerManager: Removing storage listeners');
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('floorPlanUpdated', handleStorageUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [debouncedUpdateLayers]);

  return null; // This is a non-visual component
};

export default LayerManager;
