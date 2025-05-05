
import React from 'react';
import { Shrink, Maximize } from 'lucide-react';
import { toast } from 'sonner';
import ControlButton from './ControlButton';
import { findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
import { scaleImageInClipMask } from '@/utils/svg-image-operations';

interface ScalingControlsProps {
  drawingId: string;
  scaleDownFactor: number;
  scaleUpFactor: number;
}

/**
 * Controls for scaling an image
 */
const ScalingControls = ({ 
  drawingId, 
  scaleDownFactor, 
  scaleUpFactor 
}: ScalingControlsProps) => {
  const getPathElement = () => {
    const pathElement = findSvgPathByDrawingId(drawingId);
    if (!pathElement) {
      console.error('Path element not found');
      toast.error('Could not find image to manipulate');
      return null;
    }
    return pathElement;
  };

  const shrinkImage = () => {
    try {
      const pathElement = getPathElement();
      if (pathElement) {
        scaleImageInClipMask(pathElement, scaleDownFactor);
        toast.success('Image scaled down');
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
      }
    } catch (err) {
      console.error('Error scaling image:', err);
      toast.error('Failed to scale image');
    }
  };
  
  const enlargeImage = () => {
    try {
      const pathElement = getPathElement();
      if (pathElement) {
        scaleImageInClipMask(pathElement, scaleUpFactor);
        toast.success('Image enlarged');
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
      }
    } catch (err) {
      console.error('Error enlarging image:', err);
      toast.error('Failed to enlarge image');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <ControlButton 
        onClick={shrinkImage}
        icon={Shrink}
        ariaLabel="Shrink Image"
      />
      <ControlButton 
        onClick={enlargeImage}
        icon={Maximize}
        ariaLabel="Enlarge Image"
      />
    </div>
  );
};

export default ScalingControls;
