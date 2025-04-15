
import React, { useEffect } from 'react';
import * as Cesium from 'cesium';
import { Location } from '@/utils/geo-utils';
import CesiumMapCore from './map/cesium/CesiumMapCore';

interface CesiumMapProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
  cinematicFlight?: boolean;
  onViewerReady?: (viewer: Cesium.Viewer) => void;
}

/**
 * Main CesiumMap component
 */
const CesiumMap: React.FC<CesiumMapProps> = (props) => {
  
  // Ensure Cesium assets are loaded
  useEffect(() => {
    // Force Cesium to be ready
    console.log("CesiumMap component mounted, ensuring Cesium is ready");
    
    // Check if Cesium's CSS is loaded
    const isCesiumCssLoaded = document.querySelector('link[href*="Cesium/Widgets/widgets.css"]');
    if (!isCesiumCssLoaded) {
      console.log("Adding Cesium CSS");
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/cesium@1.110.0/Build/Cesium/Widgets/widgets.css';
      document.head.appendChild(link);
    }
    
    // Add CSS to ensure Cesium doesn't hide other UI elements and is visible
    const style = document.createElement('style');
    style.textContent = `
      .cesium-viewer-toolbar, .cesium-viewer-animationContainer, .cesium-viewer-timelineContainer {
        z-index: 1000 !important;
      }
      .cesium-widget-credits {
        z-index: 1000 !important;
        opacity: 0.5;
      }
      .cesium-widget, .cesium-viewer, .cesium-widget canvas {
        visibility: visible !important;
        display: block !important;
        opacity: 1 !important;
        z-index: 10000 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      console.log("CesiumMap component unmounted");
    };
  }, []);
  
  return (
    <div className="w-full h-full relative" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'black',
      zIndex: 10000,
      visibility: 'visible',
      opacity: 1
    }}>
      <CesiumMapCore {...props} />
    </div>
  );
};

export default CesiumMap;
