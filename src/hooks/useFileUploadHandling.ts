
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface FileUploadHandlingProps {
  onUploadToDrawing?: (drawingId: string, file: File) => void;
}

export function useFileUploadHandling({ onUploadToDrawing }: FileUploadHandlingProps) {
  const [selectedDrawingForUpload, setSelectedDrawingForUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      toast.error('Please log in to upload files');
      return;
    }
    
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
    if (!isAuthenticated) {
      toast.error('Please log in to upload files');
      return;
    }
    setSelectedDrawingForUpload(drawingId);
    
    // Trigger file input click
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
