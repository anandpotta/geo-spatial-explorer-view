
import { forwardRef, useImperativeHandle, useEffect, useCallback, useRef } from 'react';
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
  const { drawings: savedDrawings } = useDrawings();
  const { isAuthenticated, currentUser, checkAuthBeforeAction } = useDrawingAuth();
  const initializationRef = useRef(false);
  const stableCallbacksRef = useRef({
    onCreated,
    onRegionClick,
    onClearAll,
    onRemoveShape,
    onUploadToDrawing,
    onPathsUpdated
  });
  
  // Update refs without triggering re-renders
  stableCallbacksRef.current.onCreated = onCreated;
  stableCallbacksRef.current.onRegionClick = onRegionClick;
  stableCallbacksRef.current.onClearAll = onClearAll;
  stableCallbacksRef.current.onRemoveShape = onRemoveShape;
  stableCallbacksRef.current.onUploadToDrawing = onUploadToDrawing;
  stableCallbacksRef.current.onPathsUpdated = onPathsUpdated;
  
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
  
  // Stable callback for paths updated
  const handlePathsUpdated = useCallback((paths: string[]) => {
    if (stableCallbacksRef.current.onPathsUpdated && mountedRef.current) {
      stableCallbacksRef.current.onPathsUpdated(paths);
    }
  }, [mountedRef]);
  
  // Track SVG paths with stable callback
  const { svgPaths } = useSvgPathTracking({
    isInitialized,
    drawToolsRef,
    mountedRef,
    onPathsUpdated: handlePathsUpdated
  });
  
  // Handle shape creation with stable callback
  const { handleCreatedWrapper } = useHandleShapeCreation(
    (shape: any) => stableCallbacksRef.current.onCreated(shape), 
    handlePathsUpdated, 
    svgPaths
  );
  
  // Handle clear all operation with stable callback
  const { handleClearAllWrapper } = useClearAllOperation(
    () => stableCallbacksRef.current.onClearAll?.()
  );
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current,
    openFileUploadDialog: (drawingId: string) => {
      if (!checkAuthBeforeAction('upload files')) {
        return;
      }
      openFileUploadDialog(drawingId);
    },
    getSvgPaths: () => {
      if (drawToolsRef.current) {
        return drawToolsRef.current.getSVGPathData();
      }
      return [];
    }
  }), [checkAuthBeforeAction, openFileUploadDialog, featureGroupRef, drawToolsRef]);
  
  // Stable initialization effect - only run once
  useEffect(() => {
    if (featureGroupRef.current && !initializationRef.current) {
      initializationRef.current = true;
      setIsInitialized(true);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [featureGroupRef.current, setIsInitialized, mountedRef]);

  // Minimal user change handling - only when user ID actually changes
  useEffect(() => {
    if (isInitialized && currentUser?.id && drawToolsRef.current && initializationRef.current) {
      const timeoutId = setTimeout(() => {
        if (mountedRef.current) {
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('markersUpdated'));
          window.dispatchEvent(new Event('drawingsUpdated'));
        }
      }, 1000); // Increased timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentUser?.id, isInitialized]); // Only depend on user ID

  const handleRemoveShape = useCallback((drawingId: string) => {
    if (!checkAuthBeforeAction('remove shapes')) {
      return;
    }
    
    if (stableCallbacksRef.current.onRemoveShape) {
      stableCallbacksRef.current.onRemoveShape(drawingId);
    }
  }, [checkAuthBeforeAction]);

  const handleDrawingClick = useCallback((drawing: DrawingData) => {
    if (stableCallbacksRef.current.onRegionClick) {
      stableCallbacksRef.current.onRegionClick(drawing);
    }
  }, []);

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
            onUploadRequest={handleUploadRequest}
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
