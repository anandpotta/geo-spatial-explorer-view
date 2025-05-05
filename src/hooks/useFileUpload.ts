
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { getDefaultTransformOptions, ImageTransformOptions } from '@/utils/image-transform-utils';

export function useFileUpload({ onUploadToDrawing }: { 
  onUploadToDrawing?: (drawingId: string, file: File, transformOptions?: ImageTransformOptions) => void 
}) {
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [imageTransformOptions, setImageTransformOptions] = useState<ImageTransformOptions>(getDefaultTransformOptions());
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedDrawingId && onUploadToDrawing) {
      const file = e.target.files[0];
      
      // Validate file is an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        e.target.value = ''; // Reset file input
        return;
      }
      
      // Pass the transform options along with the file
      onUploadToDrawing(selectedDrawingId, file, imageTransformOptions);
      e.target.value = ''; // Reset file input
      
      // Dispatch custom event for image upload
      window.dispatchEvent(new CustomEvent('image-uploaded', { 
        detail: { drawingId: selectedDrawingId, file }
      }));
    }
  };

  const handleUploadRequest = (drawingId: string) => {
    setSelectedDrawingId(drawingId);
  };
  
  const updateImageTransform = (options: Partial<ImageTransformOptions>) => {
    setImageTransformOptions(prev => ({
      ...prev,
      ...options
    }));
    
    // Dispatch event with current drawing ID and new transform options
    if (selectedDrawingId) {
      window.dispatchEvent(new CustomEvent('image-transform-updated', { 
        detail: { 
          drawingId: selectedDrawingId, 
          transformOptions: {
            ...imageTransformOptions,
            ...options
          }
        }
      }));
    }
  };
  
  const resetImageTransform = () => {
    setImageTransformOptions(getDefaultTransformOptions());
  };
  
  return {
    selectedDrawingId,
    setSelectedDrawingId,
    handleFileChange,
    handleUploadRequest,
    imageTransformOptions,
    updateImageTransform,
    resetImageTransform
  };
}
