
import { useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';
import { DrawingData } from '@/utils/drawing-utils';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';

export interface DrawingControlsRef {
  getFeatureGroup: () => L.FeatureGroup;
  getDrawTools: () => any;
  activateEditMode: () => boolean;
  openFileUploadDialog: (drawingId: string) => void;
  getSvgPaths: () => string[];
}

export function useDrawingControls() {
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawToolsRef = useRef<any>(null);
  const mountedRef = useRef<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editActivationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activationAttemptCount, setActivationAttemptCount] = useState(0);

  const isMapValidCheck = () => {
    // Check if the feature group is attached to a valid map
    const featureGroup = featureGroupRef.current;
    try {
      const map = getMapFromLayer(featureGroup);
      if (!map || !(map as any)._loaded) {
        return false;
      }

      // Check if map container is valid
      if (!map.getContainer() || !document.body.contains(map.getContainer())) {
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error checking map validity:', err);
      return false;
    }
  };

  const activateEditMode = useCallback((): boolean => {
    if (!isMapValidCheck()) return false;
    
    // Clear any existing timeout
    if (editActivationTimeoutRef.current) {
      clearTimeout(editActivationTimeoutRef.current);
      editActivationTimeoutRef.current = null;
    }

    // Track attempts to prevent excessive logging
    setActivationAttemptCount(count => {
      const newCount = count + 1;
      
      try {
        if (!drawToolsRef.current) {
          // Only log on first few attempts
          if (newCount <= 3) {
            console.log("Edit control not available yet");
          }
          return newCount;
        }
        
        // Use the new activateEditMode method if available
        if (typeof drawToolsRef.current.activateEditMode === 'function') {
          const result = drawToolsRef.current.activateEditMode();
          if (result) {
            // Always ensure image controls are visible
            setTimeout(() => {
              document.querySelectorAll('.image-controls-wrapper').forEach(el => {
                (el as HTMLElement).style.opacity = '1';
                (el as HTMLElement).style.visibility = 'visible';
                (el as HTMLElement).style.display = 'block';
              });
            }, 100);
            
            return 0; // Reset counter on success
          }
        }
        
        // Fall back to direct access if method not available
        const editControl = drawToolsRef.current.getEditControl?.();
        if (editControl) {
          const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
          if (editHandler && typeof editHandler.enable === 'function') {
            editHandler.enable();
            return 0; // Reset counter on success
          }
        }
      } catch (err) {
        console.error('Failed to activate edit mode:', err);
      }
      
      return newCount;
    });
    
    return false;
  }, []);

  const openFileUploadDialog = (drawingId: string) => {
    if (!isMapValidCheck()) return;
    
    setSelectedDrawing(drawingId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return {
    featureGroupRef,
    drawToolsRef,
    mountedRef,
    isInitialized,
    setIsInitialized,
    selectedDrawing,
    setSelectedDrawing,
    fileInputRef,
    activateEditMode,
    openFileUploadDialog
  };
}
