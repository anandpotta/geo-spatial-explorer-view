
import { useEffect, useCallback } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import L from 'leaflet';
import { createLayerFromDrawing } from '@/components/map/drawing/LayerCreator';
import { safelyDisableEditForLayer, safelyCleanupFeatureGroup } from '@/utils/leaflet';

interface LayerUpdatesProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  isMountedRef: React.MutableRefObject<boolean>;
  layersRef: React.MutableRefObject<Map<string, L.Layer>>;
  removeButtonRoots: React.MutableRefObject<Map<string, any>>;
  uploadButtonRoots: React.MutableRefObject<Map<string, any>>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
}

export function useLayerUpdates({
  featureGroup,
  savedDrawings,
  activeTool,
  isMountedRef,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest
}: LayerUpdatesProps) {
  const safelyUnmountRoot = useCallback((root: any) => {
    if (!root) return;
    try {
      if (root.unmount && typeof root.unmount === 'function') {
        root.unmount();
      }
    } catch (err) {
      console.error('Error unmounting root:', err);
    }
  }, []);
  
  const updateLayers = useCallback(() => {
    if (!featureGroup || !isMountedRef.current) return;
    
    // Use a small delay to ensure the DOM is ready
    setTimeout(() => {
      if (!isMountedRef.current) return;
      
      try {
        // Safely disable editing on all layers first
        try {
          layersRef.current.forEach(layer => {
            safelyDisableEditForLayer(layer);
          });
        } catch (err) {
          console.error('Error disabling layer editing before update:', err);
        }
        
        // Safely clear existing layers with proper error handling
        try {
          safelyCleanupFeatureGroup(featureGroup);
        } catch (err) {
          console.error('Error clearing feature group layers:', err);
        }
        
        // Safely unmount all React roots
        removeButtonRoots.current.forEach(root => {
          safelyUnmountRoot(root);
        });
        removeButtonRoots.current.clear();
        
        uploadButtonRoots.current.forEach(root => {
          safelyUnmountRoot(root);
        });
        uploadButtonRoots.current.clear();
        
        layersRef.current.clear();
        
        // Create layers for each drawing
        savedDrawings.forEach(drawing => {
          try {
            if (!isMountedRef.current) return;
            
            createLayerFromDrawing({
              drawing,
              featureGroup,
              activeTool,
              isMounted: isMountedRef.current,
              layersRef: layersRef.current,
              removeButtonRoots: removeButtonRoots.current,
              uploadButtonRoots: uploadButtonRoots.current,
              onRegionClick,
              onRemoveShape,
              onUploadRequest
            });
          } catch (err) {
            console.error(`Error creating layer for drawing ${drawing.id}:`, err);
          }
        });
      } catch (err) {
        console.error('Error updating layers:', err);
      }
    }, 0);
  }, [featureGroup, savedDrawings, activeTool, isMountedRef, layersRef, removeButtonRoots, uploadButtonRoots, onRegionClick, onRemoveShape, onUploadRequest, safelyUnmountRoot]);

  // Listen for marker updates to ensure drawings stay visible
  useEffect(() => {
    const handleMarkerUpdated = () => {
      if (isMountedRef.current) {
        // Small delay to ensure storage is updated first
        setTimeout(updateLayers, 50);
      }
    };
    
    window.addEventListener('markersUpdated', handleMarkerUpdated);
    return () => {
      window.removeEventListener('markersUpdated', handleMarkerUpdated);
    };
  }, [updateLayers, isMountedRef]);

  useEffect(() => {
    if (!featureGroup || !isMountedRef.current) return;
    
    // Add a check to ensure featureGroup has required methods
    if (!featureGroup.clearLayers || typeof featureGroup.clearLayers !== 'function') {
      console.error('Feature group is missing clearLayers method');
      return;
    }
    
    updateLayers();
    
    // Also update layers when storage changes
    const handleStorageChange = () => {
      if (isMountedRef.current) {
        updateLayers();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      
      // Only try to clean up if the component is still mounted
      if (!isMountedRef.current) return;
      
      // Safely disable editing on all layers first
      try {
        layersRef.current.forEach(layer => {
          safelyDisableEditForLayer(layer);
        });
      } catch (err) {
        console.error('Error disabling layer editing on unmount:', err);
      }
      
      // Only try to clear layers if the featureGroup is still valid
      if (featureGroup && featureGroup.clearLayers && typeof featureGroup.clearLayers === 'function') {
        try {
          safelyCleanupFeatureGroup(featureGroup);
        } catch (err) {
          console.error('Error clearing layers on unmount:', err);
        }
      }
    };
  }, [savedDrawings, activeTool, updateLayers, featureGroup, isMountedRef, layersRef, safelyUnmountRoot]);

  return { updateLayers };
}
