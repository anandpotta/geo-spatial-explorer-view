
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface FileUploadHandlingProps {
  onUploadToDrawing?: (drawingId: string, file: File) => void;
}

export function useFileUploadHandling({ onUploadToDrawing }: FileUploadHandlingProps) {
  const selectedDrawingRef = useRef<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Maximum file size is 5MB');
      return;
    }

    // If we have a selected drawing and the upload callback
    if (selectedDrawingRef.current && onUploadToDrawing) {
      onUploadToDrawing(selectedDrawingRef.current, file);
      selectedDrawingRef.current = null;
    }

    // Reset the input
    e.target.value = '';
  }, [onUploadToDrawing]);

  const handleUploadRequest = useCallback((drawingId: string) => {
    selectedDrawingRef.current = drawingId;
  }, []);

  return {
    handleFileChange,
    handleUploadRequest
  };
}
