
import { useEffect } from 'react';

interface UseResizeHandlerProps {
  isMountedRef: React.MutableRefObject<boolean>;
  debouncedUpdateLayers: () => void;
}

export function useResizeHandler({
  isMountedRef,
  debouncedUpdateLayers
}: UseResizeHandlerProps) {
  // Listen for resize events which might affect positioning
  useEffect(() => {
    const handleResize = () => {
      if (isMountedRef.current) {
        debouncedUpdateLayers();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [debouncedUpdateLayers, isMountedRef]);
}
