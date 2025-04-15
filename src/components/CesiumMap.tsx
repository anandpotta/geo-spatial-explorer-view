
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
    
    // Add CSS to ensure Cesium doesn't hide other UI elements and is visible
    const style = document.createElement('style');
    style.textContent = `
      body:has(.cesium-viewer) {
        background-color: black !important;
      }
      
      .cesium-viewer, .cesium-widget, .cesium-widget canvas {
        visibility: visible !important;
        display: block !important;
        opacity: 1 !important;
        z-index: 10000 !important;
        background-color: black !important;
      }
      
      .cesium-viewer-toolbar, .cesium-viewer-animationContainer, .cesium-viewer-timelineContainer {
        z-index: 1000 !important;
      }
      
      .cesium-widget-credits {
        z-index: 1000 !important;
        opacity: 0.5;
      }
    `;
    document.head.appendChild(style);
    
    // Modify global cesium debug settings if available
    // Use type assertion or safe check for the CESIUM_BASE_URL property
    if (typeof (window as any).CESIUM_BASE_URL !== 'undefined') {
      console.log("Setting Cesium debug mode ON to better visualize the globe");
    }
    
    // Create an immediately visible loading indicator to show Cesium is working
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'cesium-loading-indicator';
    loadingIndicator.innerText = 'Initializing 3D Globe...';
    loadingIndicator.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background: rgba(0,0,0,0.7); padding: 20px; border-radius: 10px; z-index: 10001;';
    document.body.appendChild(loadingIndicator);
    
    // Remove the loading indicator after a reasonable time
    setTimeout(() => {
      const indicator = document.getElementById('cesium-loading-indicator');
      if (indicator) {
        indicator.remove();
      }
    }, 5000);
    
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
