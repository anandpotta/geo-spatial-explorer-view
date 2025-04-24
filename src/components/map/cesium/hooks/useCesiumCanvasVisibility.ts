
import { useEffect } from 'react';

/**
 * Hook to enforce canvas and container visibility
 */
export const useCesiumCanvasVisibility = (
  cesiumContainer: React.RefObject<HTMLDivElement>
) => {
  // Force visibility on container and all canvas elements
  useEffect(() => {
    // Initial setup for container
    if (cesiumContainer.current) {
      cesiumContainer.current.style.visibility = 'visible';
      cesiumContainer.current.style.display = 'block';
      cesiumContainer.current.style.opacity = '1';
      cesiumContainer.current.style.zIndex = '1000'; // Increased z-index
    }
    
    // Function to check and fix canvas visibility
    const checkCanvases = () => {
      if (cesiumContainer.current) {
        const canvases = cesiumContainer.current.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          canvas.style.visibility = 'visible';
          canvas.style.display = 'block';
          canvas.style.opacity = '1';
          canvas.style.zIndex = '1000'; // Higher z-index for visibility
        });
      }
    };
    
    // Check repeatedly and for longer duration
    const canvasInterval = setInterval(checkCanvases, 100);
    setTimeout(() => {
      clearInterval(canvasInterval);
    }, 10000); // Check for longer (10 seconds)
    
    return () => {
      clearInterval(canvasInterval);
    };
  }, [cesiumContainer]);
};
