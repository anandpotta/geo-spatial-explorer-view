
import React from 'react';

interface CesiumContainerProps {
  containerRef: React.RefObject<HTMLDivElement>;
  children?: React.ReactNode;
}

/**
 * Container component for the Cesium viewer with proper styling
 */
const CesiumContainer: React.FC<CesiumContainerProps> = ({ containerRef, children }) => {
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full cesium-container"
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0,
        zIndex: 1000, // Increased z-index
        visibility: 'visible', // Always visible
        opacity: 1,
        transition: 'opacity 0.3s ease-in-out',
        minHeight: '500px',
        display: 'block',
        background: 'black' // Black background for contrast
      }}
      data-cesium-container="true"
    >
      {children}
    </div>
  );
};

export default CesiumContainer;
