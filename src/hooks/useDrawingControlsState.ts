
import { useState, useRef } from 'react';
import { DrawingData, updateDrawingImage, updateDrawingImageTransform } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import { useDrawingControls } from './useDrawingControls';
import { useFileUpload } from './useFileUpload';
import { deleteMarker, getSavedMarkers } from '@/utils/marker-utils';
import { ImageTransformOptions } from '@/utils/image-transform-utils';

interface DrawingControlsStateProps {
  onCreated: (shape: any) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
  onRegionClick?: (drawing: DrawingData) => void;
  onUploadToDrawing?: (drawingId: string, file: File, transformOptions?: ImageTransformOptions) => void;
  onPathsUpdated?: (paths: string[]) => void;
}

export function useDrawingControlsState({
  onCreated,
  onClearAll,
  onRemoveShape,
  onRegionClick,
  onUploadToDrawing,
  onPathsUpdated
}: DrawingControlsStateProps) {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  
  const {
    featureGroupRef,
    drawToolsRef,
    isInitialized,
    fileInputRef,
    activateEditMode
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

  return {
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
  };
}
