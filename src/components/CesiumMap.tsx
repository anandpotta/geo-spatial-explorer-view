
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
    
    return () => {
      console.log("CesiumMap component unmounted");
    };
  }, []);
  
  return <CesiumMapCore {...props} />;
};

export default CesiumMap;
