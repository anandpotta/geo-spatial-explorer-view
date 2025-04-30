
import { useEffect } from 'react';
import { DrawingData } from '@/utils/drawing/types';
import L from 'leaflet';
import { createLayerFromDrawing } from '@/components/map/drawing/LayerCreator';

interface LayerUpdatesProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  isMountedRef: React.MutableRefObject<boolean>;
  layersRef: React.MutableRefObject<Map<string, L.Layer>>;
  removeButtonRoots: React.MutableRefObject<Map<string, any>>;
  uploadButtonRoots: React.MutableRefObject<Map<string, any>>;
  rotationControlRoots: React.MutableRefObject<Map<string, any>>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onRotateImage?: (drawingId: string, degrees: number) => void;
}

export function useLayerUpdates({
  featureGroup,
  savedDrawings,
  activeTool,
  isMountedRef,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  rotationControlRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onRotateImage
}: LayerUpdatesProps) {
  const updateLayers = () => {
    if (!featureGroup || !isMountedRef.current) return;
    
    try {
      // Clear existing layers and React roots
      featureGroup.clearLayers();
      
      removeButtonRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting root:', err);
        }
      });
      removeButtonRoots.current.clear();
      
      uploadButtonRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting upload button root:', err);
        }
      });
      uploadButtonRoots.current.clear();
      
      rotationControlRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting rotation control root:', err);
        }
      });
      rotationControlRoots.current.clear();
      
      layersRef.current.clear();
      
      // Create layers for each drawing
      savedDrawings.forEach(drawing => {
        createLayerFromDrawing({
          drawing,
          featureGroup,
          activeTool,
          isMounted: isMountedRef.current,
          layersRef: layersRef.current,
          removeButtonRoots: removeButtonRoots.current,
          uploadButtonRoots: uploadButtonRoots.current,
          rotationControlRoots: rotationControlRoots.current,
          onRegionClick,
          onRemoveShape,
          onUploadRequest,
          onRotateImage
        });
      });
    } catch (err) {
      console.error('Error updating layers:', err);
    }
  };

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
  }, []);

  useEffect(() => {
    if (!featureGroup || !isMountedRef.current) return;
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
      if (featureGroup && featureGroup.clearLayers) {
        try {
          featureGroup.clearLayers();
        } catch (err) {
          console.error('Error clearing layers on unmount:', err);
        }
      }
    };
  }, [savedDrawings, activeTool]);

  return { updateLayers };
}
