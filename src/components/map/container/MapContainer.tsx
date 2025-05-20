
import React, { useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // This ensures we provide a new container for each map instance
  useEffect(() => {
    return () => {
      // Clean up any global references to the map we might have
      if (containerRef.current) {
        // Add a data attribute to mark this container as unmounted
        containerRef.current.dataset.unmounted = 'true';
      }
    };
  }, [mapKey]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <LeafletMapContainer 
        key={mapKey} // Ensure a new instance is created when key changes
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
        
        {children}
      </LeafletMapContainer>
    </div>
  );
};

export default MapContainer;
