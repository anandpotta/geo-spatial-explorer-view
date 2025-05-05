
import { useEffect } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import L from 'leaflet';
import { createLayerFromDrawing } from '@/components/map/drawing/LayerCreator';
import { ImageTransformOptions } from '@/utils/image-transform-utils';

interface LayerUpdatesProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  isMountedRef: React.MutableRefObject<boolean>;
  layersRef: React.MutableRefObject<Map<string, L.Layer>>;
  removeButtonRoots: React.MutableRefObject<Map<string, any>>;
  uploadButtonRoots: React.MutableRefObject<Map<string, any>>;
  imageControlsRoots: React.MutableRefObject<Map<string, any>>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onImageTransform?: (drawingId: string, options: Partial<ImageTransformOptions>) => void;
}

export function useLayerUpdates({
  featureGroup,
  savedDrawings,
  activeTool,
  isMountedRef,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  imageControlsRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onImageTransform
}: LayerUpdatesProps) {
  const safelyUnmountRoot = (root: any) => {
    if (!root) return;
    try {
      if (root.unmount && typeof root.unmount === 'function') {
        root.unmount();
      }
    } catch (err) {
      console.error('Error unmounting root:', err);
    }
  };
  
  const updateLayers = () => {
    if (!featureGroup || !isMountedRef.current) return;
    
    try {
      // Safely clear existing layers with proper error handling
      try {
        featureGroup.clearLayers();
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
      
      imageControlsRoots.current.forEach(root => {
        safelyUnmountRoot(root);
      });
      imageControlsRoots.current.clear();
      
      layersRef.current.clear();
      
      // Create layers for each drawing
      savedDrawings.forEach(drawing => {
        try {
          createLayerFromDrawing({
            drawing,
            featureGroup,
            activeTool,
            isMounted: isMountedRef.current,
            layersRef: layersRef.current,
            removeButtonRoots: removeButtonRoots.current,
            uploadButtonRoots: uploadButtonRoots.current,
            imageControlsRoots: imageControlsRoots.current,
            onRegionClick,
            onRemoveShape,
            onUploadRequest,
            onImageTransform
          });
        } catch (err) {
          console.error(`Error creating layer for drawing ${drawing.id}:`, err);
        }
      });
      
      // Additional step: ensure drawing controls remain visible after layer updates
      setTimeout(() => {
        try {
          const drawControls = document.querySelectorAll('.leaflet-draw.leaflet-control');
          drawControls.forEach(control => {
            (control as HTMLElement).style.display = 'block';
            (control as HTMLElement).style.visibility = 'visible';
            (control as HTMLElement).style.opacity = '1';
            (control as HTMLElement).style.zIndex = '12000';
          });
        } catch (err) {
          console.error('Error ensuring draw controls visibility:', err);
        }
      }, 100);
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
    
    const handleImageUpdated = () => {
      if (isMountedRef.current) {
        // Update layers when an image is uploaded or changed
        setTimeout(updateLayers, 50);
      }
    };
    
    const handleFloorPlanUpdated = (event: CustomEvent) => {
      if (isMountedRef.current) {
        // Update layers when a floor plan is uploaded or changed
        console.log('Floor plan updated for drawing:', event.detail?.drawingId);
        setTimeout(updateLayers, 50);
      }
    };
    
    // Add event listener for z-index interference
    const handleZIndexChange = () => {
      if (!isMountedRef.current) return;
      
      // Ensure drawing controls are visible
      setTimeout(() => {
        try {
          const drawControls = document.querySelectorAll('.leaflet-draw.leaflet-control');
          drawControls.forEach(control => {
            (control as HTMLElement).style.display = 'block';
            (control as HTMLElement).style.visibility = 'visible';
            (control as HTMLElement).style.opacity = '1';
            (control as HTMLElement).style.zIndex = '12000';
          });
        } catch (err) {
          console.error('Error handling z-index change:', err);
        }
      }, 100);
    };
    
    window.addEventListener('markersUpdated', handleMarkerUpdated);
    window.addEventListener('image-uploaded', handleImageUpdated as EventListener);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    window.addEventListener('click', handleZIndexChange);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkerUpdated);
      window.removeEventListener('image-uploaded', handleImageUpdated as EventListener);
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
      window.removeEventListener('click', handleZIndexChange);
    };
  }, []);

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
    
    // Set up an interval to ensure controls remain visible
    const visibilityInterval = setInterval(() => {
      if (!isMountedRef.current) return;
      
      try {
        const drawControls = document.querySelectorAll('.leaflet-draw.leaflet-control');
        drawControls.forEach(control => {
          (control as HTMLElement).style.display = 'block';
          (control as HTMLElement).style.visibility = 'visible';
          (control as HTMLElement).style.opacity = '1';
          (control as HTMLElement).style.zIndex = '12000';
        });
      } catch (err) {
        console.error('Error in visibility interval:', err);
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(visibilityInterval);
      
      // Only try to clear layers if the featureGroup is still valid
      if (featureGroup && featureGroup.clearLayers && typeof featureGroup.clearLayers === 'function') {
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
