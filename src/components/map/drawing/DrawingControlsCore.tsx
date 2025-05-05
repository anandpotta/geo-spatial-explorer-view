
import { forwardRef, useImperativeHandle } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import DrawTools from '../DrawTools';
import LayerManager from './LayerManager';
import { handleClearAll } from './ClearAllHandler';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';
import { createShapeCreationHandler } from './ShapeCreationHandler';
import { useDrawingControlsState } from '@/hooks/useDrawingControlsState';
import { usePathVisibilityEffect } from '@/hooks/usePathVisibilityEffect';
import { useMapEventListeners } from '@/hooks/useMapEventListeners';

interface DrawingControlsCoreProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onPathsUpdated?: (paths: string[]) => void;
}

const DrawingControlsCore = forwardRef<DrawingControlsRef, DrawingControlsCoreProps>(({
  onCreated,
  activeTool,
  onRegionClick,
  onClearAll,
  onRemoveShape,
  onUploadRequest,
  onPathsUpdated
}: DrawingControlsCoreProps, ref) => {
  // Use our custom hooks to manage state
  const {
    featureGroupRef,
    drawToolsRef,
    mountedRef,
    isInitialized,
    setIsInitialized,
    svgPaths,
    setSvgPaths
  } = useDrawingControlsState({ onPathsUpdated });

  // Set up path visibility monitoring
  usePathVisibilityEffect({
    isInitialized,
    featureGroupRef,
    drawToolsRef,
    mountedRef
  });

  // Set up map event listeners
  useMapEventListeners({
    featureGroupRef,
    drawToolsRef,
    mountedRef,
    setIsInitialized
  });
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current,
    openFileUploadDialog: (drawingId: string) => {},
    getSvgPaths: () => {
      if (drawToolsRef.current) {
        return drawToolsRef.current.getSVGPathData();
      }
      return [];
    },
    restorePathVisibility: () => {
      if (drawToolsRef.current && drawToolsRef.current.getPathElements) {
        const paths = drawToolsRef.current.getPathElements();
        paths.forEach((path: SVGPathElement) => {
          if (!path.classList.contains('visible-path-stroke')) {
            path.classList.add('visible-path-stroke');
          }
        });
      }
    }
  }));

  const handleCreatedWrapper = createShapeCreationHandler({
    onCreated,
    onPathsUpdated,
    svgPaths
  });

  const handleClearAllWrapper = () => {
    handleClearAll({
      featureGroup: featureGroupRef.current,
      onClearAll
    });
  };

  return (
    <FeatureGroup ref={featureGroupRef}>
      {featureGroupRef.current && isInitialized && (
        <LayerManager 
          featureGroup={featureGroupRef.current}
          activeTool={activeTool}
          onRegionClick={onRegionClick}
          onRemoveShape={onRemoveShape}
          onUploadRequest={onUploadRequest}
          onClearAll={onClearAll}
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
  );
});

DrawingControlsCore.displayName = 'DrawingControlsCore';

export default DrawingControlsCore;
