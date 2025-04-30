
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, RotateCw } from 'lucide-react';

interface ImageRotationControlsProps {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  disabled?: boolean;
}

const ImageRotationControls = ({ 
  onRotateLeft, 
  onRotateRight,
  disabled = false 
}: ImageRotationControlsProps) => {
  return (
    <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm p-1 rounded-md shadow-sm">
      <Button
        size="sm"
        variant="outline"
        onClick={onRotateLeft}
        disabled={disabled}
        className="h-8 w-8 p-0" 
        aria-label="Rotate left"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={onRotateRight}
        disabled={disabled}
        className="h-8 w-8 p-0"
        aria-label="Rotate right"
      >
        <RotateCw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ImageRotationControls;
