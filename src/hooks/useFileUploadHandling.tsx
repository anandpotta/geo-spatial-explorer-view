
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface FileUploadHandlingProps {
  onUploadToDrawing?: (drawingId: string, file: File) => void;
}

export function useFileUploadHandling({ onUploadToDrawing }: FileUploadHandlingProps) {
  const [selectedDrawingForUpload, setSelectedDrawingForUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedDrawingForUpload) {
      if (onUploadToDrawing) {
        onUploadToDrawing(selectedDrawingForUpload, file);
      }
      setSelectedDrawingForUpload(null);
    }
    
    // Reset the input value so the same file can be selected again if needed
    if (e.target.value) {
      e.target.value = '';
    }
  };

  const handleUploadRequest = (drawingId: string) => {
    setSelectedDrawingForUpload(drawingId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return {
    handleFileChange,
    handleUploadRequest,
    selectedDrawingForUpload,
    fileInputRef
  };
}
