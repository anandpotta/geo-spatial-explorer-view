
import { toast } from 'sonner';
import { findSvgPathByDrawingId } from '@/utils/svg-clip-mask';

/**
 * Hook for getting a path element by drawing ID
 */
export const usePathElement = (drawingId: string) => {
  const getPathElement = () => {
    const pathElement = findSvgPathByDrawingId(drawingId);
    if (!pathElement) {
      console.error('Path element not found');
      toast.error('Could not find image to manipulate');
      return null;
    }
    return pathElement;
  };

  return { getPathElement };
};
