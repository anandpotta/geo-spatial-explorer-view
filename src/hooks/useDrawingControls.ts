
import { useRef, useState } from 'react';
import L from 'leaflet';
import { useEditMode } from './drawing/useEditMode';
import { useFileUploadDialog } from './drawing/useFileUploadDialog';

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
  
  // Import functionality from smaller hooks
  const { activateEditMode } = useEditMode();
  const { 
    fileInputRef, 
    selectedDrawing, 
    setSelectedDrawing,
    openFileUploadDialog: openFileDialog 
  } = useFileUploadDialog();

  const activateEditModeWrapper = () => {
    activateEditMode(featureGroupRef, drawToolsRef);
  };

  const openFileUploadDialog = (drawingId: string) => {
    openFileDialog(featureGroupRef, drawingId);
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
    activateEditMode: activateEditModeWrapper,
    openFileUploadDialog
  };
}
