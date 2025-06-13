import React, { useEffect, useState } from 'react';
import SavedLocationsDropdown from '../SavedLocationsDropdown';
import DownloadButton from './DownloadButton';

interface MapHeaderProps {
  onLocationSelect: (position: [number, number]) => void;
  isMapReady?: boolean;
  showDownloadButton?: boolean;
  showSavedLocationsDropdown?: boolean;
}

const MapHeader: React.FC<MapHeaderProps> = ({ 
  onLocationSelect, 
  isMapReady = false,
  showDownloadButton = true,
  showSavedLocationsDropdown = true
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [actualMapReady, setActualMapReady] = useState(isMapReady);
  
  // Enhanced map ready detection
  useEffect(() => {
    const checkMapReady = () => {
      // Check for Leaflet map instances
      const leafletContainers = document.querySelectorAll('.leaflet-container');
      const hasLeafletMap = leafletContainers.length > 0;
      
      // Check if any map container has been initialized
      let hasInitializedMap = false;
      leafletContainers.forEach(container => {
        if ((container as any)._leaflet_id) {
          hasInitializedMap = true;
        }
      });
      
      const mapIsReady = isMapReady || (hasLeafletMap && hasInitializedMap);
      
      if (mapIsReady !== actualMapReady) {
        console.log('Map ready state changed:', { 
          isMapReady, 
          hasLeafletMap, 
          hasInitializedMap, 
          finalState: mapIsReady 
        });
        setActualMapReady(mapIsReady);
      }
    };
    
    // Initial check
    checkMapReady();
    
    // Set up interval to check map ready state
    const interval = setInterval(checkMapReady, 1000);
    
    // Listen for map initialization events
    const handleMapInit = () => {
      setTimeout(checkMapReady, 100);
    };
    
    window.addEventListener('mapInitialized', handleMapInit);
    window.addEventListener('leafletMapReady', handleMapInit);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mapInitialized', handleMapInit);
      window.removeEventListener('leafletMapReady', handleMapInit);
    };
  }, [isMapReady, actualMapReady]);
  
  // Check if the header is actually visible in the DOM
  useEffect(() => {
    const checkVisibility = () => {
      const element = document.querySelector('[data-map-header="true"]');
      const newVisibility = !!element && document.body.contains(element);
      if (newVisibility !== isVisible) {
        setIsVisible(newVisibility);
      }
    };
    
    checkVisibility();
    
    // Set up a mutation observer to detect DOM changes
    const observer = new MutationObserver(checkVisibility);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  const handleLocationSelect = (position: [number, number]) => {
    if (!isVisible) {
      console.warn("Map header is not visible, cannot select location");
      return;
    }
    
    onLocationSelect(position);
  };

  // Only log significant state changes to reduce console noise
  const shouldLog = actualMapReady !== isMapReady || !isVisible;
  if (shouldLog) {
    console.log('MapHeader render:', { 
      isMapReady: actualMapReady, 
      isVisible, 
      propMapReady: isMapReady,
      showDownloadButton,
      showSavedLocationsDropdown
    });
  }

  return (
    <div 
      className="absolute top-4 right-4 z-[1001] flex gap-2" 
      data-map-header="true"
      style={{ pointerEvents: 'auto', marginRight: '27px' }}
    >
      {showDownloadButton && (
        <DownloadButton disabled={!actualMapReady} />
      )}
      {showSavedLocationsDropdown && (
        <SavedLocationsDropdown 
          onLocationSelect={handleLocationSelect} 
          isMapReady={actualMapReady && isVisible}
        />
      )}
    </div>
  );
};

export default MapHeader;
