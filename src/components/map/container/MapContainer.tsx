
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
    
    // Create a global leaflet map availability check
    (window as any).isLeafletMapAvailable = false;
    
    return () => {
      cleanup();
      (window as any).isLeafletMapAvailable = false;
    };
  }, [mapKey]);
  
  // Define and store the map handler function for whenReady event
  const handleMapLoad = React.useCallback(() => {
    // Mark the map as available
    (window as any).isLeafletMapAvailable = true;
    
    // Access the map instance through the global variable
    const leafletMap = document.querySelector(`.leaflet-container[data-map-key="${mapKey}"]`);
    if (leafletMap) {
      leafletMap.setAttribute('data-instance-id', mapKey);
    }
    
    // Get the map instance directly from the event callback context
    // We'll need to use whenCreated for resizing since whenReady doesn't provide the event
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
      whenCreated={(map) => {
        // Mark the container for easy identification
        const container = map.getContainer();
        if (container) {
          container.dataset.mapKey = mapKey;
        }
        
        // Force a resize on load with setTimeout for better reliability
        setTimeout(() => {
          try {
            if (map && typeof map.invalidateSize === 'function') {
              map.invalidateSize(true);
              console.log('Map size invalidated on creation');
            }
          } catch (err) {
            console.warn('Error resizing map on load:', err);
          }
        }, 100);
      }}
      whenReady={handleMapLoad}
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
