
import React, { useState } from 'react';
import { RotateCw, RotateCcw, Shrink, Trash, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Maximize, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { 
  removeClipMask, 
  findSvgPathByDrawingId 
} from '@/utils/svg-clip-mask';
import {
  rotateImageInClipMask,
  scaleImageInClipMask,
  moveImageInClipMask,
  resetImageTransform
} from '@/utils/svg-image-operations';

interface ImageControlsProps {
  drawingId: string;
  onRemoveShape?: (drawingId: string) => void;
}

const MOVEMENT_STEP = 5; // pixels to move in each direction
const ROTATION_STEP = 15; // degrees to rotate
const SCALE_FACTOR = 0.8; // scale down by 20%
const SCALE_UP_FACTOR = 1.25; // scale up by 25%

const ImageControls = ({ drawingId, onRemoveShape }: ImageControlsProps) => {
  const [expanded, setExpanded] = useState(false);
  
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
        rotateImageInClipMask(pathElement, -ROTATION_STEP);
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
        rotateImageInClipMask(pathElement, ROTATION_STEP);
        toast.success('Image rotated right');
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
      }
    } catch (err) {
      console.error('Error rotating image right:', err);
      toast.error('Failed to rotate image');
    }
  };

  const shrinkImage = () => {
    try {
      const pathElement = getPathElement();
      if (pathElement) {
        scaleImageInClipMask(pathElement, SCALE_FACTOR);
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
        scaleImageInClipMask(pathElement, SCALE_UP_FACTOR);
        toast.success('Image enlarged');
        
        // Force redraw
        window.dispatchEvent(new Event('resize'));
      }
    } catch (err) {
      console.error('Error enlarging image:', err);
      toast.error('Failed to enlarge image');
    }
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
    <div className="image-controls-container flex flex-col gap-1 bg-white/90 backdrop-blur-sm p-2 rounded-md shadow-md border border-gray-200">
      <div className="text-center mb-1">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
        >
          {expanded ? 'Hide Options' : 'Show All Options'}
        </button>
      </div>
      
      <div className="flex flex-col gap-1.5">
        {/* Always visible controls */}
        <div className="grid grid-cols-2 gap-1.5">
          <button 
            onClick={rotateLeft}
            className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
            aria-label="Rotate Left"
            title="Rotate Left"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={rotateRight}
            className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
            aria-label="Rotate Right"
            title="Rotate Right"
          >
            <RotateCw size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5">
          <button 
            onClick={shrinkImage}
            className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
            aria-label="Shrink Image"
            title="Shrink Image"
          >
            <Shrink size={16} />
          </button>
          <button 
            onClick={enlargeImage}
            className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
            aria-label="Enlarge Image"
            title="Enlarge Image"
          >
            <Maximize size={16} />
          </button>
        </div>
        
        {/* Extended controls when expanded */}
        {expanded && (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              <button 
                onClick={() => moveImage(-MOVEMENT_STEP, 0)}
                className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
                aria-label="Move Left"
                title="Move Left"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex flex-col gap-1.5">
                <button 
                  onClick={() => moveImage(0, -MOVEMENT_STEP)}
                  className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
                  aria-label="Move Up"
                  title="Move Up"
                >
                  <ArrowUp size={16} />
                </button>
                <button 
                  onClick={() => moveImage(0, MOVEMENT_STEP)}
                  className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
                  aria-label="Move Down"
                  title="Move Down"
                >
                  <ArrowDown size={16} />
                </button>
              </div>
              <button 
                onClick={() => moveImage(MOVEMENT_STEP, 0)}
                className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
                aria-label="Move Right"
                title="Move Right"
              >
                <ArrowRight size={16} />
              </button>
            </div>
            
            <button 
              onClick={resetImage}
              className="p-1.5 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors flex items-center justify-center"
              aria-label="Reset Image"
              title="Reset Image to Default"
            >
              <RefreshCw size={16} className="mr-1" />
              <span className="text-xs">Reset</span>
            </button>
          </>
        )}
        
        <button 
          onClick={removeImage}
          className="p-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center mt-1"
          aria-label="Remove Image"
          title="Remove Image"
        >
          <Trash size={16} className="mr-1" />
          <span className="text-xs">Remove</span>
        </button>
      </div>
    </div>
  );
};

export default ImageControls;
