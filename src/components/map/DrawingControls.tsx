
import { useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import DrawTools from './DrawTools';
import LayerManager from './drawing/LayerManager';
import { handleClearAll } from './drawing/ClearAllHandler';
import { useDrawingControls, DrawingControlsRef } from '@/hooks/useDrawingControls';
import FileUploadInput from './drawing/FileUploadInput';
import DrawingEffects from './drawing/DrawingEffects';
import { createShapeCreationHandler } from './drawing/ShapeCreationHandler';
import { useSvgPathTracking } from '@/hooks/useSvgPathTracking';
import { useFileUploadHandling } from '@/hooks/useFileUploadHandling';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const { isAuthenticated } = useAuth();
  
  const {
    featureGroupRef,
    drawToolsRef,
    mountedRef,
    isInitialized,
    setIsInitialized,
    fileInputRef,
    openFileUploadDialog
  } = useDrawingControls();
  
  const {
    handleFileChange,
    handleUploadRequest,
    fileInputRef: uploadFileInputRef
  } = useFileUploadHandling({ onUploadToDrawing });
  
  // Use a wrapper function to prevent redundant updates
  const handlePathsUpdated = (paths: string[]) => {
    if (onPathsUpdated) {
      // Only log once rather than every time
      onPathsUpdated(paths);
    }
  };
  
  const { svgPaths, setSvgPaths } = useSvgPathTracking({
    isInitialized,
    drawToolsRef,
    mountedRef,
    onPathsUpdated: handlePathsUpdated
  });
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current,
    openFileUploadDialog: () => {
      if (!isAuthenticated) {
        toast.error('Please log in to upload files');
        return;
      }
      openFileUploadDialog();
    },
    getSvgPaths: () => {
      if (drawToolsRef.current) {
        return drawToolsRef.current.getSVGPathData();
      }
      return [];
    }
  }));
  
  useEffect(() => {
    if (featureGroupRef.current) {
      setIsInitialized(true);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleCreatedWrapper = (shape: any) => {
    if (!isAuthenticated) {
      toast.error('Please log in to save drawings');
      return;
    }
    
    const wrappedHandler = createShapeCreationHandler({
      onCreated,
      onPathsUpdated: handlePathsUpdated,
      svgPaths
    });
    
    wrappedHandler(shape);
  };

  const handleClearAllWrapper = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to clear drawings');
      return;
    }
    
    handleClearAll({
      featureGroup: featureGroupRef.current,
      onClearAll
    });
  };

  const handleRemoveShape = (drawingId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to remove shapes');
      return;
    }
    
    if (onRemoveShape) {
      onRemoveShape(drawingId);
    }
  };

  const handleDrawingClick = (drawing: DrawingData) => {
    if (onRegionClick) {
      onRegionClick(drawing);
    }
  };

  return (
    <>
      <FileUploadInput ref={uploadFileInputRef} onChange={handleFileChange} />
      <DrawingEffects 
        activeTool={activeTool} 
        isInitialized={isInitialized}
      />
      <FeatureGroup ref={featureGroupRef}>
        {featureGroupRef.current && isInitialized && (
          <LayerManager 
            featureGroup={featureGroupRef.current}
            savedDrawings={savedDrawings}
            activeTool={activeTool}
            onRegionClick={handleDrawingClick}
            onRemoveShape={handleRemoveShape}
            onUploadRequest={handleUploadRequest}
          />
        )}
        <DrawTools 
          ref={drawToolsRef}
          onCreated={handleCreatedWrapper} 
          activeTool={activeTool} 
          onClearAll={handleClearAllWrapper}
          featureGroup={featureGroupRef.current}
        />
      </FeatureGroup>
    </>
  );
});

DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
