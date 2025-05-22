
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
  const maxRefreshAttempts = 8; // Increased from 5
  
  useEffect(() => {
    if (!map) return;
    
    // Handle initial setup
    const handleInitialSetup = () => {
      safeInvalidateSize(map);
      
      // Set up more frequent tile refreshes
      const refreshIntervals = [200, 500, 1000, 1500, 2500, 3500]; // ms - Added more intervals
      
      refreshIntervals.forEach((delay) => {
        setTimeout(() => {
          if (refreshAttemptsRef.current < maxRefreshAttempts) {
            refreshAttemptsRef.current++;
            console.log(`Refreshing map tiles (attempt ${refreshAttemptsRef.current})`);
            
            // Try to ensure the map pane has _leaflet_pos before refreshing
            try {
              const mapPane = map.getPane('mapPane');
              if (mapPane && !(mapPane as any)._leaflet_pos) {
                console.log('Creating _leaflet_pos for mapPane');
                (mapPane as any)._leaflet_pos = { x: 0, y: 0 };
              }
            } catch (e) {
              console.warn('Error accessing map pane:', e);
            }
            
            forceMapTileRefresh(map);
          }
        }, delay);
      });
    };
    
    handleInitialSetup();
    
    // Add a final check and refresh after all intervals
    setTimeout(() => {
      if (map && refreshAttemptsRef.current >= maxRefreshAttempts) {
        console.log('Final map refresh attempt');
        forceMapTileRefresh(map);
      }
    }, 4000);
    
    return () => {
      refreshAttemptsRef.current = maxRefreshAttempts; // Stop any pending refreshes
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
