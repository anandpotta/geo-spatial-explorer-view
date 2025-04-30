
import { useRef, useState } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';
import { DrawingData } from '@/utils/geo-utils';
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

  const activateEditMode = (): boolean => {
    if (!isMapValid()) return false;

    if (drawToolsRef.current?.getEditControl()) {
      try {
        console.log("Attempting to activate edit mode");
        const editControl = drawToolsRef.current.getEditControl();
        if (editControl) {
          const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
          if (editHandler && typeof editHandler.enable === 'function') {
            editHandler.enable();
            console.log("Edit mode activated successfully");
            return true;
          } else {
            console.warn("Edit handler not found or not a function");
          }
        }
      } catch (err) {
        console.error('Failed to activate edit mode:', err);
        toast.error('Could not enable edit mode');
      }
    } else {
      console.warn("Draw tools ref or edit control not available");
    }
    
    return false;
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
