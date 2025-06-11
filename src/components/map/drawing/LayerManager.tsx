
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
    onRegionClick: (drawing: DrawingData) => {
      console.log('Region clicked in LayerManager:', drawing.id);
      
      // Immediately trigger the upload request to show the upload screen
      if (onUploadRequest) {
        console.log('Triggering upload request for drawing:', drawing.id);
        onUploadRequest(drawing.id);
        
        // Add a small delay to ensure the upload screen is triggered
        setTimeout(() => {
          if (onRegionClick) {
            console.log('Calling onRegionClick for drawing:', drawing.id);
            onRegionClick(drawing);
          }
        }, 50);
      } else if (onRegionClick) {
        // Fallback if no upload request handler
        console.log('Calling onRegionClick for drawing:', drawing.id);
        onRegionClick(drawing);
      }
    },
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
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      safeUnmountRoots();
      layersRef.current.clear();
    };
  }, []);

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
    safeUnmountRoots();
    
    // Only do a full update if drawings have changed or this is the first render
    const shouldForceUpdate = isInitialRenderRef.current || haveSavedDrawingsChanged();
    
    if (shouldForceUpdate) {
      // For initial render or when drawings change, use a short delay
      setTimeout(() => {
        if (isMountedRef.current) {
          updateLayers();
          isInitialRenderRef.current = false;
          lastDrawingsRef.current = [...savedDrawings];
        }
      }, 100);
    } else if (activeTool === 'edit') {
      // For edit mode changes, use the debounced version
      debouncedUpdateLayers();
    }
  }, [savedDrawings, activeTool, updateLayers, debouncedUpdateLayers]);

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
