
import React, { useState } from 'react';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import ControlButton from './ControlButton';
import { findSvgPathByDrawingId, removeClipMask } from '@/utils/svg-clip-mask';
import ConfirmationDialog from '../ConfirmationDialog';

interface RemoveControlProps {
  drawingId: string;
  onRemoveShape?: (drawingId: string) => void;
}

/**
 * Control for removing an image
 */
const RemoveControl = ({ drawingId, onRemoveShape }: RemoveControlProps) => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const getPathElement = () => {
    const pathElement = findSvgPathByDrawingId(drawingId);
    if (!pathElement) {
      console.error('Path element not found');
      toast.error('Could not find image to manipulate');
      return null;
    }
    return pathElement;
  };

  const handleRemoveClick = () => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmRemove = () => {
    try {
      // Get reference to the path element
      const pathElement = getPathElement();
      if (pathElement) {
        // Remove clip mask from SVG
        removeClipMask(pathElement);
        toast.success('Image removed from path');
        
        // Remove floor plan from localStorage
        const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
        if (floorPlans[drawingId]) {
          delete floorPlans[drawingId];
          localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
        }
        
        // Remove any associated marker icons
        const leafletMarkerIcons = document.querySelectorAll(`.leaflet-marker-icon[data-drawing-id="${drawingId}"]`);
        leafletMarkerIcons.forEach(icon => icon.remove());
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new CustomEvent('svgPathsUpdated'));
        
        // Call the parent remove handler if provided
        if (onRemoveShape) {
          onRemoveShape(drawingId);
        }
      }
    } catch (err) {
      console.error('Error removing image:', err);
      toast.error('Failed to remove image');
    }
    
    // Close the dialog
    setIsConfirmDialogOpen(false);
  };

  const handleCancelRemove = () => {
    setIsConfirmDialogOpen(false);
  };

  return (
    <>
      <ControlButton 
        onClick={handleRemoveClick}
        icon={Trash}
        label="Remove"
        ariaLabel="Remove Image"
        bgColor="bg-red-500"
      />
      
      <ConfirmationDialog 
        isOpen={isConfirmDialogOpen}
        title="Remove Image"
        description="Are you sure you want to remove this image from the map? This action cannot be undone."
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </>
  );
};

export default RemoveControl;
