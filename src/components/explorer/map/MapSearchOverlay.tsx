
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import LocationSearch from '@/components/LocationSearch';
import { Location } from '@/utils/geo-utils';
import LocationTag from './LocationTag';

interface MapSearchOverlayProps {
  onLocationSelect: (location: Location) => void;
  flyCompleted?: boolean;
}

const MapSearchOverlay: React.FC<MapSearchOverlayProps> = ({ onLocationSelect, flyCompleted = true }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const positionUpdateTimerRef = useRef<number | null>(null);
  const lastFlyCompleted = useRef<boolean>(flyCompleted);
  
  // Define the calculateMarkerPosition function at the component level
  // so it can be referenced from anywhere within the component
  const calculateMarkerPosition = () => {
    const container = mapContainerRef.current;
    if (!container || !selectedLocation) return;
    
    // For 3D globe view (center of the screen for simplicity)
    const isCesium = container.getAttribute('data-map-type') === 'cesium';
    
    if (isCesium) {
      // Place in center for 3D view
      const rect = container.getBoundingClientRect();
      setMarkerPos({
        x: rect.width / 2,
        y: rect.height / 2,
      });
    } else {
      // For Leaflet maps we can compute projected coordinates
      try {
        // Try to get Leaflet map instance
        const leafletMapInstance = (window as any).leafletMapInstance;
        
        if (leafletMapInstance && selectedLocation) {
          // Project lat/lng to pixel coordinates
          const point = leafletMapInstance.latLngToContainerPoint([
            selectedLocation.y,
            selectedLocation.x
          ]);
          
          setMarkerPos({
            x: point.x,
            y: point.y,
          });
        } else {
          // Fallback to center if we can't get the map instance
          const rect = container.getBoundingClientRect();
          setMarkerPos({
            x: rect.width / 2,
            y: rect.height / 2,
          });
        }
      } catch (err) {
        console.error('Error calculating marker position:', err);
        // Fallback to center
        const rect = container.getBoundingClientRect();
        setMarkerPos({
          x: rect.width / 2,
          y: rect.height / 2,
        });
      }
    }
  };
  
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
  
  // Handle fly completion changes
  useEffect(() => {
    // When fly is completed, recalculate the marker position
    if (flyCompleted && !lastFlyCompleted.current && selectedLocation) {
      console.log("Fly completed, recalculating marker position");
      // Give the map a moment to settle before recalculating position
      setTimeout(() => calculateMarkerPosition(), 500);
    }
    
    lastFlyCompleted.current = flyCompleted;
  }, [flyCompleted, selectedLocation]);
  
  useEffect(() => {
    if (!selectedLocation || !mapContainerRef.current) return;
    
    // Calculate initial position
    calculateMarkerPosition();
    
    // Function to schedule position updates with debounce
    const schedulePositionUpdate = () => {
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
      }
      positionUpdateTimerRef.current = window.setTimeout(() => {
        calculateMarkerPosition();
        positionUpdateTimerRef.current = null;
      }, 200);
    };
    
    // Save the function so we can reference it in the useEffect cleanup
    const handleMapMove = schedulePositionUpdate;
    
    // Add event listeners for map movements and resizing
    window.addEventListener('mapMove', handleMapMove);
    window.addEventListener('resize', handleMapMove);
    
    // Recalculate position periodically while showing tag (for transitions)
    const intervalId = setInterval(() => {
      if (!flyCompleted) {
        calculateMarkerPosition();
      }
    }, 500);
    
    return () => {
      window.removeEventListener('mapMove', handleMapMove);
      window.removeEventListener('resize', handleMapMove);
      clearInterval(intervalId);
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
        positionUpdateTimerRef.current = null;
      }
    };
  }, [selectedLocation, flyCompleted]);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
  };

  const handleCloseTag = () => {
    setSelectedLocation(null);
    setMarkerPos(null);
  };

  return (
    <>
      <div 
        className="absolute top-4 left-0 right-0 z-[10000] mx-auto" 
        style={{ 
          maxWidth: '400px',
        }}
      >
        <LocationSearch onLocationSelect={handleLocationSelect} />
      </div>

      {selectedLocation && markerPos && mapContainerRef.current && mapLoaded && createPortal(
        <div 
          style={{
            position: 'absolute',
            left: `${markerPos.x}px`,
            top: `${markerPos.y}px`,
            pointerEvents: 'auto',
          }}
        >
          <LocationTag location={selectedLocation} onClose={handleCloseTag} />
        </div>,
        mapContainerRef.current
      )}
    </>
  );
};

export default MapSearchOverlay;
