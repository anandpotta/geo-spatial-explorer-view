
import React, { useState, useEffect } from 'react';
import RotationControls from './image-controls/RotationControls';
import ScalingControls from './image-controls/ScalingControls';
import MovementControls from './image-controls/MovementControls';
import ResetControl from './image-controls/ResetControl';
import RemoveControl from './image-controls/RemoveControl';
import ImageControlsExpander from './image-controls/ImageControlsExpander';
import { MOVEMENT_STEP, ROTATION_STEP, SCALE_FACTOR, SCALE_UP_FACTOR } from './image-controls/constants';

interface ImageControlsProps {
  drawingId: string;
  onRemoveShape?: (drawingId: string) => void;
  alwaysExpanded?: boolean;
}

/**
 * Container component for image manipulation controls
 */
const ImageControls = ({ drawingId, onRemoveShape, alwaysExpanded = false }: ImageControlsProps) => {
  // Default to expanded state to show all controls
  const [expanded, setExpanded] = useState(true);
  
  // Use effect to ensure controls remain visible
  useEffect(() => {
    // Make sure controls are visible after a short delay
    const timer = setTimeout(() => {
      const wrapper = document.querySelector(`.image-controls-wrapper`);
      if (wrapper) {
        (wrapper as HTMLElement).style.opacity = '1';
        (wrapper as HTMLElement).style.visibility = 'visible';
        (wrapper as HTMLElement).style.display = 'block';
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="image-controls-container flex flex-col gap-1 bg-white/90 backdrop-blur-sm p-2 rounded-md shadow-md border border-gray-200">
      {!alwaysExpanded && (
        <ImageControlsExpander expanded={expanded} setExpanded={setExpanded} />
      )}
      
      <div className="flex flex-col gap-1.5">
        {/* Always visible controls */}
        <RotationControls 
          drawingId={drawingId}
          rotationStep={ROTATION_STEP} 
        />
        
        <ScalingControls 
          drawingId={drawingId}
          scaleDownFactor={SCALE_FACTOR}
          scaleUpFactor={SCALE_UP_FACTOR}
        />
        
        {/* Extended controls - now always shown */}
        {(expanded || alwaysExpanded) && (
          <>
            <MovementControls 
              drawingId={drawingId}
              movementStep={MOVEMENT_STEP}
            />
            
            <ResetControl drawingId={drawingId} />
          </>
        )}
        
        <RemoveControl 
          drawingId={drawingId}
          onRemoveShape={onRemoveShape}
        />
      </div>
    </div>
  );
};

export default ImageControls;
