
import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import { DrawingControlsRef, useDrawingControls } from '@/hooks/useDrawingControls';
import { useFileUploadHandling } from '@/hooks/useFileUploadHandling';
import { useDrawingAuth } from '@/hooks/useDrawingAuth';
import { useHandleShapeCreation } from '@/hooks/useHandleShapeCreation';
import { useClearAllOperation } from '@/hooks/useClearAllOperation';
import { useSvgPathTracking } from '@/hooks/useSvgPathTracking';
import { useDrawingControlsState } from '@/hooks/useDrawingControlsState';
import FileUploadHandler from './drawing/FileUploadHandler';
import DrawingControlsEffects from './drawing/DrawingControlsEffects';
import LayerManagerWrapper from './drawing/LayerManagerWrapper';
import DrawToolsWrapper from './drawing/DrawToolsWrapper';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadToDrawing?: (drawingId: string, file: File) => void;
  onPathsUpdated?: (paths: string[]) => void;
  onUploadRequest?: (drawingId: string) => void;
}

const DrawingControls = forwardRef<DrawingControlsRef, DrawingControlsProps>(({ 
  onCreated, 
  activeTool, 
  onRegionClick, 
  onClearAll, 
  onRemoveShape,
  onUploadToDrawing,
  onPathsUpdated,
  onUploadRequest
}: DrawingControlsProps, ref) => {
  const { savedDrawings } = useDrawings();
  const { isAuthenticated, currentUser, checkAuthBeforeAction } = useDrawingAuth();
  
  const {
    featureGroupRef,
    drawToolsRef,
    mountedRef,
    isInitialized,
    setIsInitialized,
    fileInputRef,
    openFileUploadDialog
  } = useDrawingControls();
  
  const { handleUploadRequest } = useDrawingControlsState(onUploadToDrawing);
  
  const { handleFileChange, fileInputRef: uploadFileInputRef } = useFileUploadHandling({ onUploadToDrawing });
  
  // Track SVG paths
  const { svgPaths } = useSvgPathTracking({
    isInitialized,
    drawToolsRef,
    mountedRef,
    onPathsUpdated
  });
  
  // Handle shape creation with authentication check
  const { handleCreatedWrapper } = useHandleShapeCreation(onCreated, onPathsUpdated, svgPaths);
  
  // Handle clear all operation with authentication check
  const { handleClearAllWrapper } = useClearAllOperation(onClearAll);
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current,
    openFileUploadDialog: (drawingId: string) => {
      console.log('Opening file upload dialog for drawing:', drawingId);
      openFileUploadDialog(drawingId);
    },
    getSvgPaths: () => {
      if (drawToolsRef.current) {
        return drawToolsRef.current.getSVGPathData();
      }
      return [];
    }
  }));
  
  // Effect for initialization
  useEffect(() => {
    if (featureGroupRef.current) {
      setIsInitialized(true);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle user changes - reload drawings when user changes
  useEffect(() => {
    if (isInitialized && currentUser && drawToolsRef.current) {
      // When user logs in or changes, we need to refresh the map
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      window.dispatchEvent(new Event('drawingsUpdated'));
    }
  }, [currentUser, isInitialized]);

  const handleRemoveShape = (drawingId: string) => {
    if (!checkAuthBeforeAction('remove shapes')) {
      return;
    }
    
    if (onRemoveShape) {
      onRemoveShape(drawingId);
    }
  };

  const handleDrawingClick = (drawing: DrawingData) => {
    console.log('Drawing clicked in DrawingControls:', drawing.id);
    if (onRegionClick) {
      onRegionClick(drawing);
    }
  };

  const handleUploadRequestWrapper = (drawingId: string) => {
    console.log('Upload request received for drawing:', drawingId);
    if (onUploadRequest) {
      onUploadRequest(drawingId);
    } else {
      // Fallback to opening file dialog directly
      openFileUploadDialog(drawingId);
    }
  };

  return (
    <>
      <FileUploadHandler fileInputRef={uploadFileInputRef} onChange={handleFileChange} />
      <DrawingControlsEffects 
        activeTool={activeTool} 
        isInitialized={isInitialized}
      />
      <FeatureGroup ref={featureGroupRef}>
        {featureGroupRef.current && isInitialized && (
          <LayerManagerWrapper 
            featureGroup={featureGroupRef.current}
            savedDrawings={savedDrawings}
            activeTool={activeTool}
            onRegionClick={handleDrawingClick}
            onRemoveShape={handleRemoveShape}
            onUploadRequest={handleUploadRequestWrapper}
          />
        )}
        <DrawToolsWrapper 
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
