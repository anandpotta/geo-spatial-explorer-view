
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
  const processingRef = useRef<Set<string>>(new Set());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      toast.error('Please log in to upload files');
      return;
    }
    
    const file = e.target.files?.[0];
    if (file && selectedDrawingForUpload) {
      // Skip if already processing
      if (processingRef.current.has(selectedDrawingForUpload)) {
        console.log(`Already processing drawing ${selectedDrawingForUpload}, skipping duplicate request`);
        return;
      }
      
      // Mark as processing
      processingRef.current.add(selectedDrawingForUpload);
      
      console.log(`Handling file upload for drawing ID: ${selectedDrawingForUpload}`);
      if (onUploadToDrawing) {
        onUploadToDrawing(selectedDrawingForUpload, file);
      }
      
      // Clear processing flag after timeout
      setTimeout(() => {
        processingRef.current.delete(selectedDrawingForUpload);
      }, 3000);
      
      setSelectedDrawingForUpload(null);
    } else if (!selectedDrawingForUpload) {
      console.error('No drawing ID selected for upload');
      toast.error('Please select a drawing first');
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
    
    if (!drawingId) {
      console.error('No drawing ID provided for upload');
      toast.error('Invalid drawing selection');
      return;
    }
    
    console.log(`Setting selected drawing ID for upload: ${drawingId}`);
    setSelectedDrawingForUpload(drawingId);
    
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('File input reference is not available');
      toast.error('Cannot open file dialog');
    }
  };

  return {
    handleFileChange,
    handleUploadRequest,
    selectedDrawingForUpload,
    fileInputRef
  };
}
