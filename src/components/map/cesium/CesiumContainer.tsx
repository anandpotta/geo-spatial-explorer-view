
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
      containerRef.current.style.zIndex = '999999'; // Maximum z-index
      containerRef.current.dataset.cesiumContainer = "true";
      
      // Force dimensions
      containerRef.current.style.width = '100%';
      containerRef.current.style.height = '100%';
      containerRef.current.style.minHeight = '500px';
      
      // Force repaint by triggering layout
      void containerRef.current.offsetHeight;
      
      // Clear any existing background
      containerRef.current.style.background = 'black';
      
      // Add an always-visible style to all Cesium elements
      const style = document.createElement('style');
      style.textContent = `
        [data-cesium-container="true"],
        .cesium-viewer,
        .cesium-viewer-cesiumWidgetContainer,
        .cesium-widget,
        .cesium-widget canvas {
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
          z-index: 999999 !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: black !important;
        }
      `;
      document.head.appendChild(style);
      
      // Explicitly set the position to fixed to ensure it's above everything
      containerRef.current.style.position = 'fixed';
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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999, // Extremely high z-index
        background: '#000',
        visibility: 'visible',
        display: 'block',
        opacity: 1,
        pointerEvents: 'auto',
        isolation: 'isolate'
      }}
    />
  );
};

export default CesiumContainer;
