
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import LocationSearch from '@/components/LocationSearch';
import { Location } from '@/utils/geo-utils';
import LocationTag from './LocationTag';

interface MapSearchOverlayProps {
  onLocationSelect: (location: Location) => void;
}

const MapSearchOverlay: React.FC<MapSearchOverlayProps> = ({ onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  
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
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  useEffect(() => {
    if (!selectedLocation || !mapContainerRef.current) return;
    
    // Calculate marker position in the visible viewport
    const calculateMarkerPosition = () => {
      const container = mapContainerRef.current;
      if (!container) return;
      
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
    
    calculateMarkerPosition();
    
    // Recalculate when the map moves
    const handleMapMove = () => {
      calculateMarkerPosition();
    };
    
    window.addEventListener('mapMove', handleMapMove);
    window.addEventListener('resize', calculateMarkerPosition);
    
    return () => {
      window.removeEventListener('mapMove', handleMapMove);
      window.removeEventListener('resize', calculateMarkerPosition);
    };
  }, [selectedLocation]);

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

      {selectedLocation && markerPos && mapContainerRef.current && createPortal(
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
