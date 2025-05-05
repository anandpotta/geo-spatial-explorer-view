
import { useRef, useState, useCallback, useEffect } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';
import { DrawingData } from '@/utils/drawing-utils';
import { getMapFromLayer, isMapValid, safelyEnableEditForLayer } from '@/utils/leaflet-type-utils';

export interface DrawingControlsRef {
  getFeatureGroup: () => L.FeatureGroup;
  getDrawTools: () => any;
  activateEditMode: () => void;
  openFileUploadDialog: (drawingId: string) => void;
}

export function useDrawingControls() {
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawToolsRef = useRef<any>(null);
  const mountedRef = useRef<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure we clean up properly when unmounting
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const checkMapValidity = useCallback(() => {
    // Check if the feature group is attached to a valid map
    const featureGroup = featureGroupRef.current;
    try {
      const map = getMapFromLayer(featureGroup);
      if (!map || !(map as any)._loaded) {
        console.warn("Map is not fully loaded, cannot proceed");
        toast.error("Map view is not ready. Please try again in a moment.");
        return false;
      }

      // Check if map container is valid
      if (!map.getContainer() || !document.body.contains(map.getContainer())) {
        console.warn("Map container is not in DOM, cannot proceed");
        toast.error("Map view is not available. Please refresh the page.");
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error checking map validity:', err);
      toast.error("Could not validate map state. Please refresh the page.");
      return false;
    }
  }, []);

  const activateEditMode = useCallback(() => {
    if (!checkMapValidity()) return;
    
    console.log("Attempting to activate edit mode");
    
    // First try to enable edit mode through layers directly in case the toolbar isn't working
    try {
      const group = featureGroupRef.current;
      if (group) {
        let activatedAny = false;
        group.eachLayer(layer => {
          if (safelyEnableEditForLayer(layer)) {
            activatedAny = true;
          }
        });
        
        if (activatedAny) {
          console.log("Activated edit mode on at least one layer directly");
          return;
        }
      }
    } catch (err) {
      console.error("Error activating edit mode directly on layers:", err);
    }

    // Try to enable edit mode through edit control
    if (drawToolsRef.current?.getEditControl()) {
      try {
        const editControl = drawToolsRef.current.getEditControl();
        if (editControl) {
          // First make sure the edit toolbar is visible
          if (editControl._map && typeof editControl._showToolbar === 'function') {
            try {
              editControl._showToolbar();
            } catch (err) {
              console.warn("Could not show toolbar:", err);
            }
          }
          
          // Then try to activate the edit handler
          const editHandlers = [
            // Try multiple paths to find the edit handler
            editControl._toolbars?.edit?._modes?.edit?.handler,
            editControl._handler,
            editControl._modes?.edit?.handler
          ];
          
          for (const handler of editHandlers) {
            if (handler && typeof handler.enable === 'function') {
              try {
                handler.enable();
                console.log("Edit mode activated successfully");
                return;
              } catch (e) {
                console.warn("Failed to enable this edit handler:", e);
                // Continue to next handler if this one fails
              }
            }
          }
          
          console.warn("None of the edit handlers could be activated");
        }
      } catch (err) {
        console.error('Failed to activate edit mode:', err);
        toast.error('Could not enable edit mode');
      }
    } else {
      console.warn("Draw tools ref or edit control not available");
    }
  }, [checkMapValidity]);

  const openFileUploadDialog = useCallback((drawingId: string) => {
    if (!checkMapValidity()) return;
    
    setSelectedDrawing(drawingId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [checkMapValidity]);

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
    openFileUploadDialog,
    checkMapValidity
  };
}
