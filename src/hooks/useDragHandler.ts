
import { RefObject, useEffect } from 'react';
import { useDragToolbar } from '@/contexts/DragToolbarContext';

export function useDragHandler(toolbarRef: RefObject<HTMLDivElement>) {
  const {
    position,
    setPosition,
    isDragging,
    setIsDragging,
    dragOffset,
    setDragOffset
  } = useDragToolbar();

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = event.clientX - dragOffset.x;
      const newY = event.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - (toolbarRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (toolbarRef.current?.offsetHeight || 0);
      
      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, setPosition, setIsDragging]);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!toolbarRef.current) return;
    
    const rect = toolbarRef.current.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    setIsDragging(true);
  };

  return { handleMouseDown };
}
