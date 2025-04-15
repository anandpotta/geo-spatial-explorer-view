
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const hasCalledOnReady = useRef(false);
  
  useEffect(() => {
    if (map && onMapReady && !hasCalledOnReady.current) {
      hasCalledOnReady.current = true;
      console.log('Map is ready, calling onMapReady');
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  // Return null as this is just a utility component
  return null;
};

export default MapReference;
