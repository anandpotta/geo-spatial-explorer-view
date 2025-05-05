
import { useEffect, useRef } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import L from 'leaflet';

interface UseLayerLifecycleProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  debouncedUpdateLayers: () => void;
  updateLayers: () => void;
  isMountedRef?: React.MutableRefObject<boolean>;
}

export function useLayerLifecycle({
  featureGroup,
  savedDrawings,
  activeTool,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  debouncedUpdateLayers,
  updateLayers,
  isMountedRef: externalMountedRef
}: UseLayerLifecycleProps) {
  // Use provided ref or create a new one
  const internalMountedRef = useRef<boolean>(true);
  const isMountedRef = externalMountedRef || internalMountedRef;
  
  const isInitialRenderRef = useRef(true);
  const lastDrawingsRef = useRef<DrawingData[]>([]);

  // Component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, [isMountedRef]);

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
  }, [savedDrawings, activeTool, updateLayers, debouncedUpdateLayers, isMountedRef]);

  return {
    isMountedRef
  };
}
