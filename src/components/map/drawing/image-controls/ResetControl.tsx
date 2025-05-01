
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import ControlButton from './ControlButton';
import { findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
import { resetImageTransform } from '@/utils/svg-image-operations';

interface ResetControlProps {
  drawingId: string;
}

/**
 * Control for resetting image transformations
 */
const ResetControl = ({ drawingId }: ResetControlProps) => {
  const getPathElement = () => {
    const pathElement = findSvgPathByDrawingId(drawingId);
    if (!pathElement) {
      console.error('Path element not found');
      toast.error('Could not find image to manipulate');
      return null;
    }
    return pathElement;
  };

  const resetImage = () => {
    try {
      const pathElement = getPathElement();
      if (pathElement) {
        resetImageTransform(pathElement);
        toast.success('Image reset to default position');
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
      }
    } catch (err) {
      console.error('Error resetting image:', err);
      toast.error('Failed to reset image');
    }
  };

  return (
    <ControlButton 
      onClick={resetImage}
      icon={RefreshCw}
      label="Reset"
      ariaLabel="Reset Image to Default"
      bgColor="bg-purple-500"
    />
  );
};

export default ResetControl;
