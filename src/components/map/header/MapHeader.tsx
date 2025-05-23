
import React, { useEffect, useState } from 'react';
import SavedLocationsDropdown from '../SavedLocationsDropdown';
import DownloadButton from './DownloadButton';

interface MapHeaderProps {
  onLocationSelect: (position: [number, number]) => void;
  isMapReady?: boolean;
}

const MapHeader: React.FC<MapHeaderProps> = ({ onLocationSelect, isMapReady = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Check if the header is actually visible in the DOM
  useEffect(() => {
    const checkVisibility = () => {
      // Simple check if the component is mounted in the DOM
      const element = document.querySelector('[data-map-header="true"]');
      setIsVisible(!!element && document.body.contains(element));
    };
    
    checkVisibility();
    
    // Set up a mutation observer to detect DOM changes
    const observer = new MutationObserver(checkVisibility);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLocationSelect = (position: [number, number]) => {
    if (!isVisible) {
      console.warn("Map header is not visible, cannot select location");
      return;
    }
    
    onLocationSelect(position);
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex gap-2" data-map-header="true">
      <DownloadButton disabled={!isMapReady || !isVisible} />
      <SavedLocationsDropdown 
        onLocationSelect={handleLocationSelect} 
        isMapReady={isMapReady && isVisible}
      />
    </div>
  );
};

export default MapHeader;
