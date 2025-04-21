
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
        // Apply critical visibility styles directly to ensure the container is visible
        containerRef.current!.style.cssText = `
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
          z-index: 999999 !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 500px !important;
          background: black !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          pointer-events: auto !important;
          isolation: isolate !important;
          overflow: hidden !important;
        `;
        
        containerRef.current!.dataset.cesiumContainer = "true";
      };
      
      // Apply styles immediately and in the next frame
      applyStyles();
      requestAnimationFrame(applyStyles);
      
      // Add an always-visible style to all Cesium elements
      const existingStyle = document.getElementById('cesium-force-visibility');
      if (!existingStyle) {
        const style = document.createElement('style');
        style.id = 'cesium-force-visibility';
        style.textContent = `
          body {
            overflow: hidden !important;
            background-color: #000 !important;
          }
          
          [data-cesium-container="true"],
          .cesium-viewer,
          .cesium-viewer-cesiumWidgetContainer,
          .cesium-widget,
          .cesium-widget canvas {
            visibility: visible !important;
            display: block !important;
            opacity: 1 !important;
            z-index: 999999 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
          
          /* Force UI elements to stay visible */
          .cesium-viewer-toolbar,
          .cesium-viewer-timelineContainer,
          .cesium-viewer-animationContainer {
            z-index: 1000000 !important;
          }
          
          /* Override any hidden elements */
          .cesium-widget canvas[style*="visibility: hidden"],
          .cesium-widget[style*="visibility: hidden"],
          .cesium-viewer[style*="visibility: hidden"],
          [data-cesium-container="true"][style*="visibility: hidden"] {
            visibility: visible !important;
            display: block !important;
            opacity: 1 !important;
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
      className="fixed inset-0 w-full h-full"
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'fixed',
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
        zIndex: 999999
      }}
    />
  );
};

export default CesiumContainer;
