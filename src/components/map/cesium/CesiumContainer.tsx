import React, { useEffect } from 'react';

interface CesiumContainerProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Dedicated container component for Cesium viewer with enhanced visibility
 */
const CesiumContainer: React.FC<CesiumContainerProps> = ({ containerRef }) => {
  // Force visibility using an effect with more aggressive approach
  useEffect(() => {
    // Ensure the container is fully visible
    if (containerRef.current) {
      // Apply critical visibility styles
      containerRef.current.style.visibility = 'visible';
      containerRef.current.style.display = 'block';
      containerRef.current.style.opacity = '1';
      containerRef.current.style.zIndex = '10000'; // Maximum z-index
      
      // Force repaint by triggering layout
      void containerRef.current.offsetHeight;
      
      // Additional forced visibility check with more frequent intervals
      const forceVisibilityInterval = setInterval(() => {
        if (containerRef.current) {
          containerRef.current.style.visibility = 'visible';
          containerRef.current.style.display = 'block';
          containerRef.current.style.opacity = '1';
          containerRef.current.style.zIndex = '10000';
          
          // Also check for any canvas elements and force them to be visible
          const canvases = containerRef.current.querySelectorAll('canvas');
          canvases.forEach(canvas => {
            canvas.style.visibility = 'visible';
            canvas.style.display = 'block';
            canvas.style.opacity = '1';
            canvas.style.zIndex = '10000';
          });
        } else {
          clearInterval(forceVisibilityInterval);
        }
      }, 100); // More frequent checks (every 100ms)
      
      // Keep checking longer to ensure visibility
      setTimeout(() => clearInterval(forceVisibilityInterval), 10000); // Extend to 10 seconds
    }
  }, [containerRef]);
  
  return (
    <div 
      ref={containerRef} 
      data-cesium-container="true"
      className="absolute inset-0 w-full h-full"
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000, // Maximum z-index
        background: '#000',
        visibility: 'visible',
        display: 'block',
        opacity: 1,
        pointerEvents: 'auto', // Ensure interaction works
        isolation: 'isolate' // Create a new stacking context
      }}
    />
  );
};

export default CesiumContainer;
