
import React, { useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, AttributionControl } from 'react-leaflet';
// Import CSS directly from node_modules
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  position: [number, number];
  zoom: number;
  mapKey: string;
  children: React.ReactNode;
}

const MapContainer: React.FC<MapContainerProps> = ({ position, zoom, mapKey, children }) => {
  // This will help ensure container IDs are unique across instances
  const mapContainerId = `map-container-${mapKey}`;
  
  return (
    <div id={mapContainerId} className="w-full h-full">
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
        whenReady={() => {
          // Map ready callback - the map instance will be available through useMap hook in child components
          console.log(`Map container ${mapContainerId} is ready`);
        }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          maxZoom={19}
          subdomains={['a', 'b', 'c']}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          className="leaflet-tile-pane"
        />
        <AttributionControl position="bottomright" prefix={false} />
        
        {children}
      </LeafletMapContainer>
    </div>
  );
};

export default MapContainer;
