
import { useRef, useState } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';
import { DrawingData } from '@/utils/drawing-utils';

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

  const activateEditMode = () => {
    if (drawToolsRef.current?.getEditControl()) {
      try {
        console.log("Attempting to activate edit mode");
        const editControl = drawToolsRef.current.getEditControl();
        if (editControl) {
          const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
          if (editHandler && typeof editHandler.enable === 'function') {
            editHandler.enable();
            console.log("Edit mode activated successfully");
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
  };

  const openFileUploadDialog = (drawingId: string) => {
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
