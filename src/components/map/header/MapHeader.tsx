
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import SavedLocationsDropdown from '../SavedLocationsDropdown';
import DownloadButton from './DownloadButton';

interface MapHeaderProps {
  onLocationSelect: (position: [number, number]) => void;
  isMapReady?: boolean;
}

const MapHeader: React.FC<MapHeaderProps> = ({ onLocationSelect, isMapReady = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasCheckedVisibility, setHasCheckedVisibility] = useState(false);
  
  // Memoize the location select handler to prevent unnecessary re-renders
  const handleLocationSelect = useCallback((position: [number, number]) => {
    if (!isVisible) {
      console.warn("Map header is not visible, cannot select location");
      return;
    }
    
    onLocationSelect(position);
  }, [isVisible, onLocationSelect]);

  // Only check visibility once on mount and when isMapReady changes
  useEffect(() => {
    if (!hasCheckedVisibility && isMapReady) {
      const checkVisibility = () => {
        const element = document.querySelector('[data-map-header="true"]');
        const visible = !!element && document.body.contains(element);
        setIsVisible(visible);
        setHasCheckedVisibility(true);
      };
      
      checkVisibility();
    }
  }, [isMapReady, hasCheckedVisibility]);

  // Memoize the component to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => (
    <div 
      className="absolute top-4 right-4 z-[1001] flex gap-2" 
      data-map-header="true"
      style={{ pointerEvents: 'auto', marginRight: '27px' }}
    >
      <DownloadButton disabled={false} />
      <SavedLocationsDropdown 
        onLocationSelect={handleLocationSelect} 
        isMapReady={isMapReady && isVisible}
      />
    </div>
  ), [handleLocationSelect, isMapReady, isVisible]);

  return memoizedContent;
};

export default React.memo(MapHeader);
