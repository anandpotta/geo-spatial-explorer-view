
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
  // Clear any existing map instances from the DOM before mounting
  useEffect(() => {
    // Find and remove any orphaned Leaflet container classes
    const cleanup = () => {
      const orphanedContainers = document.querySelectorAll('.leaflet-container');
      orphanedContainers.forEach(container => {
        if (!document.body.contains(container.parentElement)) {
          container.remove();
        }
      });
    };
    
    cleanup();
    return cleanup;
  }, [mapKey]);
  
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
      // Add additional props to help with instance cleanup
      whenCreated={(map) => {
        // Store instance ID on the container element
        const container = map.getContainer();
        container.dataset.instanceId = mapKey;
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
  );
};

export default MapContainer;
