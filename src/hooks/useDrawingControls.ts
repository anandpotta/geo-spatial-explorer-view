
import { useRef, useState } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';
import { DrawingData } from '@/utils/drawing-utils';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';

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

  const isMapValid = () => {
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
  };

  const activateEditMode = () => {
    if (!isMapValid()) return;

    if (drawToolsRef.current?.getEditControl()) {
      try {
        console.log("Attempting to activate edit mode");
        const editControl = drawToolsRef.current.getEditControl();
        
        if (editControl) {
          // Get the map to ensure proper context
          const map = getMapFromLayer(featureGroupRef.current);
          if (!map) {
            console.warn("Map not available for edit mode");
            return;
          }
          
          // Access the edit toolbar and handler with proper checks
          const toolbar = editControl._toolbars?.edit;
          if (toolbar) {
            // Make sure we have at least one layer to edit
            if (featureGroupRef.current.getLayers().length === 0) {
              console.warn("No layers to edit");
              toast.error("No drawings to edit. Create a drawing first.");
              return;
            }
            
            // Get the edit handler
            const editHandler = toolbar._modes?.edit?.handler;
            if (editHandler) {
              // Check if enable method exists
              if (typeof editHandler.enable === 'function') {
                // Initialize the edit handler with the feature group
                editHandler._featureGroup = featureGroupRef.current;
                
                // Enable the edit mode
                editHandler.enable();
                console.log("Edit mode activated successfully");
              } else {
                console.warn("Edit handler enable method not found");
                toast.error("Could not enable edit mode");
              }
            } else {
              console.warn("Edit handler not found in toolbar");
            }
          } else {
            console.warn("Edit toolbar not found");
          }
        }
      } catch (err) {
        console.error('Failed to activate edit mode:', err);
        toast.error('Could not enable edit mode');
      }
    } else {
      console.warn("Draw tools ref or edit control not available");
    }
  };

  const openFileUploadDialog = (drawingId: string) => {
    if (!isMapValid()) return;
    
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
