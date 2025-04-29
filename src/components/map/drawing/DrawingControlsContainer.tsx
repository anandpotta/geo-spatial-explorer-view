
import { DrawingData } from '@/utils/drawing-utils';
import DrawingControls from '../DrawingControls';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';

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
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  
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
    },
    getCurrentPath: () => currentPath
  }));
  
  const handlePathUpdate = (path: string | null) => {
    setCurrentPath(path);
    // Log the path for debugging
    if (path) {
      console.log("Current drawing path:", path);
    }
  };
  
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
    <>
      <DrawingControls 
        ref={drawingControlsRef}
        onCreated={onShapeCreated}
        activeTool={activeTool}
        onRegionClick={onRegionClick}
        onClearAll={onClearAll}
        onRemoveShape={onRemoveShape}
        onUploadToDrawing={handleUploadToDrawing}
        onPathUpdate={handlePathUpdate}
      />
      
      {currentPath && (
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-md shadow-lg z-[1000] max-w-md overflow-auto">
          <h3 className="font-bold text-sm mb-1">Shape Path Data:</h3>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-800 overflow-x-auto">
            {currentPath}
          </div>
        </div>
      )}
    </>
  );
});

DrawingControlsContainer.displayName = 'DrawingControlsContainer';

export default DrawingControlsContainer;
