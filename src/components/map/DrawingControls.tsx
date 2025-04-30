
import { useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import DrawTools from './DrawTools';
import LayerManager from './drawing/LayerManager';
import { deleteMarker, getSavedMarkers } from '@/utils/marker-utils';
import { toast } from 'sonner';
import { useDrawingControls, DrawingControlsRef } from '@/hooks/useDrawingControls';
import FileUploadInput from './drawing/FileUploadInput';
import DrawingEffects from './drawing/DrawingEffects';
import { useFileUpload } from '@/hooks/useFileUpload';

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
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  
  const {
    featureGroupRef,
    drawToolsRef,
    mountedRef,
    isInitialized,
    setIsInitialized,
    fileInputRef,
    activateEditMode,
    openFileUploadDialog
  } = useDrawingControls();
  
  const {
    handleFileChange,
    handleUploadRequest
  } = useFileUpload({ onUploadToDrawing });
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current,
    activateEditMode,
    openFileUploadDialog,
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

  // Periodically check for SVG paths when tools are active
  useEffect(() => {
    if (!isInitialized || !drawToolsRef.current) return;
    
    const checkForPaths = () => {
      if (!mountedRef.current) return;
      
      try {
        if (drawToolsRef.current) {
          const paths = drawToolsRef.current.getSVGPathData();
          if (paths && paths.length > 0) {
            setSvgPaths(paths);
            if (onPathsUpdated) {
              onPathsUpdated(paths);
            }
          }
        }
      } catch (err) {
        console.error('Error getting SVG paths:', err);
      }
    };
    
    const intervalId = setInterval(checkForPaths, 1000);
    return () => clearInterval(intervalId);
  }, [isInitialized, activeTool]);

  const handleClearAll = useCallback(() => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      
      const markers = getSavedMarkers();
      markers.forEach(marker => {
        deleteMarker(marker.id);
      });
      
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('savedDrawings');
      
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      
      if (onClearAll) {
        onClearAll();
      }
      
      toast.success('All drawings and markers cleared');
    }
  }, [onClearAll]);

  const handleRemoveShape = useCallback((drawingId: string) => {
    if (onRemoveShape) {
      onRemoveShape(drawingId);
    }
  }, [onRemoveShape]);

  const handleDrawingClick = useCallback((drawing: DrawingData) => {
    if (onRegionClick) {
      onRegionClick(drawing);
    }
  }, [onRegionClick]);

  const handleCreatedWrapper = useCallback((shape: any) => {
    // Process the shape and check for SVG path data
    if (shape.svgPath) {
      // Add path to state
      setSvgPaths(prev => [...prev, shape.svgPath]);
      if (onPathsUpdated) {
        onPathsUpdated([...svgPaths, shape.svgPath]);
      }
    }
    onCreated(shape);
  }, [onCreated, svgPaths, onPathsUpdated]);

  return (
    <>
      <FileUploadInput ref={fileInputRef} onChange={handleFileChange} />
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
