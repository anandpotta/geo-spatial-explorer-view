
import { useRef, useState, useCallback } from 'react';
import { DrawingData } from '@/utils/drawing-utils';

export function useDrawingControlsState(onUploadToDrawing?: (drawingId: string, file: File) => void) {
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  
  const handleUploadRequest = useCallback((drawingId: string) => {
    if (onUploadToDrawing && drawingId) {
      const fileInput = uploadFileInputRef.current;
      if (fileInput) {
        setSelectedDrawing(drawingId);
        fileInput.click();
      }
    }
  }, [onUploadToDrawing]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);
  
  const openFileUploadDialog = useCallback((drawingId: string) => {
    setSelectedDrawing(drawingId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleDrawingClick = useCallback((drawing: DrawingData) => {
    // Implementation of drawing click logic
  }, []);

  return {
    selectedDrawing,
    setSelectedDrawing,
    handleUploadRequest,
    fileInputRef,
    uploadFileInputRef,
    openFileUploadDialog,
    handleDrawingClick
  };
}
