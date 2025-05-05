
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

  const isMapValidCheck = () => {
    // Check if the feature group is attached to a valid map
    const featureGroup = featureGroupRef.current;
    try {
      const map = getMapFromLayer(featureGroup);
      if (!map || !(map as any)._loaded) {
        console.warn("Map is not fully loaded, cannot proceed");
        return false;
      }

      // Check if map container is valid
      if (!map.getContainer() || !document.body.contains(map.getContainer())) {
        console.warn("Map container is not in DOM, cannot proceed");
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

    try {
      if (!drawToolsRef.current) {
        console.log("Draw tools ref not available yet");
        return false;
      }

      console.log("Attempting to activate edit mode with tools:", drawToolsRef.current);
      
      // Use the new activateEditMode method if available
      if (typeof drawToolsRef.current.activateEditMode === 'function') {
        const result = drawToolsRef.current.activateEditMode();
        if (result) {
          console.log("Edit mode activated successfully using method");
          
          // Always ensure image controls are visible
          setTimeout(() => {
            document.querySelectorAll('.image-controls-wrapper').forEach(el => {
              (el as HTMLElement).style.opacity = '1';
              (el as HTMLElement).style.visibility = 'visible';
              (el as HTMLElement).style.display = 'block';
            });
          }, 100);
          
          return true;
        }
      }
      
      // Fall back to direct access if method not available
      const editControl = drawToolsRef.current.getEditControl?.();
      if (editControl) {
        const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
        if (editHandler && typeof editHandler.enable === 'function') {
          editHandler.enable();
          console.log("Edit mode activated successfully via handler");
          return true;
        } else {
          console.warn("Edit handler not found or not a function");
        }
      } else {
        console.warn("Edit control not available");
      }
    } catch (err) {
      console.error('Failed to activate edit mode:', err);
    }
    
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
