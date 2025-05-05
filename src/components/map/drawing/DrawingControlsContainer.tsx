
import { DrawingData } from '@/utils/drawing-utils';
import DrawingControls from '../DrawingControls';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';
import { ImageTransformOptions, getDefaultTransformOptions } from '@/utils/image-transform-utils';
import { updateDrawingImage, updateDrawingImageTransform } from '@/utils/drawing-utils';

interface DrawingControlsContainerProps {
  onShapeCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
}

const DrawingControlsContainer = forwardRef<DrawingControlsRef, DrawingControlsContainerProps>(({
  onShapeCreated,
  activeTool,
  onRegionClick,
  onClearAll,
  onRemoveShape
}: DrawingControlsContainerProps, ref) => {
  const drawingControlsRef = useRef<DrawingControlsRef>(null);
  const [currentImageTransform, setCurrentImageTransform] = useState<ImageTransformOptions>(getDefaultTransformOptions());
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => {
      return drawingControlsRef.current?.getFeatureGroup() as L.FeatureGroup;
    },
    getDrawTools: () => {
      return drawingControlsRef.current?.getDrawTools();
    },
    activateEditMode: () => {
      drawingControlsRef.current?.activateEditMode();
    },
    openFileUploadDialog: (drawingId: string) => {
      drawingControlsRef.current?.openFileUploadDialog(drawingId);
    }
  }));
  
  const handleUploadToDrawing = (drawingId: string, file: File, transformOptions?: ImageTransformOptions) => {
    // Handle file upload logic here
    const fileType = file.type;
    
    // Check file type and size
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      toast.error('Please select an image or PDF file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size should be less than 5MB');
      return;
    }
    
    // Convert the file to base64 string
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result && typeof e.target.result === 'string') {
        // Save image data to the drawing
        updateDrawingImage(drawingId, e.target.result);
        
        // Save transform data if provided
        if (transformOptions) {
          updateDrawingImageTransform(drawingId, transformOptions);
          setCurrentImageTransform(transformOptions);
        } else {
          updateDrawingImageTransform(drawingId, getDefaultTransformOptions());
          setCurrentImageTransform(getDefaultTransformOptions());
        }
        
        // Trigger a custom event to notify components that a file was uploaded
        window.dispatchEvent(new CustomEvent('image-uploaded', { 
          detail: { drawingId, file, imageData: e.target.result }
        }));
        
        toast.success(`${file.name} uploaded successfully`);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read the file');
    };
    
    reader.readAsDataURL(file);
  };

  const handleImageTransform = (drawingId: string, options: Partial<ImageTransformOptions>) => {
    const newTransform = {
      ...currentImageTransform,
      ...options
    };
    
    setCurrentImageTransform(newTransform);
    updateDrawingImageTransform(drawingId, newTransform);
  };
  
  return (
    <DrawingControls 
      ref={drawingControlsRef}
      onCreated={onShapeCreated}
      activeTool={activeTool}
      onRegionClick={onRegionClick}
      onClearAll={onClearAll}
      onRemoveShape={onRemoveShape}
      onUploadToDrawing={handleUploadToDrawing}
      onImageTransform={handleImageTransform}
    />
  );
});

DrawingControlsContainer.displayName = 'DrawingControlsContainer';

export default DrawingControlsContainer;
