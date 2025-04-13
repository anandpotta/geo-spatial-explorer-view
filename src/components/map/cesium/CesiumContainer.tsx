
import React from 'react';

interface CesiumContainerProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Dedicated container component for Cesium viewer
 */
const CesiumContainer: React.FC<CesiumContainerProps> = ({ containerRef }) => {
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
        zIndex: 999,
        background: '#000',
        visibility: 'visible',
        display: 'block',
        opacity: 1
      }}
    />
  );
};

export default CesiumContainer;
