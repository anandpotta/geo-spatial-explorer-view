
import React, { useEffect } from 'react';

interface CesiumContainerProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Dedicated container component for Cesium viewer with enhanced visibility
 */
const CesiumContainer: React.FC<CesiumContainerProps> = ({ containerRef }) => {
  // Force visibility using an effect
  useEffect(() => {
    // Ensure the container is fully visible
    if (containerRef.current) {
      containerRef.current.style.visibility = 'visible';
      containerRef.current.style.display = 'block';
      containerRef.current.style.opacity = '1';
      containerRef.current.style.zIndex = '1000';
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
        zIndex: 1000,
        background: '#000',
        visibility: 'visible',
        display: 'block',
        opacity: 1
      }}
    />
  );
};

export default CesiumContainer;
