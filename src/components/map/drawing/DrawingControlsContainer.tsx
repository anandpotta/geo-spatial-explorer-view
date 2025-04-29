
import { DrawingData } from '@/utils/drawing-utils';
import DrawingControls from '../DrawingControls';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { toast } from 'sonner';

interface DrawingControlsContainerProps {
  onShapeCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
}

const DrawingControlsContainer = forwardRef(({
  onShapeCreated,
  activeTool,
  onRegionClick,
  onClearAll,
  onRemoveShape
}: DrawingControlsContainerProps, ref) => {
  const drawingControlsRef = useRef(null);
  
  useImperativeHandle(ref, () => ({
    ...drawingControlsRef.current
  }));
  
  const handleUploadToDrawing = (drawingId: string, file: File) => {
    // Handle file upload logic here
    const fileType = file.type;
    
    // Check file type and size
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size should be less than 5MB');
      return;
    }
    
    // In a real implementation, you would upload the file to a server
    // For this example, we'll just save to localStorage for demonstration
    
    // Convert the file to base64 string
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        // Save the file data to localStorage
        const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
        floorPlans[drawingId] = {
          data: e.target.result,
          name: file.name,
          type: file.type,
          uploaded: new Date().toISOString()
        };
        
        localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
        
        // Trigger a custom event to notify components that a floor plan was uploaded
        window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { drawingId } }));
        
        toast.success(`${file.name} uploaded successfully`);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read the file');
    };
    
    reader.readAsDataURL(file);
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
    />
  );
});

DrawingControlsContainer.displayName = 'DrawingControlsContainer';

export default DrawingControlsContainer;
