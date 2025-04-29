
import { useEffect, forwardRef, useImperativeHandle } from 'react';
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
  onPathUpdate?: (path: string | null) => void;
}

const DrawingControls = forwardRef<DrawingControlsRef, DrawingControlsProps>(({ 
  onCreated, 
  activeTool, 
  onRegionClick, 
  onClearAll, 
  onRemoveShape,
  onUploadToDrawing,
  onPathUpdate
}: DrawingControlsProps, ref) => {
  const { savedDrawings } = useDrawings();
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
    getCurrentPath: () => drawToolsRef.current?.getCurrentPath?.()
  }));
  
  useEffect(() => {
    if (featureGroupRef.current) {
      setIsInitialized(true);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Effect to forward path updates to parent component
  useEffect(() => {
    if (drawToolsRef.current && onPathUpdate) {
      const checkForPathUpdates = setInterval(() => {
        const currentPath = drawToolsRef.current?.getCurrentPath?.();
        if (currentPath) {
          onPathUpdate(currentPath);
        }
      }, 500);
      
      return () => clearInterval(checkForPathUpdates);
    }
  }, [drawToolsRef.current, onPathUpdate]);

  const handleClearAll = () => {
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
      
      // Clear any displayed path data
      if (onPathUpdate) {
        onPathUpdate(null);
      }
      
      toast.success('All drawings and markers cleared');
    }
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
    
    // If the drawing has path data, update it
    if (drawing.svgPath && onPathUpdate) {
      onPathUpdate(drawing.svgPath);
    }
  };

  const handleShapeCreated = (shape: any) => {
    // Forward to parent handler
    onCreated(shape);
    
    // Forward path data if available
    if (shape.svgPath && onPathUpdate) {
      onPathUpdate(shape.svgPath);
    }
  };

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
          onCreated={handleShapeCreated} 
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
