
import { useRef, useState } from 'react';
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

  const checkMapValidity = () => {
    // Check if the feature group is attached to a valid map
    const featureGroup = featureGroupRef.current;
    try {
      const map = getMapFromLayer(featureGroup);
      if (!isMapValid(map)) {
        console.warn("Map is not fully loaded, cannot proceed");
        toast.error("Map view is not ready. Please try again in a moment.");
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
    if (!checkMapValidity()) return false;

    try {
      console.log("Attempting to activate edit mode");
      
      if (!drawToolsRef.current) {
        console.warn("Draw tools reference not available");
        return false;
      }
      
      const editControl = drawToolsRef.current.getEditControl();
      if (!editControl) {
        console.warn("Edit control not available");
        return false;
      }
      
      // Safely access the edit handler
      const editModes = editControl._toolbars?.edit?._modes;
      if (!editModes || !editModes.edit) {
        console.warn("Edit modes not available");
        return false;
      }
      
      const editHandler = editModes.edit.handler;
      if (!editHandler || typeof editHandler.enable !== 'function') {
        console.warn("Edit handler not found or not a function");
        return false;
      }
      
      // Ensure the edit handler has a valid feature group with proper event listeners
      if (!editHandler._featureGroup) {
        console.warn("Edit handler's feature group is not set");
        editHandler._featureGroup = featureGroupRef.current;
      }
      
      // Safely enable edit mode
      editHandler.enable();
      console.log("Edit mode activated successfully");
      return true;
    } catch (err) {
      console.error('Failed to activate edit mode:', err);
      toast.error('Could not enable edit mode');
      return false;
    }
  };

  const openFileUploadDialog = (drawingId: string) => {
    if (!checkMapValidity()) return;
    
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
