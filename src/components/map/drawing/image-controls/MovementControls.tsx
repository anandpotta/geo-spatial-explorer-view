
import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import ControlButton from './ControlButton';
import { findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
import { moveImageInClipMask } from '@/utils/svg-image-operations';

interface MovementControlsProps {
  drawingId: string;
  movementStep: number;
}

/**
 * Controls for moving an image
 */
const MovementControls = ({ drawingId, movementStep }: MovementControlsProps) => {
  const getPathElement = () => {
    const pathElement = findSvgPathByDrawingId(drawingId);
    if (!pathElement) {
      console.error('Path element not found');
      toast.error('Could not find image to manipulate');
      return null;
    }
    return pathElement;
  };

  const moveImage = (dx: number, dy: number) => {
    try {
      const pathElement = getPathElement();
      if (pathElement) {
        moveImageInClipMask(pathElement, dx, dy);
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
      }
    } catch (err) {
      console.error('Error moving image:', err);
      toast.error('Failed to move image');
    }
  };

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <ControlButton 
        onClick={() => moveImage(-movementStep, 0)}
        icon={ArrowLeft}
        ariaLabel="Move Left"
      />
      <div className="flex flex-col gap-1.5">
        <ControlButton 
          onClick={() => moveImage(0, -movementStep)}
          icon={ArrowUp}
          ariaLabel="Move Up"
        />
        <ControlButton 
          onClick={() => moveImage(0, movementStep)}
          icon={ArrowDown}
          ariaLabel="Move Down"
        />
      </div>
      <ControlButton 
        onClick={() => moveImage(movementStep, 0)}
        icon={ArrowRight}
        ariaLabel="Move Right"
      />
    </div>
  );
};

export default MovementControls;
