
import React, { useState, useEffect } from 'react';
import { RotateCw, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageTransformOptions } from '@/utils/image-transform-utils';

interface ImageEditControlsProps {
  drawingId: string;
  initialTransform?: ImageTransformOptions;
  onTransformChange: (options: Partial<ImageTransformOptions>) => void;
  className?: string;
}

const ImageEditControls: React.FC<ImageEditControlsProps> = ({
  drawingId,
  initialTransform,
  onTransformChange,
  className = ''
}) => {
  const [rotation, setRotation] = useState(initialTransform?.rotation || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [translateX, setTranslateX] = useState(initialTransform?.translateX || 0);
  const [translateY, setTranslateY] = useState(initialTransform?.translateY || 0);
  const [scale, setScale] = useState(initialTransform?.scale || 1);
  
  // Update local state when initialTransform changes
  useEffect(() => {
    if (initialTransform) {
      setRotation(initialTransform.rotation);
      setTranslateX(initialTransform.translateX);
      setTranslateY(initialTransform.translateY);
      setScale(initialTransform.scale || 1);
    }
  }, [initialTransform]);

  const handleRotate = (degrees: number) => {
    const newRotation = rotation + degrees;
    setRotation(newRotation);
    onTransformChange({ rotation: newRotation });
  };
  
  const handleScaleChange = (amount: number) => {
    const newScale = Math.max(0.1, Math.min(3, scale + amount));
    setScale(newScale);
    onTransformChange({ scale: newScale });
  };
  
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default to avoid text selection during drag
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const newTranslateX = translateX + deltaX;
      const newTranslateY = translateY + deltaY;
      
      setTranslateX(newTranslateX);
      setTranslateY(newTranslateY);
      onTransformChange({ 
        translateX: newTranslateX,
        translateY: newTranslateY
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, translateX, translateY, onTransformChange]);

  return (
    <div className={`flex gap-2 bg-white/90 backdrop-blur-sm p-2 rounded shadow-md z-[2000] ${className}`}>
      <Button 
        size="sm" 
        variant="outline"
        onClick={() => handleRotate(90)}
        title="Rotate Clockwise"
      >
        <RotateCw className="h-4 w-4" />
      </Button>
      <Button 
        size="sm" 
        variant="outline"
        onMouseDown={startDrag}
        title="Move Image (Free Transform)"
        className={isDragging ? "border-primary" : ""}
      >
        <Move className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ImageEditControls;
