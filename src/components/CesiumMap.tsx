
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
 * Main CesiumMap component with improved visibility
 */
const CesiumMap: React.FC<CesiumMapProps> = (props) => {
  
  // Ensure Cesium assets are loaded and globe is visible
  useEffect(() => {
    console.log("CesiumMap component mounted, ensuring Cesium is ready");
    
    // Apply critical CSS to ensure Cesium is visible
    const style = document.createElement('style');
    style.textContent = `
      /* Force body background to black when Cesium is present */
      body, html {
        background-color: black !important;
        overflow: hidden !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Force all Cesium elements to be visible with extreme overrides */
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
        background-color: black !important;
      }
      
      /* Force UI elements to stay on top */
      .cesium-viewer-toolbar,
      .cesium-viewer-animationContainer,
      .cesium-viewer-timelineContainer {
        z-index: 1000000 !important;
        position: relative !important;
      }
      
      /* Override any possible hidden styles */
      [style*="visibility: hidden"],
      [style*="display: none"],
      [style*="opacity: 0"] {
        visibility: visible !important;
        display: block !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Create a loading indicator that will be removed after globe renders
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'cesium-loading-indicator';
    loadingIndicator.innerHTML = '<b>Initializing 3D Globe...</b><br>Please wait while the globe renders...';
    loadingIndicator.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px; z-index: 9999999; text-align: center; font-family: sans-serif; box-shadow: 0 0 10px rgba(255,255,255,0.3);';
    document.body.appendChild(loadingIndicator);
    
    // Remove the loading indicator after a longer time
    setTimeout(() => {
      const indicator = document.getElementById('cesium-loading-indicator');
      if (indicator) {
        indicator.remove();
      }
    }, 8000);
    
    return () => {
      console.log("CesiumMap component unmounted");
    };
  }, []);
  
  return (
    <div className="fixed inset-0 w-full h-full" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'black',
      zIndex: 999999,
      visibility: 'visible',
      opacity: 1
    }}>
      <CesiumMapCore {...props} />
    </div>
  );
};

export default CesiumMap;
