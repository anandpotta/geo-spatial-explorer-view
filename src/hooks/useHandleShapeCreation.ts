
import { useCallback } from 'react';
import { toast } from 'sonner';

export function useHandleShapeCreation(onCreated: (shape: any) => void, onPathsUpdated: (paths: string[]) => void, svgPaths: string[]) {
  
  const handleCreatedWrapper = useCallback((shape: any) => {
    // No auth check needed - allow all shape creation
    const wrappedHandler = createShapeCreationHandler({
      onCreated,
      onPathsUpdated,
      svgPaths
    });
    
    wrappedHandler(shape);
  }, [onCreated, onPathsUpdated, svgPaths]);

  return {
    handleCreatedWrapper
  };
}

function createShapeCreationHandler({ onCreated, onPathsUpdated, svgPaths }: any) {
  return (shape: any) => {
    // Implementation from original ShapeCreationHandler.tsx
    if (onCreated) {
      onCreated(shape);
    }
    
    // Update paths if needed
    if (onPathsUpdated && shape.svgPath) {
      const updatedPaths = [...svgPaths, shape.svgPath];
      onPathsUpdated(updatedPaths);
    }
  };
}
