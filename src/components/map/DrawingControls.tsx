
import { useEffect, forwardRef, useImperativeHandle, useState } from 'react';
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
import { updateDrawingImageTransform, updateDrawingImage } from '@/utils/drawing-utils';
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
    handleUploadRequest,
    imageTransformOptions,
    updateImageTransform
  } = useFileUpload({ 
    onUploadToDrawing: (drawingId, file, transform) => {
      // Convert the file to base64 string
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result && typeof e.target.result === 'string') {
          // Update the drawing with the image data
          updateDrawingImage(drawingId, e.target.result);
          
          // Update transform if provided
          if (transform) {
            updateDrawingImageTransform(drawingId, transform);
          }
          
          // Notify parent component if provided
          if (onUploadToDrawing) {
            onUploadToDrawing(drawingId, file, transform);
          }
          
          toast.success('Image added to shape');
        }
      };
      reader.onerror = () => {
        toast.error('Error reading file');
      };
      reader.readAsDataURL(file);
    } 
  });
  
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
  };

  const handleImageTransform = (drawingId: string, options: Partial<ImageTransformOptions>) => {
    updateImageTransform(options);
    updateDrawingImageTransform(drawingId, {
      ...imageTransformOptions,
      ...options
    });
  };

  const handleCreatedWrapper = (shape: any) => {
    // Process the shape and check for SVG path data
    if (shape.svgPath) {
      // Add path to state
      setSvgPaths(prev => [...prev, shape.svgPath]);
      if (onPathsUpdated) {
        onPathsUpdated([...svgPaths, shape.svgPath]);
      }
    }
    onCreated(shape);
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
