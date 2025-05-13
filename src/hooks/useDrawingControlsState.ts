
import { useState, useCallback } from 'react';

export function useDrawingControlsState(onUploadToDrawing?: (drawingId: string, file: File) => void) {
  const [isEditModeActive, setIsEditModeActive] = useState(false);

  const handleUploadRequest = useCallback((drawingId: string) => {
    if (onUploadToDrawing) {
      // Trigger file upload dialog for the specific drawing
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          onUploadToDrawing(drawingId, files[0]);
        }
      };
      fileInput.click();
    }
  }, [onUploadToDrawing]);

  return {
    isEditModeActive,
    setIsEditModeActive,
    handleUploadRequest
  };
}
