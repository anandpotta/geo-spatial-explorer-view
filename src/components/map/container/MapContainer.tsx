
import React, { useEffect, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import { safeInvalidateSize, forceMapTileRefresh } from '@/utils/leaflet-type-utils';
import { useMap } from 'react-leaflet';
// Import CSS directly from node_modules
import 'leaflet/dist/leaflet.css';

// Helper component to handle map initialization and tile refreshes
const MapInitializer = () => {
  const map = useMap();
  const refreshAttemptsRef = useRef(0);
  
  useEffect(() => {
    if (!map) return;
    
    // Handle initial setup
    const handleInitialSetup = () => {
      safeInvalidateSize(map);
      
      // Set up periodic tile refreshes
      const refreshIntervals = [500, 1500, 3000]; // ms
      
      refreshIntervals.forEach((delay) => {
        setTimeout(() => {
          if (refreshAttemptsRef.current < 5) {
            refreshAttemptsRef.current++;
            console.log(`Refreshing map tiles (attempt ${refreshAttemptsRef.current})`);
            forceMapTileRefresh(map);
          }
        }, delay);
      });
    };
    
    handleInitialSetup();
    
    return () => {
      refreshAttemptsRef.current = 5; // Stop any pending refreshes
    };
  }, [map]);
  
  return null;
};

interface MapContainerProps {
  position: [number, number];
  zoom: number;
  mapKey: string;
  children: React.ReactNode;
}

const MapContainer: React.FC<MapContainerProps> = ({ position, zoom, mapKey, children }) => {
  return (
    <LeafletMapContainer 
      key={mapKey}
      className="w-full h-full"
      attributionControl={false}
      center={position}
      zoom={zoom}
      zoomControl={false}
      fadeAnimation={true}
      markerZoomAnimation={true}
      preferCanvas={true}
    >
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        maxZoom={19}
        subdomains={['a', 'b', 'c']}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        className="leaflet-tile-pane"
      />
      <AttributionControl position="bottomright" prefix={false} />
      <MapInitializer />
      
      {children}
    </LeafletMapContainer>
  );
};

export default MapContainer;
