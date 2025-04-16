
import React, { useEffect } from 'react';

interface CesiumContainerProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Dedicated container component for Cesium viewer with enhanced visibility
 * and optimized rendering performance
 */
const CesiumContainer: React.FC<CesiumContainerProps> = ({ containerRef }) => {
  // Force visibility using an effect with more aggressive approach
  useEffect(() => {
    if (containerRef.current) {
      const applyStyles = () => {
        containerRef.current!.style.cssText = `
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
          z-index: 99999 !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 500px !important;
          background: black !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          pointer-events: auto !important;
          isolation: isolate !important;
        `;
        
        containerRef.current!.dataset.cesiumContainer = "true";
      };
      
      requestAnimationFrame(applyStyles);
      
      // Add an always-visible style to all Cesium elements
      const existingStyle = document.getElementById('cesium-force-visibility');
      if (!existingStyle) {
        const style = document.createElement('style');
        style.id = 'cesium-force-visibility';
        style.textContent = `
          body {
            overflow: hidden;
          }
          
          [data-cesium-container="true"],
          .cesium-viewer,
          .cesium-viewer-cesiumWidgetContainer,
          .cesium-widget,
          .cesium-widget canvas {
            visibility: visible !important;
            display: block !important;
            opacity: 1 !important;
            z-index: 9999 !important;
          }
          
          /* Force UI elements to stay visible */
          .cesium-viewer-toolbar,
          .cesium-viewer-timelineContainer,
          .cesium-viewer-animationContainer {
            z-index: 10000 !important;
          }
        `;
        document.head.appendChild(style);
      }
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
        background: '#000',
        visibility: 'visible',
        display: 'block',
        opacity: 1,
        pointerEvents: 'auto',
        isolation: 'isolate',
        zIndex: 999
      }}
    />
  );
};

export default CesiumContainer;
