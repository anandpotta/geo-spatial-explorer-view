
import React, { useEffect, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import { v4 as uuidv4 } from 'uuid';
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
  const isUnmountingRef = useRef(false);
  const uniqueIdRef = useRef(`map-${mapKey}-${uuidv4()}`);
  const mountTimeRef = useRef(Date.now());

  // This ensures we provide a new container for each map instance
  useEffect(() => {
    const cleanupMapElements = () => {
      // Clean up any map-related DOM elements that might be left behind
      if (containerRef.current) {
        // First mark this container as unmounted
        containerRef.current.dataset.unmounted = 'true';
        containerRef.current.dataset.unmountTime = Date.now().toString();
        
        // Find and remove any orphaned leaflet elements
        const mapId = containerRef.current.id || '';
        document.querySelectorAll(`.leaflet-marker-icon[data-container-id="${mapId}"]`).forEach(el => {
          el.remove();
        });
        
        // Explicitly remove all markers when unmounting
        document.querySelectorAll('.leaflet-marker-icon, .leaflet-marker-shadow').forEach(el => {
          if (el.getAttribute('data-map-key') === mapKey) {
            el.remove();
          }
        });
      }
    };
    
    // Register container
    if (containerRef.current) {
      containerRef.current.setAttribute('data-map-key', mapKey);
      containerRef.current.setAttribute('data-mount-time', mountTimeRef.current.toString());
    }
    
    // Handle clearAllMarkers event
    const handleClearAllMarkers = () => {
      if (containerRef.current) {
        // Target elements with our specific map key
        document.querySelectorAll(`.leaflet-marker-icon[data-map-key="${mapKey}"]`).forEach(el => {
          el.remove();
        });
        document.querySelectorAll(`.leaflet-marker-shadow[data-map-key="${mapKey}"]`).forEach(el => {
          el.remove();
        });
        
        // Also check the marker pane inside this container
        const markerPaneSelector = '.leaflet-marker-pane';
        const markerPane = containerRef.current.querySelector(markerPaneSelector);
        if (markerPane) {
          const markers = markerPane.querySelectorAll('.leaflet-marker-icon');
          markers.forEach(marker => marker.remove());
          
          const shadows = document.querySelector('.leaflet-shadow-pane')?.querySelectorAll('.leaflet-marker-shadow');
          shadows?.forEach(shadow => shadow.remove());
          
          console.log('Removed all marker elements from DOM');
        }
      }
    };

    // Listen for map view cleanup events
    const handleMapViewCleanup = (event: CustomEvent) => {
      const detail = event.detail || {};
      console.log(`Map view cleanup event detected, previous view: ${detail.previousView}`);
      cleanupMapElements();
    };
    
    window.addEventListener('clearAllMarkers', handleClearAllMarkers);
    window.addEventListener('mapViewCleanup', handleMapViewCleanup as EventListener);
    
    return () => {
      // Set unmounting flag before cleanup
      isUnmountingRef.current = true;
      // Clean up any global references to the map we might have
      window.removeEventListener('clearAllMarkers', handleClearAllMarkers);
      window.removeEventListener('mapViewCleanup', handleMapViewCleanup as EventListener);
      cleanupMapElements();
    };
  }, [mapKey]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      id={uniqueIdRef.current}
      data-map-key={mapKey}
      data-created-at={Date.now()}
      data-container-type="leaflet-map"
      data-active="false"
    >
      <LeafletMapContainer 
        key={uniqueIdRef.current} // Ensure a new instance is created when key changes
        className="w-full h-full"
        attributionControl={false}
        center={position}
        zoom={zoom}
        zoomControl={false}
        fadeAnimation={true}
        markerZoomAnimation={true}
        preferCanvas={true}
        whenReady={() => {  // Fix: Changed from (map: any) => void to () => void
          // Mark container with map instance ID
          if (containerRef.current) {
            // Set a timestamp as instance ID since we can't access the internal _leaflet_id safely
            containerRef.current.setAttribute('data-map-instance-id', Date.now().toString());
            // Mark this as the active container
            containerRef.current.setAttribute('data-active', 'true');
            containerRef.current.setAttribute('data-initialized', 'true');
            
            // Get the map container from the current DOM structure
            const mapContainer = containerRef.current.querySelector('.leaflet-container');
            if (mapContainer) {
              mapContainer.setAttribute('data-leaflet-container', uniqueIdRef.current);
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
    </div>
  );
};

export default MapContainer;
