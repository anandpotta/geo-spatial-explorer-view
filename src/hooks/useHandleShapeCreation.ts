
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useHandleShapeCreation(onCreated: (shape: any) => void, onPathsUpdated: (paths: string[]) => void, svgPaths: string[]) {
  const { isAuthenticated } = useAuth();
  
  const handleCreatedWrapper = useCallback((shape: any) => {
    if (!isAuthenticated) {
      toast.error('Please log in to save drawings');
      return;
    }
    
    const wrappedHandler = createShapeCreationHandler({
      onCreated,
      onPathsUpdated,
      svgPaths
    });
    
    wrappedHandler(shape);
  }, [isAuthenticated, onCreated, onPathsUpdated, svgPaths]);

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
