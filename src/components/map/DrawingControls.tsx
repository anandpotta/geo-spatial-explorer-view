
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
  
  const {
    handleFileChange,
    handleUploadRequest
  } = useFileUploadHandling({ onUploadToDrawing });
  
  // Use a wrapper function to prevent redundant updates
  const handlePathsUpdated = (paths: string[]) => {
    if (onPathsUpdated) {
      // Only log once rather than every time
      onPathsUpdated(paths);
    }
  };
  
  const { svgPaths, setSvgPaths, activePathsRef } = useSvgPathTracking({
    isInitialized,
    drawToolsRef,
    mountedRef,
    onPathsUpdated: handlePathsUpdated
  });
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current,
    openFileUploadDialog,
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
  
  // Add an effect to monitor for layer visibility issues and fix them
  useEffect(() => {
    if (!isInitialized || !featureGroupRef.current) return;
    
    // Check for and fix path visibility issues every few seconds
    const checkInterval = setInterval(() => {
      if (drawToolsRef.current && drawToolsRef.current.getPathElements) {
        const paths = drawToolsRef.current.getPathElements();
        let fixedPaths = false;
        
        paths.forEach((path: SVGPathElement) => {
          // Fix styling if needed
          if (!path.classList.contains('visible-path-stroke')) {
            path.classList.add('visible-path-stroke');
            fixedPaths = true;
          }
          
          // Ensure stroke is visible
          if (path.getAttribute('stroke-opacity') === '0') {
            path.setAttribute('stroke-opacity', '1');
            fixedPaths = true;
          }
        });
        
        if (fixedPaths) {
          console.log('Fixed visibility for SVG paths');
        }
      }
    }, 2000);
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [isInitialized, featureGroupRef, drawToolsRef]);
  
  useEffect(() => {
    if (featureGroupRef.current) {
      setIsInitialized(true);
    }
    
    // Register map event listeners to help maintain path visibility
    if (featureGroupRef.current && featureGroupRef.current._map) {
      const map = featureGroupRef.current._map;
      
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
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleCreatedWrapper = createShapeCreationHandler({
    onCreated,
    onPathsUpdated: handlePathsUpdated,
    svgPaths
  });

  const handleClearAllWrapper = () => {
    handleClearAll({
      featureGroup: featureGroupRef.current,
      onClearAll
    });
  };

  const handleRemoveShape = (drawingId: string) => {
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
      <FileUploadInput ref={fileInputRef} onChange={handleFileChange} />
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
    </>
  );
});

DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
