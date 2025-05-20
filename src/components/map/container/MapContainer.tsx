
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
  // Add a useEffect to log when this component mounts and unmounts
  useEffect(() => {
    console.log(`MapContainer mounted with key: ${mapKey}`);
    
    return () => {
      console.log(`MapContainer unmounting with key: ${mapKey}`);
      // Force any global map cleanup here if needed
      if (window._leafletMapInstances) {
        window._leafletMapInstances = [];
      }
    };
  }, [mapKey]);
  
  return (
    <div className="leaflet-container-wrapper w-full h-full" data-map-key={mapKey}>
      <LeafletMapContainer 
        key={`leaflet-${mapKey}`}
        className="w-full h-full"
        attributionControl={false}
        center={position}
        zoom={zoom}
        zoomControl={false}
        fadeAnimation={true}
        markerZoomAnimation={true}
        preferCanvas={true}
        id={`map-${mapKey}`}
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
