
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Position, ImageTransformation } from '@/utils/geo-utils';

interface UseImageTransformProps {
  drawingId: string;
  onTransform?: (transformation: ImageTransformation) => void;
}

export const useImageTransform = ({ drawingId, onTransform }: UseImageTransformProps) => {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  
  // Load saved transformation from localStorage
  useEffect(() => {
    const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    if (savedFloorPlans[drawingId]?.transformation) {
      const t = savedFloorPlans[drawingId].transformation;
      setRotation(t.rotation || 0);
      setScale(t.scale || 1);
      setPosition(t.position || { x: 0, y: 0 });
    }
  }, [drawingId]);

  const saveTransformation = () => {
    if (!drawingId) return;
    
    const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    if (savedFloorPlans[drawingId]) {
      const transformation = { rotation, scale, position };
      savedFloorPlans[drawingId].transformation = transformation;
      localStorage.setItem('floorPlans', JSON.stringify(savedFloorPlans));
      if (onTransform) {
        onTransform(transformation);
      }
    }
  };

  const handleRotateLeft = () => {
    setRotation((prev) => {
      const newRotation = prev - 15;
      setTimeout(saveTransformation, 100);
      return newRotation;
    });
  };

  const handleRotateRight = () => {
    setRotation((prev) => {
      const newRotation = prev + 15;
      setTimeout(saveTransformation, 100);
      return newRotation;
    });
  };

  const handleZoomIn = () => {
    setScale((prev) => {
      const newScale = Math.min(prev + 0.1, 3);
      setTimeout(saveTransformation, 100);
      return newScale;
    });
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.1, 0.2);
      setTimeout(saveTransformation, 100);
      return newScale;
    });
  };

  const handleReset = () => {
    setRotation(0);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setTimeout(saveTransformation, 100);
    toast.info('Image reset to original position');
  };

  const handleUpdateScale = (newScale: number) => {
    setScale(newScale);
    setTimeout(saveTransformation, 100);
  };

  return {
    rotation,
    scale,
    position,
    setPosition,
    handleRotateLeft,
    handleRotateRight,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handleUpdateScale,
    saveTransformation
  };
};
