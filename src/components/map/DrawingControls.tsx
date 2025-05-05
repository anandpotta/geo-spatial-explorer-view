
import { forwardRef, useImperativeHandle } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import DrawTools from './DrawTools';
import LayerManager from './drawing/LayerManager';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';
import { useDrawingControlsState } from '@/hooks/useDrawingControlsState';
import FileUploadHandling from './drawing/FileUploadHandling';
import DrawingEffects from './drawing/DrawingEffects';
import { ImageTransformOptions } from '@/utils/image-transform-utils';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadToDrawing?: (drawingId: string, file: File, transformOptions?: ImageTransformOptions) => void;
  onImageTransform?: (drawingId: string, options: Partial<ImageTransformOptions>) => void;
  onPathsUpdated?: (paths: string[]) => void;
}

const DrawingControls = forwardRef<DrawingControlsRef, DrawingControlsProps>(({ 
  onCreated, 
  activeTool, 
  onRegionClick, 
  onClearAll, 
  onRemoveShape,
  onUploadToDrawing,
  onImageTransform,
  onPathsUpdated
}: DrawingControlsProps, ref) => {
  const { savedDrawings } = useDrawings();
  
  const {
    featureGroupRef,
    drawToolsRef,
    fileInputRef,
    isInitialized,
    svgPaths,
    handleFileChange,
    handleUploadRequest,
    handleImageTransform,
    handleClearAll,
    handleRemoveShape,
    handleDrawingClick,
    handleCreatedWrapper,
    imageTransformOptions,
    activateEditMode
  } = useDrawingControlsState({
    onCreated,
    onClearAll,
    onRemoveShape,
    onRegionClick,
    onUploadToDrawing, 
    onPathsUpdated,
  });
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current,
    activateEditMode,
    openFileUploadDialog: handleUploadRequest,
    getSvgPaths: () => {
      if (drawToolsRef.current) {
        return drawToolsRef.current.getSVGPathData();
      }
      return [];
    }
  }));

  return (
    <>
      <FileUploadHandling
        fileInputRef={fileInputRef}
        onChange={handleFileChange}
      />
      
      <DrawingEffects 
        activeTool={activeTool}
        isInitialized={isInitialized}
        activateEditMode={activateEditMode}
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
            onImageTransform={handleImageTransform}
          />
        )}
        <DrawTools 
          ref={drawToolsRef}
          onCreated={handleCreatedWrapper} 
          activeTool={activeTool} 
          onClearAll={handleClearAll}
          featureGroup={featureGroupRef.current}
        />
      </FeatureGroup>
    </>
  );
});

DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
