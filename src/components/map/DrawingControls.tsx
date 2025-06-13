
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
import GlobalPathClickHandler from './drawing/GlobalPathClickHandler';

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
  const { isAuthenticated, currentUser, checkAuthBeforeAction } = useDrawingAuth();
  
  console.log('🔧 DrawingControls: Rendering with props:', {
    onRegionClick: typeof onRegionClick,
    savedDrawingsCount: savedDrawings.length,
    currentUser: currentUser?.id
  });
  
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
  const { handleClearAllWrapper } = useClearAllOperation(onClearAll);
  
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

  useEffect(() => {
    if (isInitialized && currentUser && drawToolsRef.current) {
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
    console.log(`🎯 DrawingControls: handleDrawingClick called for drawing ${drawing.id}`);
    console.log(`🔍 DrawingControls: onRegionClick callback type:`, typeof onRegionClick);
    console.log(`🔍 DrawingControls: onRegionClick callback:`, onRegionClick);
    
    if (!checkAuthBeforeAction('interact with drawings')) {
      console.log(`❌ DrawingControls: Auth check failed for drawing ${drawing.id}`);
      return;
    }
    
    console.log(`✅ DrawingControls: Auth check passed, calling onRegionClick for drawing ${drawing.id}`);
    
    if (onRegionClick) {
      console.log(`📤 DrawingControls: About to call onRegionClick callback for drawing ${drawing.id}`);
      try {
        onRegionClick(drawing);
        console.log(`✅ DrawingControls: Successfully called onRegionClick for drawing ${drawing.id}`);
      } catch (err) {
        console.error(`❌ DrawingControls: Error calling onRegionClick for drawing ${drawing.id}:`, err);
      }
    } else {
      console.error(`❌ DrawingControls: onRegionClick callback is undefined for drawing ${drawing.id}`);
      console.log(`🔍 DrawingControls: Props received:`, { onRegionClick, onClearAll, onRemoveShape, onUploadToDrawing });
    }
  };

  console.log(`🏗️ DrawingControls: Rendering LayerManagerWrapper with handleDrawingClick for ${savedDrawings.length} drawings`);

  return (
    <>
      <GlobalPathClickHandler />
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
