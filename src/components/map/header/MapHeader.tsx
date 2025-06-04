
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import SavedLocationsDropdown from '../SavedLocationsDropdown';
import DownloadButton from './DownloadButton';

interface MapHeaderProps {
  onLocationSelect: (position: [number, number]) => void;
  isMapReady?: boolean;
}

const MapHeader: React.FC<MapHeaderProps> = ({ onLocationSelect, isMapReady = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Stable location select handler with no dependencies to prevent re-renders
  const handleLocationSelect = useCallback((position: [number, number]) => {
    onLocationSelect(position);
  }, [onLocationSelect]);

  // Only check visibility once when component mounts
  useEffect(() => {
    const element = document.querySelector('[data-map-header="true"]');
    const visible = !!element && document.body.contains(element);
    setIsVisible(visible);
  }, []); // Empty dependency array - only run once

  // Completely memoize the component content to prevent any re-renders
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
  ), [handleLocationSelect, isMapReady, isVisible]); // Only re-render if these specific values change

  return memoizedContent;
};

// Completely prevent re-renders with React.memo and custom comparison
export default React.memo(MapHeader, (prevProps, nextProps) => {
  // Only re-render if isMapReady actually changes
  return prevProps.isMapReady === nextProps.isMapReady && 
         prevProps.onLocationSelect === nextProps.onLocationSelect;
});
