
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseFileUploadProps {
  onUploadToDrawing?: (drawingId: string, file: File) => void;
}

export function useFileUpload({ onUploadToDrawing }: UseFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  
  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadToDrawing) return;
    
    // Reset the input value so the same file can be selected again
    e.target.value = '';
    
    // Check file type and size
    const fileType = file.type;
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size should be less than 5MB');
      return;
    }
    
    setIsUploading(true);
    
    // Get the selected drawing ID from component state
    const selectedId = e.target.dataset.drawingId;
    if (selectedId) {
      onUploadToDrawing(selectedId, file);
      setIsUploading(false);
    } else {
      toast.error('No drawing selected for upload');
      setIsUploading(false);
    }
  }, [onUploadToDrawing]);
  
  // Handle initiating upload for a specific drawing
  const handleUploadRequest = useCallback((drawingId: string) => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput) {
      toast.error('Upload interface not available');
      return;
    }
    
    // Set the drawing ID as a data attribute to retrieve later
    fileInput.dataset.drawingId = drawingId;
    fileInput.click();
  }, []);
  
  return {
    handleFileChange,
    handleUploadRequest,
    isUploading
  };
}
