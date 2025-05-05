
import { useRef } from 'react';

interface UseFileUploadHandlingProps {
  onUploadToDrawing?: (drawingId: string, file: File) => void;
}

export function useFileUploadHandling({ onUploadToDrawing }: UseFileUploadHandlingProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedDrawingIdRef = useRef<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && selectedDrawingIdRef.current && onUploadToDrawing) {
      onUploadToDrawing(selectedDrawingIdRef.current, files[0]);
      // Clear the input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadRequest = (drawingId: string) => {
    selectedDrawingIdRef.current = drawingId;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return {
    fileInputRef,
    handleFileChange,
    handleUploadRequest
  };
}
