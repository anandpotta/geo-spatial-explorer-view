
import React from 'react';
import { RotateCw, RotateCcw, Shrink, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { 
  rotateImageInClipMask, 
  scaleImageInClipMask, 
  removeClipMask, 
  findSvgPathByDrawingId 
} from '@/utils/svg-clip-mask';

interface ImageControlsProps {
  drawingId: string;
  onRemoveShape?: (drawingId: string) => void;
}

const ImageControls = ({ drawingId, onRemoveShape }: ImageControlsProps) => {
  const rotateLeft = () => {
    try {
      const pathElement = findSvgPathByDrawingId(drawingId);
      if (pathElement) {
        rotateImageInClipMask(pathElement, -15);
        toast.success('Image rotated left');
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
      } else {
        console.error('Path element not found for rotation');
        toast.error('Could not find image to rotate');
      }
    } catch (err) {
      console.error('Error rotating image left:', err);
      toast.error('Failed to rotate image');
    }
  };

  const rotateRight = () => {
    try {
      const pathElement = findSvgPathByDrawingId(drawingId);
      if (pathElement) {
        rotateImageInClipMask(pathElement, 15);
        toast.success('Image rotated right');
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
      } else {
        console.error('Path element not found for rotation');
        toast.error('Could not find image to rotate');
      }
    } catch (err) {
      console.error('Error rotating image right:', err);
      toast.error('Failed to rotate image');
    }
  };

  const shrinkImage = () => {
    try {
      const pathElement = findSvgPathByDrawingId(drawingId);
      if (pathElement) {
        scaleImageInClipMask(pathElement, 0.8);
        toast.success('Image scaled down');
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
      } else {
        console.error('Path element not found for scaling');
        toast.error('Could not find image to scale');
      }
    } catch (err) {
      console.error('Error scaling image:', err);
      toast.error('Failed to scale image');
    }
  };

  const removeImage = () => {
    try {
      const pathElement = findSvgPathByDrawingId(drawingId);
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
      } else {
        console.error('Path element not found for removal');
        toast.error('Could not find image to remove');
      }
    } catch (err) {
      console.error('Error removing image:', err);
      toast.error('Failed to remove image');
    }
  };

  return (
    <div className="image-controls-container flex flex-col gap-1 bg-white/75 backdrop-blur-sm p-1 rounded-md shadow-md">
      <button 
        onClick={rotateLeft}
        className="p-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        aria-label="Rotate Left"
      >
        <RotateCcw size={16} />
      </button>
      <button 
        onClick={rotateRight}
        className="p-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        aria-label="Rotate Right"
      >
        <RotateCw size={16} />
      </button>
      <button 
        onClick={shrinkImage}
        className="p-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        aria-label="Shrink Image"
      >
        <Shrink size={16} />
      </button>
      <button 
        onClick={removeImage}
        className="p-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
        aria-label="Remove Image"
      >
        <Trash size={16} />
      </button>
    </div>
  );
};

export default ImageControls;
