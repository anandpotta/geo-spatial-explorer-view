
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapReferenceProps {
  onMapReady?: (map: L.Map) => void;
}

/**
 * Component that passes the map reference to parent components
 * Uses useMap hook instead of directly accessing ref prop
 */
const MapReference: React.FC<MapReferenceProps> = ({ onMapReady }) => {
  // Get map instance using the useMap hook from react-leaflet
  const map = useMap();
  
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  // This component doesn't render anything visible
  return null;
};

export default MapReference;
