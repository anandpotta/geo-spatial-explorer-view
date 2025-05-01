
import React from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ControlButton from './ControlButton';
import { findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
import { rotateImageInClipMask } from '@/utils/svg-image-operations';

interface RotationControlsProps {
  drawingId: string;
  rotationStep: number;
}

/**
 * Controls for rotating an image
 */
const RotationControls = ({ drawingId, rotationStep }: RotationControlsProps) => {
  const getPathElement = () => {
    const pathElement = findSvgPathByDrawingId(drawingId);
    if (!pathElement) {
      console.error('Path element not found');
      toast.error('Could not find image to manipulate');
      return null;
    }
    return pathElement;
  };

  const rotateLeft = () => {
    try {
      const pathElement = getPathElement();
      if (pathElement) {
        rotateImageInClipMask(pathElement, -rotationStep);
        toast.success('Image rotated left');
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
      }
    } catch (err) {
      console.error('Error rotating image left:', err);
      toast.error('Failed to rotate image');
    }
  };

  const rotateRight = () => {
    try {
      const pathElement = getPathElement();
      if (pathElement) {
        rotateImageInClipMask(pathElement, rotationStep);
        toast.success('Image rotated right');
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
      }
    } catch (err) {
      console.error('Error rotating image right:', err);
      toast.error('Failed to rotate image');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <ControlButton 
        onClick={rotateLeft}
        icon={RotateCcw}
        ariaLabel="Rotate Left"
      />
      <ControlButton 
        onClick={rotateRight}
        icon={RotateCw}
        ariaLabel="Rotate Right"
      />
    </div>
  );
};

export default RotationControls;
