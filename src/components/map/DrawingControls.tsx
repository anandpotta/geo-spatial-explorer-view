
import { useEffect, forwardRef } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import { useDrawingControls, DrawingControlsRef } from '@/hooks/useDrawingControls';
import { useSvgPathTracking } from '@/hooks/useSvgPathTracking';
import { useDrawingPathUpdates } from '@/hooks/useDrawingPathUpdates';
import { useDrawingControlsMethods } from '@/hooks/useDrawingControlsMethods';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';
import FileUploadHandler from './drawing/FileUploadHandler';
import DrawingEffects from './drawing/DrawingEffects';
import DrawingToolsWrapper from './drawing/DrawingToolsWrapper';
import LayerManagerWrapper from './drawing/LayerManagerWrapper';

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
  
  const {
    featureGroupRef,
    drawToolsRef,
    mountedRef,
    isInitialized,
    setIsInitialized,
    fileInputRef,
    openFileUploadDialog
  } = useDrawingControls();
  
  const { handleFileChange, handleUploadRequest } = useFileUploadHandling({ onUploadToDrawing });
  
  const { handlePathsUpdated } = useDrawingPathUpdates({ onPathsUpdated });
  
  const { svgPaths, setSvgPaths, activePathsRef } = useSvgPathTracking({
    isInitialized,
    drawToolsRef,
    mountedRef,
    onPathsUpdated: handlePathsUpdated
  });
  
  // Setup imperative methods
  useDrawingControlsMethods(ref, {
    featureGroupRef,
    drawToolsRef,
    openFileUploadDialog,
    getSvgPaths: () => {
      if (drawToolsRef.current) {
        return drawToolsRef.current.getSVGPathData();
      }
      return [];
    }
  });
  
  // Initialize the feature group
  useEffect(() => {
    if (featureGroupRef.current) {
      setIsInitialized(true);
    }
    
    // Register map event listeners to help maintain path visibility
    if (featureGroupRef.current) {
      const map = getMapFromLayer(featureGroupRef.current);
      
      if (map) {
        const handleMapEvent = () => {
          // Use requestAnimationFrame to avoid blocking the UI
          requestAnimationFrame(() => {
            if (drawToolsRef.current && drawToolsRef.current.getPathElements) {
              const paths = drawToolsRef.current.getPathElements();
              paths.forEach((path: SVGPathElement) => {
                if (!path.classList.contains('visible-path-stroke')) {
                  path.classList.add('visible-path-stroke');
                }
              });
            }
          });
        };
        
        map.on('zoomend moveend dragend', handleMapEvent);
        
        return () => {
          map.off('zoomend moveend dragend', handleMapEvent);
          mountedRef.current = false;
        };
      }
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <>
      <FileUploadHandler 
        fileInputRef={fileInputRef} 
        onUploadToDrawing={onUploadToDrawing} 
      />
      <DrawingEffects 
        activeTool={activeTool} 
        isInitialized={isInitialized}
      />
      <FeatureGroup ref={featureGroupRef}>
        <LayerManagerWrapper 
          featureGroup={featureGroupRef.current}
          savedDrawings={savedDrawings}
          activeTool={activeTool}
          onRegionClick={onRegionClick}
          onRemoveShape={onRemoveShape}
          onUploadRequest={handleUploadRequest}
          onClearAll={onClearAll}
          isInitialized={isInitialized}
        />
        <DrawingToolsWrapper 
          drawToolsRef={drawToolsRef}
          featureGroup={featureGroupRef.current}
          activeTool={activeTool}
          onCreated={onCreated}
          onClearAll={onClearAll}
          onPathsUpdated={handlePathsUpdated}
          svgPaths={svgPaths}
        />
      </FeatureGroup>
    </>
  );
});

DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
