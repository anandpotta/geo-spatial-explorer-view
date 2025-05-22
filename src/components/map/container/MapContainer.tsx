
import React, { useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, AttributionControl } from 'react-leaflet';
// Import CSS directly from node_modules
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
// Import our custom overrides
import '@/styles/leaflet-overrides.css';

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
  
  // Create a style to ensure that map tiles are visible
  const mapStyle = { 
    width: '100%', 
    height: '100%',
    zIndex: 1, // Ensure z-index is set
    opacity: 1  // Ensure opacity is set to 1
  };
  
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
      style={mapStyle}
      whenReady={() => {
        console.log(`MapContainer: Map ready, key=${mapKey}`);
        // Fire a custom event to notify components that Leaflet map is ready
        window.dispatchEvent(new CustomEvent('leafletMapReady', { detail: { mapKey } }));
        
        // Access the map instance through the global variable
        const leafletMap = document.querySelector(`.leaflet-container[data-map-key="${mapKey}"]`);
        if (leafletMap) {
          leafletMap.setAttribute('data-instance-id', mapKey);
        }
      }}
    >
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        maxZoom={19}
        subdomains={['a', 'b', 'c']}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        className="leaflet-tile-pane"
        eventHandlers={{
          load: () => {
            console.log("MapContainer: Tile layer loaded");
          },
          error: (e) => {
            console.error("MapContainer: Tile layer error", e);
          }
        }}
      />
      <AttributionControl position="bottomright" prefix={false} />
      
      {children}
    </LeafletMapContainer>
  );
};

export default MapContainer;
