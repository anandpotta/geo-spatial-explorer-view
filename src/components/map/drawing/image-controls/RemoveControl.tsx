
import React from 'react';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import ControlButton from './ControlButton';
import { findSvgPathByDrawingId } from '@/utils/svg-path-finder';
import { removeClipMask } from '@/utils/clip-mask/clip-mask-remove';

interface RemoveControlProps {
  drawingId: string;
  onRemoveShape?: (drawingId: string) => void;
}

/**
 * Control for removing an image
 */
const RemoveControl = ({ drawingId, onRemoveShape }: RemoveControlProps) => {
  const getPathElement = () => {
    const pathElement = findSvgPathByDrawingId(drawingId);
    if (!pathElement) {
      console.error('Path element not found');
      toast.error('Could not find image to manipulate');
      return null;
    }
    return pathElement;
  };

  const removeImage = () => {
    try {
      const pathElement = getPathElement();
      if (pathElement) {
        removeClipMask(pathElement);
        toast.success('Image removed from path');
        
        // Remove floor plan from localStorage
        const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
        if (floorPlans[drawingId]) {
          delete floorPlans[drawingId];
          localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
        }
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
        
        // Call the parent remove handler if provided
        if (onRemoveShape) {
          onRemoveShape(drawingId);
        }
      }
    } catch (err) {
      console.error('Error removing image:', err);
      toast.error('Failed to remove image');
    }
  };

  return (
    <ControlButton 
      onClick={removeImage}
      icon={Trash}
      label="Remove"
      ariaLabel="Remove Image"
      bgColor="bg-red-500"
    />
  );
};

export default RemoveControl;
