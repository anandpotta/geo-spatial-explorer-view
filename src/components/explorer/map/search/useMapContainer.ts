
import { useEffect, useRef, useState } from 'react';

export const useMapContainer = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  
  useEffect(() => {
    // Find the map container to use as reference point
    const findMapContainer = () => {
      // For Cesium map
      const cesiumMap = document.querySelector('[data-map-type="cesium"]');
      // For Leaflet map
      const leafletMap = document.querySelector('[data-map-type="leaflet"]');
      
      // Store the appropriate container reference
      if (cesiumMap && window.getComputedStyle(cesiumMap).display !== 'none') {
        mapContainerRef.current = cesiumMap as HTMLDivElement;
      } else if (leafletMap && window.getComputedStyle(leafletMap).display !== 'none') {
        mapContainerRef.current = leafletMap as HTMLDivElement;
      }
    };
    
    findMapContainer();
    
    // Listen for view changes to update the map container reference
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          findMapContainer();
        }
      }
    });
    
    const cesiumMap = document.querySelector('[data-map-type="cesium"]');
    const leafletMap = document.querySelector('[data-map-type="leaflet"]');
    
    if (cesiumMap) observer.observe(cesiumMap, { attributes: true });
    if (leafletMap) observer.observe(leafletMap, { attributes: true });
    
    // Listen for map ready event to know when the map is loaded
    const handleMapReady = () => {
      console.log("Map is now loaded, enabling location tag display");
      setMapLoaded(true);
    };
    
    window.addEventListener('leafletMapReady', handleMapReady);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('leafletMapReady', handleMapReady);
    };
  }, []);
  
  return { mapContainerRef, mapLoaded };
};
