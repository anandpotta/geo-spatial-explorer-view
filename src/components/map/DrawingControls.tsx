
import { forwardRef } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';
import FileUploadInput from './drawing/FileUploadInput';
import DrawingEffects from './drawing/DrawingEffects';
import { useFileUploadHandling } from '@/hooks/useFileUploadHandling';
import DrawingControlsCore from './drawing/DrawingControlsCore';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadToDrawing?: (drawingId: string, file: File) => void;
  onPathsUpdated?: (paths: string[]) => void;
}

const DrawingControls = forwardRef<DrawingControlsRef, DrawingControlsProps>(({ 
  onCreated, 
  activeTool, 
  onRegionClick, 
  onClearAll, 
  onRemoveShape,
  onUploadToDrawing,
  onPathsUpdated
}: DrawingControlsProps, ref) => {
  const { savedDrawings } = useDrawings();
  
  // Setup file upload handling
  const {
    handleFileChange,
    handleUploadRequest,
    fileInputRef
  } = useFileUploadHandling({ onUploadToDrawing });
  
  return (
    <>
      <FileUploadInput ref={fileInputRef} onChange={handleFileChange} />
      <DrawingEffects 
        activeTool={activeTool} 
        isInitialized={true}
      />
      <DrawingControlsCore 
        ref={ref}
        onCreated={onCreated}
        activeTool={activeTool}
        onRegionClick={onRegionClick}
        onClearAll={onClearAll}
        onRemoveShape={onRemoveShape}
        onUploadRequest={handleUploadRequest}
        onPathsUpdated={onPathsUpdated}
      />
    </>
  );
});

DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
