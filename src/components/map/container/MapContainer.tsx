
import React, { useEffect, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, AttributionControl } from 'react-leaflet';
// Import CSS directly from node_modules
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  position: [number, number];
  zoom: number;
  mapKey: string;
  children: React.ReactNode;
  onMapReady?: (map: L.Map) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  position, 
  zoom, 
  mapKey, 
  children,
  onMapReady 
}) => {
  const mapRef = useRef<L.Map | null>(null);
  
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
  
  // Handle map initialization
  const handleMapInit = (map: L.Map | null) => {
    // Safely handle null map scenario
    if (!map) {
      console.warn("Map initialization failed - map object is null");
      return;
    }
    
    try {
      console.log("Map initialized with zoom:", map.getZoom());
      mapRef.current = map;
      
      // Give the map time to fully render before calling onMapReady
      setTimeout(() => {
        if (onMapReady && map) {
          console.log("Calling onMapReady callback");
          onMapReady(map);
        }
      }, 200);
      
      // Add a custom attribute to help identify this map instance
      const container = map.getContainer();
      container.setAttribute('data-instance-id', mapKey);
    } catch (err) {
      console.error("Error during map initialization:", err);
    }
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
      ref={handleMapInit}
      whenReady={() => {
        console.log("Map is ready");
        // Additional initialization can happen here
        if (mapRef.current) {
          try {
            mapRef.current.invalidateSize(true);
          } catch (error) {
            console.error("Error invalidating map size:", error);
          }
        }
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
