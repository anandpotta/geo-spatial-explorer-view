
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
      cesiumContainer.current.style.zIndex = '99999'; // Maximum z-index
    }
    
    // Function to check and fix canvas visibility
    const checkCanvases = () => {
      if (cesiumContainer.current) {
        const canvases = cesiumContainer.current.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          canvas.style.visibility = 'visible';
          canvas.style.display = 'block';
          canvas.style.opacity = '1';
          canvas.style.zIndex = '99999'; // Maximum z-index
        });
      }
      
      // Also check for any Cesium canvas elsewhere in the DOM
      document.querySelectorAll('.cesium-widget canvas').forEach(canvas => {
        (canvas as HTMLElement).style.visibility = 'visible';
        (canvas as HTMLElement).style.display = 'block';
        (canvas as HTMLElement).style.opacity = '1';
        (canvas as HTMLElement).style.zIndex = '99999';
      });
      
      // Add an aggressive style tag to force visibility of all Cesium elements
      const existingStyle = document.getElementById('cesium-force-visibility');
      if (!existingStyle) {
        const style = document.createElement('style');
        style.id = 'cesium-force-visibility';
        style.textContent = `
          .cesium-viewer,
          .cesium-widget,
          .cesium-widget canvas,
          [data-cesium-container="true"] {
            visibility: visible !important;
            display: block !important;
            opacity: 1 !important;
            z-index: 99999 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
        `;
        document.head.appendChild(style);
      }
    };
    
    // Check immediately
    checkCanvases();
    
    // Then check repeatedly with greater frequency and for longer duration
    const canvasInterval = setInterval(checkCanvases, 50); // Check every 50ms
    
    // Check for much longer (20 seconds)
    setTimeout(() => {
      clearInterval(canvasInterval);
    }, 20000);
    
    return () => {
      clearInterval(canvasInterval);
    };
  }, [cesiumContainer]);
};
